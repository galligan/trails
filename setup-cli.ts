#!/usr/bin/env node

/**
 * @fileoverview CLI setup script for initializing the Trails database with test data
 * @module setup-cli
 */

import { setupDatabase, users, agents } from './packages/trails-lib/dist/index.js';
import type { Database } from './packages/trails-lib/dist/index.js';

/**
 * Sets up the CLI test environment by creating a test user and agent
 * @returns {Promise<void>}
 */
async function setupCli(): Promise<void> {
  console.log('Setting up CLI test environment...');

  const db: Database = await setupDatabase('./trails.sqlite');

  // Create test user and agent if they don't exist
  try {
    await db.insert(users).values({
      id: 'cli-user',
      name: 'CLI User',
      createdAt: Date.now(),
    });
    console.log('✓ Created CLI user');
  } catch (error) {
    console.log('✓ CLI user already exists');
  }

  try {
    await db.insert(agents).values({
      id: 'test-cli',
      userId: 'cli-user',
      label: 'Test CLI Agent',
      createdAt: Date.now(),
    });
    console.log('✓ Created test CLI agent');
  } catch (error) {
    console.log('✓ Test CLI agent already exists');
  }

  console.log('\n✅ CLI setup complete!');
  console.log('You can now use: TRAILS_AGENT_ID=test-cli trails add "Your note"');
}

// Main execution with proper error handling
if (import.meta.url === `file://${process.argv[1]}`) {
  setupCli().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

export { setupCli };