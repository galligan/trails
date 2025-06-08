#!/usr/bin/env node

/**
 * @fileoverview CLI binary for running Trails database migrations
 * @module trails-lib/bin/trails-migrate
 */

import { runMigrations } from '../src/migrate.js';
import { join } from 'path';

/**
 * Main migration CLI handler
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dbPath = args[0] || join(process.cwd(), 'trails.sqlite');

  console.log(`Running migrations on database: ${dbPath}`);

  try {
    await runMigrations(dbPath);
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute
main();