#!/usr/bin/env node

/**
 * @fileoverview Demo script showing MCP server integration with Logbooks
 * @module basecamp/demo
 */

import { eq } from 'drizzle-orm';
import { setupLogbook, entries } from 'logbooks-lib';
import type { LogbooksDb } from 'logbooks-lib';

/**
 * Demonstrates basic Logbooks functionality by listing entries for a specific author
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const authorId = process.env.LOGBOOKS_AUTHOR_ID || 'claude-engineer';

  console.log(`🔍 Fetching entries for author: ${authorId}`);
  console.log(`📁 Using .logbook directory structure\n`);

  try {
    const db: LogbooksDb = await setupLogbook();

    const results = await db
      .select()
      .from(entries)
      .where(eq(entries.authorId, authorId))
      .orderBy(entries.ts);

    if (results.length === 0) {
      console.log('No entries found for this author.');
      return;
    }

    console.log(`Found ${results.length} entries:\n`);

    results.forEach((entry, index) => {
      const date = new Date(entry.ts).toLocaleString();
      const type = entry.type ? ` [${entry.type.toUpperCase()}]` : '';
      console.log(`[${index + 1}] ${date}${type}`);
      console.log(`ID: ${entry.id}`);
      console.log('─'.repeat(50));
      console.log(entry.md);
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
