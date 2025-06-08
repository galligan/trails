import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getDb, setupDatabase, setupDatabaseSync } from '../src/db';
import { users, agents, notes } from '../src/schema';
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

  describe('getDb', () => {
    it('should create a database connection', () => {
      const db = getDb(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should use default path when not provided', () => {
      const db = getDb();
      expect(db).toBeDefined();
      // Clean up default db
      if (existsSync('./trails.sqlite')) {
        unlinkSync('./trails.sqlite');
      }
    });

    it('should enable foreign keys', async () => {
      // Need to set up database with migrations first
      const db = await setupDatabase(testDbPath);

      // First create a user
      await db.insert(users).values({
        id: 'user-1',
        name: 'Test User',
        createdAt: Date.now(),
      });

      // Try to insert agent with non-existent user
      await expect(
        db.insert(agents).values({
          id: 'agent-1',
          userId: 'non-existent-user',
          label: 'Test Agent',
          createdAt: Date.now(),
        }),
      ).rejects.toThrow();
    });
  });

  describe('setupDatabase', () => {
    it('should create and setup database with migrations', async () => {
      const db = await setupDatabase(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);

      // Verify tables exist by inserting data
      const userId = 'test-user-1';
      await db.insert(users).values({
        id: userId,
        name: 'Test User',
        createdAt: Date.now(),
      });

      const user = await db.select().from(users).where(eq(users.id, userId));
      expect(user).toHaveLength(1);
      expect(user[0].id).toBe(userId);
    });

    it('should handle migration errors gracefully', async () => {
      // Create a corrupted database file
      const fs = await import('fs');
      fs.writeFileSync(testDbPath, 'corrupted data');

      await expect(setupDatabase(testDbPath)).rejects.toThrow();
    });
  });

  describe('setupDatabaseSync', () => {
    it('should create and setup database synchronously', () => {
      const db = setupDatabaseSync(testDbPath);
      expect(db).toBeDefined();
      expect(existsSync(testDbPath)).toBe(true);

      // Verify tables exist
      const userId = 'test-user-2';
      db.insert(users)
        .values({
          id: userId,
          name: 'Test User',
          createdAt: Date.now(),
        })
        .run();

      const user = db.select().from(users).where(eq(users.id, userId)).get();
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });
  });

  describe('Database Schema', () => {
    it('should enforce foreign key constraints', async () => {
      const db = await setupDatabase(testDbPath);

      // Create user and agent
      const userId = 'user-1';
      const agentId = 'agent-1';

      await db.insert(users).values({
        id: userId,
        name: 'Test User',
        createdAt: Date.now(),
      });

      await db.insert(agents).values({
        id: agentId,
        userId: userId,
        label: 'Test Agent',
        createdAt: Date.now(),
      });

      // Try to insert note with non-existent agent
      await expect(
        db.insert(notes).values({
          id: 'note-1',
          agentId: 'non-existent-agent',
          ts: Date.now(),
          md: 'Test note',
        }),
      ).rejects.toThrow();

      // Should work with valid agent
      await expect(
        db.insert(notes).values({
          id: 'note-1',
          agentId: agentId,
          ts: Date.now(),
          md: 'Test note',
        }),
      ).resolves.not.toThrow();
    });

    it('should handle nullable fields correctly', async () => {
      const db = await setupDatabase(testDbPath);

      // User with null name
      await db.insert(users).values({
        id: 'user-no-name',
        name: null,
        createdAt: Date.now(),
      });

      const user = await db.select().from(users).where(eq(users.id, 'user-no-name'));
      expect(user[0].name).toBeNull();

      // Agent with null label
      await db.insert(agents).values({
        id: 'agent-no-label',
        userId: 'user-no-name',
        label: null,
        createdAt: Date.now(),
      });

      const agent = await db.select().from(agents).where(eq(agents.id, 'agent-no-label'));
      expect(agent[0].label).toBeNull();
    });

    it('should maintain indexes for performance', async () => {
      const db = await setupDatabase(testDbPath);

      // Insert test data
      const userId = 'user-1';
      await db.insert(users).values({
        id: userId,
        name: 'Test User',
        createdAt: Date.now(),
      });

      const agentId = 'agent-1';
      await db.insert(agents).values({
        id: agentId,
        userId: userId,
        label: 'test-agent',
        createdAt: Date.now(),
      });

      // Insert multiple notes
      const notesToInsert = Array.from({ length: 10 }, (_, i) => ({
        id: `note-${i}`,
        agentId: agentId,
        ts: Date.now() + i * 1000,
        md: `Note ${i}`,
      }));

      await db.insert(notes).values(notesToInsert);

      // Query using indexed columns should work efficiently
      const notesByAgent = await db.select().from(notes).where(eq(notes.agentId, agentId));

      expect(notesByAgent).toHaveLength(10);
    });
  });
});
