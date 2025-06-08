#!/usr/bin/env node

/**
 * @fileoverview Setup script for initializing the Trails demo environment
 * @module basecamp/setup
 */

import { setupDatabase, users, agents, addNote } from '../packages/trails-lib/dist/index.js';
import type { TrailsDb } from '../packages/trails-lib/dist/index.js';

/**
 * Demo data configuration
 */
const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo User',
} as const;

const DEMO_AGENTS = [
  { id: 'claude-engineer', label: 'Claude Engineer', userId: DEMO_USER.id },
  { id: 'github-copilot', label: 'GitHub Copilot', userId: DEMO_USER.id },
  { id: 'codewhisperer', label: 'CodeWhisperer', userId: DEMO_USER.id },
] as const;

/**
 * Creates demo users in the database
 * @param {Database} db - The database instance
 * @returns {Promise<void>}
 */
async function createDemoUsers(db: TrailsDb): Promise<void> {
  try {
    await db.insert(users).values({
      ...DEMO_USER,
      createdAt: Date.now(),
    });
    console.log(`✓ Created user: ${DEMO_USER.name}`);
  } catch (error) {
    console.log(`✓ User already exists: ${DEMO_USER.name}`);
  }
}

/**
 * Creates demo agents in the database
 * @param {Database} db - The database instance
 * @returns {Promise<void>}
 */
async function createDemoAgents(db: TrailsDb): Promise<void> {
  for (const agent of DEMO_AGENTS) {
    try {
      await db.insert(agents).values({
        ...agent,
        createdAt: Date.now(),
      });
      console.log(`✓ Created agent: ${agent.label}`);
    } catch (error) {
      console.log(`✓ Agent already exists: ${agent.label}`);
    }
  }
}

/**
 * Creates demo notes for each agent
 * @param {Database} db - The database instance
 * @returns {Promise<void>}
 */
async function createDemoNotes(db: TrailsDb): Promise<void> {
  const demoNotes = [
    {
      agentId: 'claude-engineer',
      content: `## Project Setup
- Initialized new TypeScript project with strict mode
- Set up ESLint with recommended rules
- Configured Prettier for consistent formatting
- Added husky for pre-commit hooks`,
    },
    {
      agentId: 'claude-engineer',
      content: `## API Design Discussion
User requested RESTful API with the following endpoints:
- \`GET /api/users\` - List all users
- \`POST /api/users\` - Create new user
- \`GET /api/users/:id\` - Get user by ID

Implemented with Express and TypeScript interfaces for type safety.`,
    },
    {
      agentId: 'github-copilot',
      content: `## Autocomplete Patterns
- Recognized pattern for React component structure
- Suggested prop types based on usage
- Auto-imported required dependencies`,
    },
    {
      agentId: 'codewhisperer',
      content: `## Security Scan Results
Found 0 vulnerabilities in dependencies.
Suggested improvements:
- Add input validation for user endpoints
- Implement rate limiting
- Use parameterized queries for database`,
    },
  ];

  console.log('\nCreating demo notes...');
  
  for (const note of demoNotes) {
    try {
      const noteId = await addNote(db, { agentId: note.agentId, md: note.content });
      console.log(`✓ Created note for ${note.agentId}: ${noteId}`);
    } catch (error) {
      console.error(`✗ Failed to create note for ${note.agentId}:`, error);
    }
  }
}

/**
 * Main setup function that orchestrates the demo environment creation
 * @returns {Promise<void>}
 */
async function setup(): Promise<void> {
  console.log('🚀 Setting up Trails demo environment...\n');

  const dbPath = process.env.TRAILS_DB || './trails.sqlite';
  
  try {
    const db = await setupDatabase(dbPath);
    
    await createDemoUsers(db);
    await createDemoAgents(db);
    await createDemoNotes(db);
    
    console.log('\n✅ Demo setup complete!');
    console.log(`\nYou can now run demos with:`);
    console.log(`  TRAILS_AGENT_ID=claude-engineer node demo.js`);
    console.log(`  TRAILS_AGENT_ID=github-copilot node demo.js`);
    console.log(`  TRAILS_AGENT_ID=codewhisperer node demo.js`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup();
}

export { setup };