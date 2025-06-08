import { desc, eq, gt, lt, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { type TrailsDb } from './db.js';
import { TrailsError, TrailsDbError } from './errors.js';
import { retryDb } from './retry.js';
import { notes } from './schema.js';

/**
 * Input parameters for creating a new note
 */
export interface NoteInput {
  /** The ID of the agent creating the note */
  agentId: string;
  /** The markdown content of the note */
  md: string;
  /** Optional timestamp in milliseconds (defaults to current time) */
  ts?: number;
}

/**
 * Options for listing notes
 */
export interface ListOptions {
  /** Filter notes by agent ID */
  agentId?: string;
  /** Only return notes created after this timestamp (milliseconds) */
  after?: number;
  /** Only return notes created before this timestamp (milliseconds) */
  before?: number;
  /** Maximum number of notes to return (default: 20) */
  limit?: number;
}

/**
 * A note in the trails system
 */
export interface Note {
  /** Unique identifier for the note */
  id: string;
  /** The ID of the agent that created this note */
  agentId: string;
  /** Timestamp when the note was created (milliseconds) */
  ts: number;
  /** The markdown content of the note */
  md: string;
}

/**
 * Adds a new note to the database
 * 
 * @param db - The database connection
 * @param input - The note input containing agentId, markdown content, and optional timestamp
 * @returns The ID of the newly created note
 * @throws {TrailsDbError} If the database operation fails after retries
 * @throws {TrailsError} If validation fails or other non-retryable error occurs
 * 
 * @example
 * ```typescript
 * const noteId = await addNote(db, {
 *   agentId: 'cli-agent',
 *   md: 'This is my note content',
 *   ts: Date.now()
 * });
 * console.log(`Created note: ${noteId}`);
 * ```
 */
export async function addNote(db: TrailsDb, input: NoteInput): Promise<string> {
  return retryDb(async () => {
    try {
      const id = uuidv4();
      const timestamp = input.ts ?? Date.now();

      await db.insert(notes).values({
        id,
        agentId: input.agentId,
        ts: timestamp,
        md: input.md,
      });

      return id;
    } catch (err) {
      // If it's a database error, throw as TrailsDbError to enable retry
      if (err instanceof Error && err.message.includes('SQLITE')) {
        throw new TrailsDbError('Failed to add note', 'addNote');
      }
      // Otherwise, wrap in TrailsError (non-retryable)
      throw new TrailsError('Failed to add note', err);
    }
  });
}

/**
 * Lists notes from the database with optional filtering
 * 
 * @param db - The database connection
 * @param options - Optional filters and pagination settings
 * @returns An array of notes matching the criteria, ordered by timestamp descending
 * @throws {TrailsDbError} If the database operation fails after retries
 * @throws {TrailsError} If validation fails or other non-retryable error occurs
 * 
 * @example
 * ```typescript
 * // Get all notes
 * const allNotes = await listNotes(db);
 * 
 * // Get notes for a specific agent
 * const agentNotes = await listNotes(db, {
 *   agentId: 'cli-agent',
 *   limit: 10
 * });
 * 
 * // Get notes within a time range
 * const recentNotes = await listNotes(db, {
 *   after: Date.now() - 86400000, // Last 24 hours
 *   limit: 50
 * });
 * ```
 */
export async function listNotes(db: TrailsDb, options: ListOptions = {}): Promise<Note[]> {
  return retryDb(async () => {
    try {
      const { agentId, after, before, limit = 20 } = options;

      const conditions = [];

      if (agentId !== undefined) {
        conditions.push(eq(notes.agentId, agentId));
      }

      if (after !== undefined) {
        conditions.push(gt(notes.ts, after));
      }

      if (before !== undefined) {
        conditions.push(lt(notes.ts, before));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const query = whereClause
        ? db.select().from(notes).where(whereClause).orderBy(desc(notes.ts)).limit(limit)
        : db.select().from(notes).orderBy(desc(notes.ts)).limit(limit);

      const results = await query;

      // Results already have the correct types thanks to notNull() in schema
      return results;
    } catch (err) {
      // If it's a database error, throw as TrailsDbError to enable retry
      if (err instanceof Error && err.message.includes('SQLITE')) {
        throw new TrailsDbError('Failed to list notes', 'listNotes');
      }
      // Otherwise, wrap in TrailsError (non-retryable)
      throw new TrailsError('Failed to list notes', err);
    }
  });
}
