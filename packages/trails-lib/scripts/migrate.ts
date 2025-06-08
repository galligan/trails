#!/usr/bin/env node

/**
 * @fileoverview CLI script for running database migrations
 * @module trails-lib/scripts/migrate
 */

import { runMigrations } from '../dist/migrate.js';

/**
 * Main migration runner
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const dbPath = process.argv[2] || './trails.sqlite';

  console.log(`Running migrations on database: ${dbPath}`);

  try {
    await runMigrations(dbPath);
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };