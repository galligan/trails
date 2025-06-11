import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getTestDb, setupTestDatabase, setupTestDatabaseSync } from '../src/test-utils';
import { authors, entries } from '../src/schema';
import { eq } from 'drizzle-orm';

describe('Database Functions', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = join(tmpdir(), `test-db-${Date.now()}.sqlite`);
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

  describe('getTestDb', () => {
    it('should create a database connection', () => {
      const db = getTestDb(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should use default path when not provided', () => {
      const db = getTestDb();
      expect(db).toBeDefined();
      // Clean up default db
      if (existsSync('./logbook.sqlite')) {
        unlinkSync('./logbook.sqlite');
      }
    });

    it('should enable foreign keys', async () => {
      // Need to set up database with migrations first
      const db = await setupTestDatabase(testDbPath);

      // First create an author
      await db.insert(authors).values({
        id: 'author-1',
        type: 'user',
        name: 'Test Author',
        createdAt: Date.now(),
      });

      // Try to insert entry with non-existent author
      await expect(
        db.insert(entries).values({
          id: 'entry-1',
          authorId: 'non-existent-author',
          type: 'update',
          ts: Date.now(),
          md: 'Test entry',
        }),
      ).rejects.toThrow();
    });
  });

  describe('setupTestDatabase', () => {
    it('should create and setup database with migrations', async () => {
      const db = await setupTestDatabase(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);

      // Verify tables exist by inserting data
      const authorId = 'test-author-1';
      await db.insert(authors).values({
        id: authorId,
        type: 'agent',
        name: 'Test Author',
        createdAt: Date.now(),
      });

      const author = await db.select().from(authors).where(eq(authors.id, authorId));
      expect(author).toHaveLength(1);
      expect(author[0].id).toBe(authorId);
    });

    it('should handle migration errors gracefully', async () => {
      // Create a corrupted database file
      const fs = await import('fs');
      fs.writeFileSync(testDbPath, 'corrupted data');

      await expect(setupTestDatabase(testDbPath)).rejects.toThrow();
    });
  });

  describe('setupTestDatabaseSync', () => {
    it('should create and setup database synchronously', () => {
      const db = setupTestDatabaseSync(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);

      // Verify tables exist
      const authorId = 'test-author-2';
      db.insert(authors)
        .values({
          id: authorId,
          type: 'service',
          name: 'Test Service',
          serviceType: 'webhook',
          createdAt: Date.now(),
        })
        .run();

      const author = db.select().from(authors).where(eq(authors.id, authorId)).get();
      expect(author).toBeDefined();
      expect(author?.id).toBe(authorId);
    });
  });

  describe('Database Schema', () => {
    it('should enforce foreign key constraints', async () => {
      const db = await setupTestDatabase(testDbPath);

      // Create author
      const authorId = 'author-1';

      await db.insert(authors).values({
        id: authorId,
        type: 'agent',
        name: 'Test Agent',
        model: 'gpt-4',
        tool: 'test-tool',
        createdAt: Date.now(),
      });

      // Try to insert entry with non-existent author
      await expect(
        db.insert(entries).values({
          id: 'entry-1',
          authorId: 'non-existent-author',
          type: 'update',
          ts: Date.now(),
          md: 'Test entry',
        }),
      ).rejects.toThrow();

      // Should work with valid author
      await expect(
        db.insert(entries).values({
          id: 'entry-1',
          authorId: authorId,
          type: 'update',
          ts: Date.now(),
          md: 'Test entry',
        }),
      ).resolves.not.toThrow();
    });

    it('should handle nullable fields correctly', async () => {
      const db = await setupTestDatabase(testDbPath);

      // Author with null name
      await db.insert(authors).values({
        id: 'author-no-name',
        type: 'user',
        name: null,
        createdAt: Date.now(),
      });

      const author = await db.select().from(authors).where(eq(authors.id, 'author-no-name'));
      expect(author[0].name).toBeNull();

      // Author with null model (for non-agent types)
      await db.insert(authors).values({
        id: 'service-no-model',
        type: 'service',
        name: 'Test Service',
        serviceType: 'ci',
        model: null,
        createdAt: Date.now(),
      });

      const service = await db.select().from(authors).where(eq(authors.id, 'service-no-model'));
      expect(service[0].model).toBeNull();
    });

    it('should maintain indexes for performance', async () => {
      const db = await setupTestDatabase(testDbPath);

      // Insert test data
      const authorId = 'author-1';
      await db.insert(authors).values({
        id: authorId,
        type: 'agent',
        name: 'Test Agent',
        model: 'claude-3',
        tool: 'test-tool',
        createdAt: Date.now(),
      });

      // Insert multiple entries
      const entriesToInsert = Array.from({ length: 10 }, (_, i) => ({
        id: `entry-${i}`,
        authorId: authorId,
        type: 'update' as const,
        ts: Date.now() + i * 1000,
        md: `Entry ${i}`,
      }));

      await db.insert(entries).values(entriesToInsert);

      // Query using indexed columns should work efficiently
      const entriesByAuthor = await db.select().from(entries).where(eq(entries.authorId, authorId));

      expect(entriesByAuthor).toHaveLength(10);
    });
  });
});
