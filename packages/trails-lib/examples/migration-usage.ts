import { setupDatabase, setupDatabaseSync, runMigrations } from '../src/index.js';

// Example 1: Using async setup (recommended)
async function exampleAsync() {
  // This will automatically run migrations
  const db = await setupDatabase('./my-trails.sqlite');
  console.log('Database setup with migrations complete!');

  // Use the database...
}

// Example 2: Using sync setup
function exampleSync() {
  // This will automatically run migrations synchronously
  const db = setupDatabaseSync('./my-trails.sqlite');
  console.log('Database setup with migrations complete!');

  // Use the database...
}

// Example 3: Running migrations separately
async function exampleSeparateMigration() {
  // Run migrations first
  await runMigrations('./my-trails.sqlite');

  // Then get a database connection
  const { getDb } = await import('../src/index.js');
  const db = getDb('./my-trails.sqlite');

  // Use the database...
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running async example...');
  await exampleAsync();

  console.log('\nRunning sync example...');
  exampleSync();

  console.log('\nRunning separate migration example...');
  await exampleSeparateMigration();
}
