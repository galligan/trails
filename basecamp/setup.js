import { setupDatabase, addNote, users, agents } from 'trails-lib';

async function setupDemo() {
  console.log('Setting up Trails demo database...');

  const db = await setupDatabase('./basecamp-demo.sqlite');

  // Create demo users and agents
  await db.insert(users).values([
    {
      id: 'user-alice',
      name: 'Alice Johnson',
      createdAt: Date.now(),
    },
    {
      id: 'user-bob',
      name: 'Bob Smith',
      createdAt: Date.now(),
    },
  ]);

  await db.insert(agents).values([
    {
      id: 'cursor-gpt-4o',
      userId: 'user-alice',
      label: 'Cursor GPT-4',
      createdAt: Date.now(),
    },
    {
      id: 'claude-3-5-sonnet',
      userId: 'user-alice',
      label: 'Claude 3.5 Sonnet',
      createdAt: Date.now(),
    },
    {
      id: 'manual-alice',
      userId: 'user-alice',
      label: 'Alice Manual',
      createdAt: Date.now(),
    },
  ]);

  // Add some demo notes
  await addNote(db, {
    agentId: 'cursor-gpt-4o',
    md: '# Project Start\n\nInitialized the Trails project with basic monorepo structure. Set up pnpm workspace and TypeScript configuration.',
  });

  await addNote(db, {
    agentId: 'manual-alice',
    md: '## Design Review\n\nReviewed the PRD and decided to go with SQLite + Drizzle for MVP. Will add PostgreSQL support later.',
  });

  await addNote(db, {
    agentId: 'claude-3-5-sonnet',
    md: '### Implementation Progress\n\n- ✅ Core schema defined\n- ✅ API layer complete\n- ✅ CLI working\n- 🚧 MCP server in progress\n- ⏳ Tests needed',
  });

  console.log('Demo database setup complete!');
  console.log('Try: node demo.js');
}

setupDemo().catch(console.error);
