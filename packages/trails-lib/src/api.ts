import { desc, eq, gt, lt, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { type TrailsDb } from './db.js';
import { TrailsError, TrailsDbError } from './errors.js';
import { retryDb } from './retry.js';
import { notes } from './schema.js';

export interface NoteInput {
  agentId: string;
  md: string;
  ts?: number;
}

export interface ListOptions {
  agentId?: string;
  after?: number;
  before?: number;
  limit?: number;
}

export interface Note {
  id: string;
  agentId: string;
  ts: number;
  md: string;
}

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
