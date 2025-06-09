import { desc, eq, gt, lt, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { type FieldbooksDb } from './db.js';
import { FieldbooksError, FieldbooksDbError } from './errors.js';
import { retryDb } from './retry.js';
import { entries } from './schema.js';

export type EntryType =
  | 'update'
  | 'decision'
  | 'error'
  | 'handoff'
  | 'observation'
  | 'task'
  | 'checkpoint';

/**
 * Input parameters for creating a new entry
 */
export interface EntryInput {
  /** The ID of the author creating the entry */
  authorId: string;
  /** The markdown content of the entry */
  md: string;
  /** Optional timestamp in milliseconds (defaults to current time) */
  ts?: number;
  /** Optional type of entry (defaults to 'update') */
  type?: EntryType;
}

/**
 * Options for listing entries
 */
export interface ListOptions {
  /** Filter entries by author ID */
  authorId?: string;
  /** Only return entries created after this timestamp (milliseconds) */
  after?: number;
  /** Only return entries created before this timestamp (milliseconds) */
  before?: number;
  /** Maximum number of entries to return (default: 20) */
  limit?: number;
  /** Filter by entry type */
  type?: EntryType;
}

/**
 * An entry in the fieldbooks system
 */
export interface Entry {
  /** Unique identifier for the entry */
  id: string;
  /** The ID of the author that created this entry */
  authorId: string;
  /** Timestamp when the entry was created (milliseconds) */
  ts: number;
  /** The markdown content of the entry */
  md: string;
  /** The type of entry */
  type?: string;
}

/**
 * Adds a new entry to the database
 *
 * @param db - The database connection
 * @param input - The entry input containing authorId, markdown content, and optional timestamp
 * @returns The ID of the newly created entry
 * @throws {FieldbooksDbError} If the database operation fails after retries
 * @throws {FieldbooksError} If validation fails or other non-retryable error occurs
 *
 * @example
 * ```typescript
 * const entryId = await addEntry(db, {
 *   authorId: 'cli-author',
 *   md: 'This is my entry content',
 *   ts: Date.now(),
 *   type: 'update'
 * });
 * console.log(`Created entry: ${entryId}`);
 * ```
 */
export async function addEntry(db: FieldbooksDb, input: EntryInput): Promise<string> {
  return retryDb(async () => {
    try {
      const id = uuidv4();
      const timestamp = input.ts ?? Date.now();

      await db.insert(entries).values({
        id,
        authorId: input.authorId,
        ts: timestamp,
        md: input.md,
        type: input.type || 'update',
      });

      return id;
    } catch (err) {
      // If it's a database error, throw as FieldbooksDbError to enable retry
      if (err instanceof Error && err.message.includes('SQLITE')) {
        throw new FieldbooksDbError('Failed to add entry', 'addEntry');
      }
      // Otherwise, wrap in FieldbooksError (non-retryable)
      throw new FieldbooksError('Failed to add entry', err);
    }
  });
}

/**
 * Lists entries from the database with optional filtering
 *
 * @param db - The database connection
 * @param options - Optional filters and pagination settings
 * @returns An array of entries matching the criteria, ordered by timestamp descending
 * @throws {FieldbooksDbError} If the database operation fails after retries
 * @throws {FieldbooksError} If validation fails or other non-retryable error occurs
 *
 * @example
 * ```typescript
 * // Get all entries
 * const allEntries = await listEntries(db);
 *
 * // Get entries for a specific author
 * const authorEntries = await listEntries(db, {
 *   authorId: 'cli-author',
 *   limit: 10
 * });
 *
 * // Get entries within a time range
 * const recentEntries = await listEntries(db, {
 *   after: Date.now() - 86400000, // Last 24 hours
 *   limit: 50
 * });
 * ```
 */
export async function listEntries(db: FieldbooksDb, options: ListOptions = {}): Promise<Entry[]> {
  return retryDb(async () => {
    try {
      const { authorId, after, before, limit = 20, type } = options;

      const conditions = [];

      if (authorId !== undefined) {
        conditions.push(eq(entries.authorId, authorId));
      }

      if (after !== undefined) {
        conditions.push(gt(entries.ts, after));
      }

      if (before !== undefined) {
        conditions.push(lt(entries.ts, before));
      }

      if (type !== undefined) {
        conditions.push(eq(entries.type, type));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const query = whereClause
        ? db.select().from(entries).where(whereClause).orderBy(desc(entries.ts)).limit(limit)
        : db.select().from(entries).orderBy(desc(entries.ts)).limit(limit);

      const results = await query;

      // Results already have the correct types thanks to notNull() in schema
      return results;
    } catch (err) {
      // If it's a database error, throw as FieldbooksDbError to enable retry
      if (err instanceof Error && err.message.includes('SQLITE')) {
        throw new FieldbooksDbError('Failed to list entries', 'listEntries');
      }
      // Otherwise, wrap in FieldbooksError (non-retryable)
      throw new FieldbooksError('Failed to list entries', err);
    }
  });
}
