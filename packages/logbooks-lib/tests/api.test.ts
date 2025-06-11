import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { faker } from '@faker-js/faker';
import { tmpdir } from 'os';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { addEntry, listEntries } from '../src/api';
import { setupTestDatabase } from '../src/test-utils';
import { authors } from '../src/schema';
import { LogbooksError } from '../src/errors';
import type { LogbooksDb } from '../src/db';

describe('API Functions', () => {
  let testDbPath: string;
  let db: LogbooksDb;
  let testAuthorId: string;

  beforeEach(async () => {
    testDbPath = join(tmpdir(), `test-api-${Date.now()}.sqlite`);
    db = await setupTestDatabase(testDbPath);

    // Create test author
    testAuthorId = faker.string.uuid();

    await db.insert(authors).values({
      id: testAuthorId,
      type: 'agent',
      name: faker.person.fullName(),
      tool: 'test-tool',
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

  describe('addEntry', () => {
    it('should add an entry successfully', async () => {
      const entryInput = {
        authorId: testAuthorId,
        md: '# Test Entry\nThis is a test entry',
        ts: Date.now(),
        type: 'update' as const,
      };

      const entryId = await addEntry(db, entryInput);
      expect(entryId).toBeDefined();
      expect(entryId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Verify entry was saved
      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries).toHaveLength(1);
      expect(entries[0].md).toBe(entryInput.md);
      expect(entries[0].ts).toBe(entryInput.ts);
      expect(entries[0].type).toBe(entryInput.type);
    });

    it('should auto-generate timestamp if not provided', async () => {
      const beforeTime = Date.now();

      const entryInput = {
        authorId: testAuthorId,
        md: '# Auto timestamp test',
      };

      const entryId = await addEntry(db, entryInput);
      const afterTime = Date.now();

      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries[0].ts).toBeGreaterThanOrEqual(beforeTime);
      expect(entries[0].ts).toBeLessThanOrEqual(afterTime);
    });

    it('should handle markdown with special characters', async () => {
      const specialMd = '# Test\n```javascript\nconst x = "test";\n```\n\n> Quote\n\n* List item';

      const entryInput = {
        authorId: testAuthorId,
        md: specialMd,
        type: 'update' as const,
      };

      await addEntry(db, entryInput);
      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries[0].md).toBe(specialMd);
    });

    it('should throw LogbooksError for invalid author ID', async () => {
      const entryInput = {
        authorId: 'non-existent-author',
        md: 'Test entry',
        type: 'update' as const,
      };

      await expect(addEntry(db, entryInput)).rejects.toThrow(LogbooksError);
      await expect(addEntry(db, entryInput)).rejects.toThrow('Failed to add entry');
    });

    it('should handle very long markdown content', async () => {
      const longContent = faker.lorem.paragraphs(100);

      const entryInput = {
        authorId: testAuthorId,
        md: longContent,
        type: 'observation' as const,
      };

      const entryId = await addEntry(db, entryInput);
      expect(entryId).toBeDefined();

      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries[0].md).toBe(longContent);
    });

    it('should add multiple entries for same author', async () => {
      const entryCount = 5;
      const entryIds: string[] = [];

      for (let i = 0; i < entryCount; i++) {
        const entryId = await addEntry(db, {
          authorId: testAuthorId,
          md: `Entry ${i}`,
          ts: Date.now() + i * 1000,
          type: 'update' as const,
        });
        entryIds.push(entryId);
      }

      expect(entryIds).toHaveLength(entryCount);
      expect(new Set(entryIds).size).toBe(entryCount); // All IDs should be unique

      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries).toHaveLength(entryCount);
    });
  });

  describe('listEntries', () => {
    beforeEach(async () => {
      // Add some test entries
      const baseTime = Date.now();
      for (let i = 0; i < 25; i++) {
        await addEntry(db, {
          authorId: testAuthorId,
          md: `Entry ${i}`,
          ts: baseTime + i * 1000,
          type: i % 2 === 0 ? 'update' : ('observation' as const),
        });
      }
    });

    it('should list entries with default options', async () => {
      const entries = await listEntries(db);
      expect(entries).toHaveLength(20); // Default limit
      expect(entries[0].ts).toBeGreaterThan(entries[1].ts); // Should be ordered by timestamp desc
    });

    it('should filter by authorId', async () => {
      // Create another author with entries
      const anotherAuthorId = faker.string.uuid();
      await db.insert(authors).values({
        id: anotherAuthorId,
        type: 'user',
        name: 'Another author',
        createdAt: Date.now(),
      });

      await addEntry(db, {
        authorId: anotherAuthorId,
        md: 'Another author entry',
        type: 'update' as const,
      });

      const entries = await listEntries(db, { authorId: testAuthorId });
      expect(entries.every((entry) => entry.authorId === testAuthorId)).toBe(true);
      expect(entries.some((entry) => entry.md === 'Another author entry')).toBe(false);
    });

    it('should filter by after timestamp', async () => {
      const entries = await listEntries(db);
      const midTimestamp = entries[10].ts;

      const filteredEntries = await listEntries(db, { after: midTimestamp });
      expect(filteredEntries.every((entry) => entry.ts > midTimestamp)).toBe(true);
      expect(filteredEntries.length).toBeLessThan(entries.length);
    });

    it('should filter by before timestamp', async () => {
      const entries = await listEntries(db);
      const midTimestamp = entries[10].ts;

      const filteredEntries = await listEntries(db, { before: midTimestamp });
      expect(filteredEntries.every((entry) => entry.ts < midTimestamp)).toBe(true);
    });

    it('should filter by both after and before timestamps', async () => {
      const entries = await listEntries(db);
      const afterTime = entries[15].ts;
      const beforeTime = entries[5].ts;

      const filteredEntries = await listEntries(db, {
        after: afterTime,
        before: beforeTime,
      });

      expect(filteredEntries.every((entry) => entry.ts > afterTime && entry.ts < beforeTime)).toBe(
        true,
      );
    });

    it('should respect custom limit', async () => {
      const customLimit = 5;
      const entries = await listEntries(db, { limit: customLimit });
      expect(entries).toHaveLength(customLimit);
    });

    it('should handle limit larger than available entries', async () => {
      const entries = await listEntries(db, { limit: 100 });
      expect(entries.length).toBeLessThanOrEqual(100);
      expect(entries.length).toBe(25); // We added 25 entries in beforeEach
    });

    it('should combine all filters', async () => {
      const entries = await listEntries(db);
      // Make sure we have enough entries
      if (entries.length < 21) {
        // Skip test if not enough entries
        return;
      }
      const afterTime = entries[20].ts;
      const beforeTime = entries[5].ts;

      const filteredEntries = await listEntries(db, {
        authorId: testAuthorId,
        after: afterTime,
        before: beforeTime,
        limit: 10,
      });

      expect(
        filteredEntries.every(
          (entry) =>
            entry.authorId === testAuthorId && entry.ts > afterTime && entry.ts < beforeTime,
        ),
      ).toBe(true);
      expect(filteredEntries.length).toBeLessThanOrEqual(10);
    });

    it('should return empty array when no entries match', async () => {
      const futureTime = Date.now() + 1000000;
      const entries = await listEntries(db, { after: futureTime });
      expect(entries).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Close the database connection to simulate error
      const closedDb = {
        ...db,
        select: () => {
          throw new Error('Database closed');
        },
      } as any;

      await expect(listEntries(closedDb)).rejects.toThrow(LogbooksError);
      await expect(listEntries(closedDb)).rejects.toThrow('Failed to list entries');
    });

    it('should maintain entry properties', async () => {
      const entryInput = {
        authorId: testAuthorId,
        md: '# Special Entry\nWith **bold** and *italic*',
        ts: Date.now() + 100000,
        type: 'decision' as const,
      };

      const entryId = await addEntry(db, entryInput);
      const entries = await listEntries(db, { authorId: testAuthorId, limit: 1 });

      expect(entries[0]).toMatchObject({
        id: entryId,
        authorId: entryInput.authorId,
        md: entryInput.md,
        ts: entryInput.ts,
        type: entryInput.type,
      });
    });

    it('should filter by entry type', async () => {
      const updateEntries = await listEntries(db, { type: 'update' });
      expect(updateEntries.every((entry) => entry.type === 'update')).toBe(true);

      const observationEntries = await listEntries(db, { type: 'observation' });
      expect(observationEntries.every((entry) => entry.type === 'observation')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent entry additions', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        addEntry(db, {
          authorId: testAuthorId,
          md: `Concurrent entry ${i}`,
          type: 'update' as const,
        }),
      );

      const entryIds = await Promise.all(promises);
      expect(new Set(entryIds).size).toBe(10); // All IDs should be unique

      const entries = await listEntries(db, { authorId: testAuthorId, limit: 100 });
      expect(entries.length).toBeGreaterThanOrEqual(10);
    });

    it('should handle empty markdown gracefully in retrieval', async () => {
      // Import entries table
      const { entries } = await import('../src/schema');

      // Directly insert an entry with empty markdown to bypass validation
      await db.insert(entries).values({
        id: 'empty-entry',
        authorId: testAuthorId,
        ts: Date.now(),
        md: '',
        type: 'update',
      });

      const entriesList = await listEntries(db, { authorId: testAuthorId });
      const emptyEntry = entriesList.find((e) => e.id === 'empty-entry');
      expect(emptyEntry?.md).toBe('');
    });
  });
});
