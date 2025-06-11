import type { LogbooksDb } from './db.js';
/**
 * Sets up a test database at the specified path
 * @param dbPath - Path to the test database
 * @returns Promise resolving to a database connection
 */
export declare function setupTestDatabase(dbPath: string): Promise<LogbooksDb>;
/**
 * Creates a simple database connection without migrations
 * @param dbPath - Path to the database (defaults to './logbook.sqlite')
 * @returns Database connection
 */
export declare function getTestDb(dbPath?: string): LogbooksDb;
/**
 * Sets up a test database synchronously
 * @param dbPath - Path to the test database
 * @returns Database connection
 */
export declare function setupTestDatabaseSync(dbPath: string): LogbooksDb;
