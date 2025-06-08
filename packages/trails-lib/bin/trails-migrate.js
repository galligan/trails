#!/usr/bin/env node

import { runMigrations } from '../dist/migrate.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
