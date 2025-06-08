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

// Define the schema type
type Schema = {
  users: typeof users;
  agents: typeof agents;
  notes: typeof notes;
};

export type TrailsDb = BetterSQLite3Database<Schema>;

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

// Synchronous version for backward compatibility if needed
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
