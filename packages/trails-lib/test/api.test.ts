import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { setupDatabase } from '../src/db.js';
import { addNote, listNotes } from '../src/api.js';
import { users, agents } from '../src/schema.js';
import fs from 'fs';

describe('Trails API', () => {
  const TEST_DB = './test-api.sqlite';
  let db: BetterSQLite3Database;

  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    db = await setupDatabase(TEST_DB);

    // Set up test data - create a test user and agent
    await db.insert(users).values({
      id: 'test-user',
      name: 'Test User',
      createdAt: Date.now(),
    });

    await db.insert(agents).values({
      id: 'test-agent',
      userId: 'test-user',
      label: 'Test Agent',
      createdAt: Date.now(),
    });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  it('should add a note and retrieve it', async () => {
    const noteId = await addNote(db, {
      agentId: 'test-agent',
      md: 'Test note content',
    });

    const retrievedNotes = await listNotes(db, {
      agentId: 'test-agent',
    });

    expect(retrievedNotes).toHaveLength(1);
    expect(retrievedNotes[0].id).toBe(noteId);
    expect(retrievedNotes[0].md).toBe('Test note content');
    expect(retrievedNotes[0].agentId).toBe('test-agent');
  });

  it('should handle empty list', async () => {
    const retrievedNotes = await listNotes(db);
    expect(retrievedNotes).toHaveLength(0);
  });

  it('should limit results', async () => {
    // Add multiple notes
    for (let i = 0; i < 5; i++) {
      await addNote(db, {
        agentId: 'test-agent',
        md: `Test note ${i}`,
      });
    }

    const retrievedNotes = await listNotes(db, { limit: 3 });
    expect(retrievedNotes).toHaveLength(3);
  });
});
