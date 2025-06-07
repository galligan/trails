import { desc, eq, gt, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { notes } from './schema.js';
import { TrailsError } from './errors.js';

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

export async function addNote(db: any, input: NoteInput): Promise<string> {
  try {
    const id = uuidv4();
    const timestamp = input.ts || Date.now();
    
    await db.insert(notes).values({
      id,
      agentId: input.agentId,
      ts: timestamp,
      md: input.md
    });
    
    return id;
  } catch (err) {
    throw new TrailsError('Failed to add note', err);
  }
}

export async function listNotes(
  db: any, 
  options: ListOptions = {}
): Promise<Note[]> {
  try {
    const { agentId, after, before, limit = 20 } = options;
    
    let query = db.select().from(notes);
    
    if (agentId) {
      query = query.where(eq(notes.agentId, agentId));
    }
    
    if (after) {
      query = query.where(gt(notes.ts, after));
    }
    
    if (before) {
      query = query.where(lt(notes.ts, before));
    }
    
    return await query.orderBy(desc(notes.ts)).limit(limit);
  } catch (err) {
    throw new TrailsError('Failed to list notes', err);
  }
}