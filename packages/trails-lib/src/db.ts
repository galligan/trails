import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { TrailsDbError } from './errors.js';
import { retryDb } from './retry.js';
import { users, agents, notes } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Schema type for the Trails database
 */
type Schema = {
  users: typeof users;
  agents: typeof agents;
  notes: typeof notes;
};

/**
 * Type alias for a Trails database connection with typed schema
 */
export type TrailsDb = BetterSQLite3Database<Schema>;

/**
 * Creates a database connection without running migrations
 * 
 * @param dbPath - Path to the SQLite database file (default: './trails.sqlite')
 * @returns A Drizzle database instance with typed schema
 * @throws {TrailsDbError} If the database cannot be opened
 * 
 * @example
 * ```typescript
 * const db = getDb('./my-trails.db');
 * // Use db for queries, but remember to run migrations separately
 * ```
 */
export function getDb(dbPath: string = './trails.sqlite'): TrailsDb {
  try {
    const sqlite = new Database(dbPath);
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    return drizzle(sqlite, { schema: { users, agents, notes } });
  } catch {
    throw new TrailsDbError(`Failed to open database at ${dbPath}`, 'getDb');
  }
}

/**
 * Sets up a database connection and runs migrations
 * 
 * This is the primary way to initialize a Trails database. It will:
 * 1. Create or open the SQLite database file
 * 2. Enable foreign key constraints
 * 3. Run all pending migrations
 * 4. Return a typed Drizzle database instance
 * 
 * The operation includes automatic retry logic for transient errors.
 * 
 * @param dbPath - Path to the SQLite database file (default: './trails.sqlite')
 * @returns A promise that resolves to a Drizzle database instance with typed schema
 * @throws {TrailsDbError} If the database cannot be opened or migrations fail after retries
 * 
 * @example
 * ```typescript
 * const db = await setupDatabase('./my-trails.db');
 * // Database is ready to use with all migrations applied
 * 
 * // Add a note
 * await addNote(db, {
 *   agentId: 'my-agent',
 *   md: 'Hello, world!'
 * });
 * ```
 */
export async function setupDatabase(dbPath: string = './trails.sqlite'): Promise<TrailsDb> {
  return retryDb(
    async () => {
      let sqlite: Database.Database;

      try {
        sqlite = new Database(dbPath);
      } catch {
        throw new TrailsDbError(`Failed to open database at ${dbPath}`, 'setupDatabase');
      }

      const db = drizzle(sqlite, { schema: { users, agents, notes } });

      // Enable foreign keys
      sqlite.pragma('foreign_keys = ON');

      // Run migrations
      const migrationsFolder = join(__dirname, '..', 'drizzle');
      try {
        migrate(db, { migrationsFolder });
      } catch (error) {
        throw new TrailsDbError(`Failed to run migrations: ${String(error)}`, 'migrate');
      }

      return Promise.resolve(db);
    },
    {
      onRetry: (error, attempt) => {
        console.warn(`Database setup failed (attempt ${attempt}):`, error);
      },
    },
  );
}

/**
 * Synchronous version of setupDatabase
 * 
 * This function sets up a database connection and runs migrations synchronously.
 * Consider using the async `setupDatabase` function instead for better error handling.
 * 
 * @param dbPath - Path to the SQLite database file (default: './trails.sqlite')
 * @returns A Drizzle database instance with typed schema
 * @throws {TrailsDbError} If the database cannot be opened or migrations fail
 * 
 * @deprecated Use `setupDatabase` (async) for better error handling and retry logic
 * 
 * @example
 * ```typescript
 * try {
 *   const db = setupDatabaseSync('./my-trails.db');
 *   // Database is ready to use
 * } catch (error) {
 *   console.error('Failed to setup database:', error);
 * }
 * ```
 */
export function setupDatabaseSync(dbPath: string = './trails.sqlite'): TrailsDb {
  try {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema: { users, agents, notes } });

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Run migrations synchronously
    const migrationsFolder = join(__dirname, '..', 'drizzle');
    migrate(db, { migrationsFolder });

    return db;
  } catch (error) {
    throw new TrailsDbError(
      `Failed to setup database synchronously: ${String(error)}`,
      'setupDatabaseSync',
    );
  }
}
