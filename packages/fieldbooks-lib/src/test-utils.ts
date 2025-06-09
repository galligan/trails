/**
 * Test utilities for Fieldbooks
 * These utilities are exported only for testing purposes
 */
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { retryDb } from './retry.js';
import { authors, entries } from './schema.js';
import type { FieldbooksDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Schema type for the Fieldbooks database
 */
type Schema = {
  authors: typeof authors;
  entries: typeof entries;
};

/**
 * Sets up a test database at the specified path
 * @param dbPath - Path to the test database
 * @returns Promise resolving to a database connection
 */
export async function setupTestDatabase(dbPath: string): Promise<FieldbooksDb> {
  const sqliteDb = new Database(dbPath);
  
  // Enable foreign keys
  sqliteDb.pragma('foreign_keys = ON');
  
  const db = drizzle(sqliteDb, { schema: { authors, entries } });

  // Run migrations
  const migrationPath = join(__dirname, '..', 'drizzle');
  await migrate(db, { migrationsFolder: migrationPath });

  return db;
}

/**
 * Creates a simple database connection without migrations
 * @param dbPath - Path to the database (defaults to './fieldbook.sqlite')
 * @returns Database connection
 */
export function getTestDb(dbPath: string = './fieldbook.sqlite'): FieldbooksDb {
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');
  return drizzle(sqliteDb, { schema: { authors, entries } });
}

/**
 * Sets up a test database synchronously
 * @param dbPath - Path to the test database
 * @returns Database connection
 */
export function setupTestDatabaseSync(dbPath: string): FieldbooksDb {
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');
  
  const db = drizzle(sqliteDb, { schema: { authors, entries } });
  
  // Run migrations synchronously
  const migrationPath = join(__dirname, '..', 'drizzle');
  // Note: Drizzle doesn't have a sync migrate, so we'll just return the db
  // In tests, we can use the async version or create tables manually if needed
  
  return db;
}