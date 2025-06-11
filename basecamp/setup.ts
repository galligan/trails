#!/usr/bin/env node

/**
 * @fileoverview Setup script for initializing the Fieldbooks demo environment
 * @module basecamp/setup
 */

import { setupFieldbook, authors, addEntry, initFieldbookDir } from 'logbooks-lib';
import type { FieldbooksDb } from 'logbooks-lib';

/**
 * Demo data configuration
 */
const DEMO_AUTHORS = [
  {
    id: 'claude-engineer',
    type: 'agent' as const,
    name: 'Claude Engineer',
    model: 'claude-3-opus',
    tool: 'claude-code',
  },
  {
    id: 'github-copilot',
    type: 'agent' as const,
    name: 'GitHub Copilot',
    model: 'gpt-4',
    tool: 'copilot',
  },
  {
    id: 'codewhisperer',
    type: 'agent' as const,
    name: 'CodeWhisperer',
    model: 'aws-llm',
    tool: 'codewhisperer',
  },
  {
    id: 'demo-user',
    type: 'user' as const,
    name: 'Demo User',
  },
  {
    id: 'ci-system',
    type: 'service' as const,
    name: 'CI System',
    serviceType: 'ci',
  },
] as const;

/**
 * Creates demo authors in the database
 * @param {Database} db - The database instance
 * @returns {Promise<void>}
 */
async function createDemoAuthors(db: FieldbooksDb): Promise<void> {
  for (const author of DEMO_AUTHORS) {
    try {
      await db.insert(authors).values({
        ...author,
        createdAt: Date.now(),
      });
      console.log(`✓ Created author: ${author.name} (${author.type})`);
    } catch (error) {
      console.log(`✓ Author already exists: ${author.name}`);
    }
  }
}

/**
 * Creates demo entries for each author
 * @param {Database} db - The database instance
 * @returns {Promise<void>}
 */
async function createDemoEntries(db: FieldbooksDb): Promise<void> {
  const demoEntries = [
    {
      authorId: 'claude-engineer',
      type: 'update' as const,
      content: `## Project Setup
- Initialized new TypeScript project with strict mode
- Set up ESLint with recommended rules
- Configured Prettier for consistent formatting
- Added husky for pre-commit hooks`,
    },
    {
      authorId: 'claude-engineer',
      type: 'decision' as const,
      content: `## API Design Discussion
User requested RESTful API with the following endpoints:
- \`GET /api/users\` - List all users
- \`POST /api/users\` - Create new user
- \`GET /api/users/:id\` - Get user by ID

Implemented with Express and TypeScript interfaces for type safety.`,
    },
    {
      authorId: 'github-copilot',
      type: 'observation' as const,
      content: `## Autocomplete Patterns
- Recognized pattern for React component structure
- Suggested prop types based on usage
- Auto-imported required dependencies`,
    },
    {
      authorId: 'codewhisperer',
      type: 'task' as const,
      content: `## Security Scan Results
Found 0 vulnerabilities in dependencies.
Suggested improvements:
- Add input validation for user endpoints
- Implement rate limiting
- Use parameterized queries for database`,
    },
    {
      authorId: 'demo-user',
      type: 'handoff' as const,
      content: `## End of Day Handoff
Completed:
- API endpoints implementation
- Basic security measures
- Unit tests for core functionality

Tomorrow:
- Integration testing
- Documentation updates
- Deploy to staging`,
    },
    {
      authorId: 'ci-system',
      type: 'error' as const,
      content: `## Build Failed
Test suite failed with 2 errors:
- UserService.test.ts: timeout in async test
- AuthMiddleware.test.ts: mock not properly configured

See logs for details.`,
    },
    {
      authorId: 'claude-engineer',
      type: 'checkpoint' as const,
      content: `## Milestone: MVP Complete
All core features implemented:
- User authentication
- CRUD operations
- Basic error handling
- Test coverage at 85%

Ready for initial deployment.`,
    },
  ];

  console.log('\nCreating demo entries...');

  for (const entry of demoEntries) {
    try {
      const entryId = await addEntry(db, {
        authorId: entry.authorId,
        md: entry.content,
        type: entry.type,
      });
      console.log(`✓ Created ${entry.type} entry for ${entry.authorId}: ${entryId}`);
    } catch (error) {
      console.error(`✗ Failed to create entry for ${entry.authorId}:`, error);
    }
  }
}

/**
 * Main setup function that orchestrates the demo environment creation
 * @returns {Promise<void>}
 */
async function setup(): Promise<void> {
  console.log('🚀 Setting up Fieldbooks demo environment...\n');

  try {
    // Initialize the fieldbook directory structure
    const dir = await initFieldbookDir();
    console.log(`✓ Initialized fieldbook directory at: ${dir}\n`);

    const db = await setupFieldbook();

    await createDemoAuthors(db);
    await createDemoEntries(db);

    console.log('\n✅ Demo setup complete!');
    console.log(`\nYou can now run demos with:`);
    console.log(`  FIELDBOOKS_AUTHOR_ID=claude-engineer node demo.js`);
    console.log(`  FIELDBOOKS_AUTHOR_ID=github-copilot node demo.js`);
    console.log(`  FIELDBOOKS_AUTHOR_ID=codewhisperer node demo.js`);
    console.log(`  FIELDBOOKS_AUTHOR_ID=demo-user node demo.js`);
    console.log(`  FIELDBOOKS_AUTHOR_ID=ci-system node demo.js`);
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
