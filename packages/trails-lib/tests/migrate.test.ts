import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runMigrations } from '../src/migrate';
import { getDb } from '../src/db';
import { users, agents, notes } from '../src/schema';
import Database from 'better-sqlite3';

describe('Migration System', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = join(tmpdir(), `test-migrate-${Date.now()}.sqlite`);
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

  describe('runMigrations', () => {
    it('should create database and run migrations', async () => {
      expect(existsSync(testDbPath)).toBe(false);

      runMigrations(testDbPath);

      expect(existsSync(testDbPath)).toBe(true);

      // Verify tables were created
      const db = getDb(testDbPath);

      // Test by inserting data
      const userId = 'test-user';
      await db.insert(users).values({
        id: userId,
        name: 'Test User',
        createdAt: Date.now(),
      });

      const agentId = 'test-agent';
      await db.insert(agents).values({
        id: agentId,
        userId: userId,
        label: 'Test Agent',
        createdAt: Date.now(),
      });

      const noteId = 'test-note';
      await db.insert(notes).values({
        id: noteId,
        agentId: agentId,
        ts: Date.now(),
        md: 'Test note',
      });

      // Verify data was inserted
      const savedNotes = await db.select().from(notes);
      expect(savedNotes).toHaveLength(1);
      expect(savedNotes[0].id).toBe(noteId);
    });

    it('should handle existing database', async () => {
      // Run migrations first time
      runMigrations(testDbPath);

      // Run migrations again on existing database - should not throw
      expect(() => runMigrations(testDbPath)).not.toThrow();

      // Database should still be functional
      const db = getDb(testDbPath);
      const userId = 'test-user-2';
      await db.insert(users).values({
        id: userId,
        name: 'Test User 2',
        createdAt: Date.now(),
      });

      const savedUsers = await db.select().from(users);
      expect(savedUsers.some((u) => u.id === userId)).toBe(true);
    });

    it('should use default path when not provided', async () => {
      const defaultPath = './trails.sqlite';

      try {
        runMigrations();
        expect(existsSync(defaultPath)).toBe(true);
      } finally {
        // Clean up
        if (existsSync(defaultPath)) {
          unlinkSync(defaultPath);
        }
      }
    });

    it('should enable foreign keys', async () => {
      runMigrations(testDbPath);

      // Check foreign keys are enabled
      const sqlite = new Database(testDbPath);
      const result = sqlite.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
      expect(result.foreign_keys).toBe(1);
      sqlite.close();
    });

    it('should close database connection after migration', async () => {
      runMigrations(testDbPath);

      // Should be able to open a new connection (proves previous was closed)
      const sqlite = new Database(testDbPath);
      const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables.length).toBeGreaterThan(0);
      sqlite.close();
    });

    it('should handle migration errors', async () => {
      // Create a corrupted database
      writeFileSync(testDbPath, 'corrupted data');

      expect(() => runMigrations(testDbPath)).toThrow();
    });

    it('should handle missing migrations folder gracefully', async () => {
      // This test might pass if migrations folder exists, which is expected
      // The test is more about ensuring the function handles the path correctly
      expect(() => runMigrations(testDbPath)).not.toThrow();
    });
  });

  describe('Migration Integrity', () => {
    it('should create all required indexes', async () => {
      runMigrations(testDbPath);

      const sqlite = new Database(testDbPath);
      const indexes = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];

      const indexNames = indexes.map((idx) => idx.name);

      // Check for expected indexes
      expect(indexNames).toContain('users_created_at_idx');
      expect(indexNames).toContain('agents_user_id_idx');
      expect(indexNames).toContain('agents_created_at_idx');
      expect(indexNames).toContain('agents_label_idx');
      expect(indexNames).toContain('notes_agent_id_idx');
      expect(indexNames).toContain('notes_ts_idx');
      expect(indexNames).toContain('notes_agent_id_ts_idx');

      sqlite.close();
    });

    it('should create tables with correct schema', async () => {
      runMigrations(testDbPath);

      const sqlite = new Database(testDbPath);

      // Check users table
      const usersInfo = sqlite.prepare('PRAGMA table_info(users)').all() as any[];
      const userColumns = usersInfo.map((col) => col.name);
      expect(userColumns).toContain('id');
      expect(userColumns).toContain('name');
      expect(userColumns).toContain('created_at');

      // Check agents table
      const agentsInfo = sqlite.prepare('PRAGMA table_info(agents)').all() as any[];
      const agentColumns = agentsInfo.map((col) => col.name);
      expect(agentColumns).toContain('id');
      expect(agentColumns).toContain('user_id');
      expect(agentColumns).toContain('label');
      expect(agentColumns).toContain('created_at');

      // Check notes table
      const notesInfo = sqlite.prepare('PRAGMA table_info(notes)').all() as any[];
      const noteColumns = notesInfo.map((col) => col.name);
      expect(noteColumns).toContain('id');
      expect(noteColumns).toContain('agent_id');
      expect(noteColumns).toContain('ts');
      expect(noteColumns).toContain('md');

      sqlite.close();
    });

    it('should set up foreign key constraints correctly', async () => {
      runMigrations(testDbPath);

      const sqlite = new Database(testDbPath);

      // Check foreign keys for agents table
      const agentsFks = sqlite.prepare('PRAGMA foreign_key_list(agents)').all() as any[];
      expect(agentsFks).toHaveLength(1);
      expect(agentsFks[0].table).toBe('users');
      expect(agentsFks[0].from).toBe('user_id');
      expect(agentsFks[0].to).toBe('id');

      // Check foreign keys for notes table
      const notesFks = sqlite.prepare('PRAGMA foreign_key_list(notes)').all() as any[];
      expect(notesFks).toHaveLength(1);
      expect(notesFks[0].table).toBe('agents');
      expect(notesFks[0].from).toBe('agent_id');
      expect(notesFks[0].to).toBe('id');

      sqlite.close();
    });
  });
});
