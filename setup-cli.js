import { setupDatabase, users, agents } from './packages/trails-lib/dist/index.js';

async function setupCli() {
  console.log('Setting up CLI test environment...');

  const db = await setupDatabase('./trails.sqlite');

  // Create test user and agent if they don't exist
  try {
    await db.insert(users).values({
      id: 'cli-user',
      name: 'CLI User',
      createdAt: Date.now(),
    });
  } catch {
    // User might already exist
  }
  try {
    await db.insert(agents).values({
      id: 'test-cli',
      userId: 'cli-user',
      label: 'Test CLI Agent',
      createdAt: Date.now(),
    });
  } catch {
    // Agent might already exist
  }

  console.log('CLI setup complete!');
}

setupCli().catch(console.error);
