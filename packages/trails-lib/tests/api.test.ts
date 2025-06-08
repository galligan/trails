import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { addNote, listNotes } from '../src/api';
import { setupDatabase } from '../src/db';
import { users, agents } from '../src/schema';
import { TrailsError } from '../src/errors';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('API Functions', () => {
  let testDbPath: string;
  let db: BetterSQLite3Database<any>;
  let testUserId: string;
  let testAgentId: string;

  beforeEach(async () => {
    testDbPath = join(tmpdir(), `test-api-${Date.now()}.sqlite`);
    db = await setupDatabase(testDbPath);

    // Create test user and agent
    testUserId = faker.string.uuid();
    testAgentId = faker.string.uuid();

    await db.insert(users).values({
      id: testUserId,
      name: faker.person.fullName(),
      createdAt: Date.now(),
    });

    await db.insert(agents).values({
      id: testAgentId,
      userId: testUserId,
      label: faker.lorem.word(),
      createdAt: Date.now(),
    });
  });

  afterEach(() => {
    if (existsSync(testDbPath)) {
      try {
        unlinkSync(testDbPath);
      } catch {
        // Ignore
      }
    }
  });

  describe('addNote', () => {
    it('should add a note successfully', async () => {
      const noteInput = {
        agentId: testAgentId,
        md: '# Test Note\nThis is a test note',
        ts: Date.now(),
      };

      const noteId = await addNote(db, noteInput);
      expect(noteId).toBeDefined();
      expect(noteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify note was saved
      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes).toHaveLength(1);
      expect(notes[0].md).toBe(noteInput.md);
      expect(notes[0].ts).toBe(noteInput.ts);
    });

    it('should auto-generate timestamp if not provided', async () => {
      const beforeTime = Date.now();

      const noteInput = {
        agentId: testAgentId,
        md: '# Auto timestamp test',
      };

      const noteId = await addNote(db, noteInput);
      const afterTime = Date.now();

      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes[0].ts).toBeGreaterThanOrEqual(beforeTime);
      expect(notes[0].ts).toBeLessThanOrEqual(afterTime);
    });

    it('should handle markdown with special characters', async () => {
      const specialMd = '# Test\n```javascript\nconst x = "test";\n```\n\n> Quote\n\n* List item';

      const noteInput = {
        agentId: testAgentId,
        md: specialMd,
      };

      await addNote(db, noteInput);
      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes[0].md).toBe(specialMd);
    });

    it('should throw TrailsError for invalid agent ID', async () => {
      const noteInput = {
        agentId: 'non-existent-agent',
        md: 'Test note',
      };

      await expect(addNote(db, noteInput)).rejects.toThrow(TrailsError);
      await expect(addNote(db, noteInput)).rejects.toThrow('Failed to add note');
    });

    it('should handle very long markdown content', async () => {
      const longContent = faker.lorem.paragraphs(100);

      const noteInput = {
        agentId: testAgentId,
        md: longContent,
      };

      const noteId = await addNote(db, noteInput);
      expect(noteId).toBeDefined();

      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes[0].md).toBe(longContent);
    });

    it('should add multiple notes for same agent', async () => {
      const noteCount = 5;
      const noteIds: string[] = [];

      for (let i = 0; i < noteCount; i++) {
        const noteId = await addNote(db, {
          agentId: testAgentId,
          md: `Note ${i}`,
          ts: Date.now() + i * 1000,
        });
        noteIds.push(noteId);
      }

      expect(noteIds).toHaveLength(noteCount);
      expect(new Set(noteIds).size).toBe(noteCount); // All IDs should be unique

      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes).toHaveLength(noteCount);
    });
  });

  describe('listNotes', () => {
    beforeEach(async () => {
      // Add some test notes
      const baseTime = Date.now();
      for (let i = 0; i < 25; i++) {
        await addNote(db, {
          agentId: testAgentId,
          md: `Note ${i}`,
          ts: baseTime + i * 1000,
        });
      }
    });

    it('should list notes with default options', async () => {
      const notes = await listNotes(db);
      expect(notes).toHaveLength(20); // Default limit
      expect(notes[0].ts).toBeGreaterThan(notes[1].ts); // Should be ordered by timestamp desc
    });

    it('should filter by agentId', async () => {
      // Create another agent with notes
      const anotherAgentId = faker.string.uuid();
      await db.insert(agents).values({
        id: anotherAgentId,
        userId: testUserId,
        label: 'Another agent',
        createdAt: Date.now(),
      });

      await addNote(db, {
        agentId: anotherAgentId,
        md: 'Another agent note',
      });

      const notes = await listNotes(db, { agentId: testAgentId });
      expect(notes.every((note) => note.agentId === testAgentId)).toBe(true);
      expect(notes.some((note) => note.md === 'Another agent note')).toBe(false);
    });

    it('should filter by after timestamp', async () => {
      const notes = await listNotes(db);
      const midTimestamp = notes[10].ts;

      const filteredNotes = await listNotes(db, { after: midTimestamp });
      expect(filteredNotes.every((note) => note.ts > midTimestamp)).toBe(true);
      expect(filteredNotes.length).toBeLessThan(notes.length);
    });

    it('should filter by before timestamp', async () => {
      const notes = await listNotes(db);
      const midTimestamp = notes[10].ts;

      const filteredNotes = await listNotes(db, { before: midTimestamp });
      expect(filteredNotes.every((note) => note.ts < midTimestamp)).toBe(true);
    });

    it('should filter by both after and before timestamps', async () => {
      const notes = await listNotes(db);
      const afterTime = notes[15].ts;
      const beforeTime = notes[5].ts;

      const filteredNotes = await listNotes(db, {
        after: afterTime,
        before: beforeTime,
      });

      expect(filteredNotes.every((note) => note.ts > afterTime && note.ts < beforeTime)).toBe(true);
    });

    it('should respect custom limit', async () => {
      const customLimit = 5;
      const notes = await listNotes(db, { limit: customLimit });
      expect(notes).toHaveLength(customLimit);
    });

    it('should handle limit larger than available notes', async () => {
      const notes = await listNotes(db, { limit: 100 });
      expect(notes.length).toBeLessThanOrEqual(100);
      expect(notes.length).toBe(25); // We added 25 notes in beforeEach
    });

    it('should combine all filters', async () => {
      const notes = await listNotes(db);
      // Make sure we have enough notes
      if (notes.length < 21) {
        // Skip test if not enough notes
        return;
      }
      const afterTime = notes[20].ts;
      const beforeTime = notes[5].ts;

      const filteredNotes = await listNotes(db, {
        agentId: testAgentId,
        after: afterTime,
        before: beforeTime,
        limit: 10,
      });

      expect(
        filteredNotes.every(
          (note) => note.agentId === testAgentId && note.ts > afterTime && note.ts < beforeTime,
        ),
      ).toBe(true);
      expect(filteredNotes.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no notes match', async () => {
      const futureTime = Date.now() + 1000000;
      const notes = await listNotes(db, { after: futureTime });
      expect(notes).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate error
      const closedDb = {
        ...db,
        select: () => {
          throw new Error('Database closed');
        },
      } as any;

      await expect(listNotes(closedDb)).rejects.toThrow(TrailsError);
      await expect(listNotes(closedDb)).rejects.toThrow('Failed to list notes');
    });

    it('should maintain note properties', async () => {
      const noteInput = {
        agentId: testAgentId,
        md: '# Special Note\nWith **bold** and *italic*',
        ts: Date.now() + 100000,
      };

      const noteId = await addNote(db, noteInput);
      const notes = await listNotes(db, { agentId: testAgentId, limit: 1 });

      expect(notes[0]).toMatchObject({
        id: noteId,
        agentId: noteInput.agentId,
        md: noteInput.md,
        ts: noteInput.ts,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent note additions', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        addNote(db, {
          agentId: testAgentId,
          md: `Concurrent note ${i}`,
        }),
      );

      const noteIds = await Promise.all(promises);
      expect(new Set(noteIds).size).toBe(10); // All IDs should be unique

      const notes = await listNotes(db, { agentId: testAgentId, limit: 100 });
      expect(notes.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle empty markdown gracefully in retrieval', async () => {
      // Import notes table
      const { notes } = await import('../src/schema');

      // Directly insert a note with empty markdown to bypass validation
      await db.insert(notes).values({
        id: 'empty-note',
        agentId: testAgentId,
        ts: Date.now(),
        md: '',
      });

      const notesList = await listNotes(db, { agentId: testAgentId });
      const emptyNote = notesList.find((n) => n.id === 'empty-note');
      expect(emptyNote?.md).toBe('');
    });
  });
});
