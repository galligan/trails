import { type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { authors, entries } from './schema.js';
/**
 * Schema type for the Logbooks database
 */
type Schema = {
    authors: typeof authors;
    entries: typeof entries;
};
/**
 * Type alias for a Logbooks database connection with typed schema
 */
export type LogbooksDb = BetterSQLite3Database<Schema>;
/**
 * The primary entry point for initializing the Logbooks database.
 *
 * This function orchestrates the entire setup process:
 * 1. Loads configuration from files (`.logbook/config.json`, etc.).
 * 2. Resolves the correct path for the database (local or global).
 * 3. Ensures the necessary directory structure exists.
 * 4. Handles migration of legacy database files.
 * 5. Sets up the database connection and runs migrations.
 *
 * @param options - Options for path resolution, e.g., `{ global: true }`.
 * @returns A promise that resolves to a fully configured Drizzle database instance.
 */
export declare function initializeDatabase(options?: {
    global?: boolean;
}): Promise<LogbooksDb>;
export {};
