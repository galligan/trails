#!/usr/bin/env node

import { runMigrations } from '../dist/migrate.js';

const dbPath = process.argv[2] || './trails.sqlite';

console.log(`Running migrations on database: ${dbPath}`);

try {
  await runMigrations(dbPath);
  console.log('Migrations completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
