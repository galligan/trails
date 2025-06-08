#!/usr/bin/env node

/**
 * @fileoverview Demo script showing MCP server integration with Trails
 * @module basecamp/demo
 */

import { setupDatabase, notes } from '../packages/trails-lib/dist/index.js';
import { eq } from 'drizzle-orm';
import type { TrailsDb } from '../packages/trails-lib/dist/index.js';

/**
 * Demonstrates basic Trails functionality by listing notes for a specific agent
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const dbPath = process.env.TRAILS_DB || './trails.sqlite';
  const agentId = process.env.TRAILS_AGENT_ID || 'claude-engineer';

  console.log(`🔍 Fetching notes for agent: ${agentId}`);
  console.log(`📁 Database: ${dbPath}\n`);

  try {
    const db: TrailsDb = await setupDatabase(dbPath);
    
    const results = await db
      .select()
      .from(notes)
      .where(eq(notes.agentId, agentId))
      .orderBy(notes.ts);

    if (results.length === 0) {
      console.log('No notes found for this agent.');
      return;
    }

    console.log(`Found ${results.length} notes:\n`);
    
    results.forEach((note, index) => {
      const date = new Date(note.ts * 1000).toLocaleString();
      console.log(`[${index + 1}] ${date}`);
      console.log(`ID: ${note.id}`);
      console.log('─'.repeat(50));
      console.log(note.md);
      console.log('\n');
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };