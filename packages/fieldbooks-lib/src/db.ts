import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs-extra';

import { loadConfig } from './config.js';
import { FieldbooksDbError } from './errors.js';
import { resolvePaths, ensureDatabaseDir } from './paths.js';
import { retryDb } from './retry.js';
import { authors, entries } from './schema.js';

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
 * Type alias for a Fieldbooks database connection with typed schema
 */
export type FieldbooksDb = BetterSQLite3Database<Schema>;

/**
 * The primary entry point for initializing the Fieldbooks database.
 *
 * This function orchestrates the entire setup process:
 * 1. Loads configuration from files (`.fieldbook/config.json`, etc.).
 * 2. Resolves the correct path for the database (local or global).
 * 3. Ensures the necessary directory structure exists.
 * 4. Handles migration of legacy database files.
 * 5. Sets up the database connection and runs migrations.
 *
 * @param options - Options for path resolution, e.g., `{ global: true }`.
 * @returns A promise that resolves to a fully configured Drizzle database instance.
 */
export async function initializeDatabase(
  options: { global?: boolean } = {},
): Promise<FieldbooksDb> {
  const loadedConfig = await loadConfig();
  const paths = resolvePaths(loadedConfig, options);

  await ensureDatabaseDir(paths.database);
  await migrateLegacyDb(paths.root);

  return setupDatabase(paths.database);
}

/**
 * Internal function to set up a database connection and run migrations.
 * All public calls should go through `initializeDatabase`.
 *
 * @param dbPath - The exact path to the SQLite database file.
 * @returns A promise resolving to the database instance.
 * @internal
 */
async function setupDatabase(dbPath: string): Promise<FieldbooksDb> {
  return retryDb(
    async () => {
      const sqlite = new Database(dbPath);
      const db = drizzle(sqlite, { schema: { authors, entries } });

      // Enable foreign keys
      sqlite.pragma('foreign_keys = ON');

      // Run migrations
      const migrationsFolder = join(__dirname, '..', 'drizzle');
      migrate(db, { migrationsFolder });

      return db;
    },
    {
      onRetry: (error, attempt) => {
        console.warn(`Database setup failed (attempt ${attempt}):`, error);
      },
    },
  );
}

/**
 * Checks for a legacy `fieldbooks.sqlite` file and prompts the user to move it.
 *
 * @param newRootDir - The new root directory (`.fieldbook/`) to move the file to.
 */
async function migrateLegacyDb(newRootDir: string): Promise<void> {
  const legacyDbPath = join(process.cwd(), 'fieldbooks.sqlite');
  const legacyDbPathAlt = join(process.cwd(), 'fieldbook.sqlite');

  const legacyPathExists = await fs.pathExists(legacyDbPath);
  const legacyPath = legacyPathExists
    ? legacyDbPath
    : (await fs.pathExists(legacyDbPathAlt))
      ? legacyDbPathAlt
      : null;

  if (legacyPath) {
    const newDbPath = join(newRootDir, 'fieldbook.sqlite');
    // In a real CLI, we would prompt the user here. For now, we move it automatically.
    // This is a placeholder for interactive migration logic.
    console.log(`Legacy database found at ${legacyPath}. Migrating to ${newDbPath}...`);
    try {
      await fs.move(legacyPath, newDbPath, { overwrite: false });
      console.log('✓ Migration successful.');
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === 'EEXIST') {
        console.warn(`! Migration skipped: Target file ${newDbPath} already exists.`);
      } else {
        throw new FieldbooksDbError(
          `Failed to migrate legacy database: ${String(error)}`,
          'migrateLegacyDb',
        );
      }
    }
  }
}
