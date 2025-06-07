#!/usr/bin/env node

import { Command } from 'commander';
import { setupDatabase, addNote, listNotes, validateNoteInput, validateListOptions } from 'trails-lib';
import { resolve } from 'path';

const program = new Command();

program
  .name('trails')
  .description('CLI for Trails context-log service')
  .version('0.0.1');

program
  .command('add')
  .description('Add a note')
  .argument('<markdown>', 'Note content in Markdown')
  .option('-a, --agent-id <id>', 'Agent ID', process.env.TRAILS_AGENT_ID)
  .option('-t, --timestamp <ts>', 'Timestamp (unix millis)', parseInt)
  .action(async (markdown, options) => {
    try {
      if (!options.agentId) {
        console.error('Error: Agent ID is required. Set --agent-id or TRAILS_AGENT_ID environment variable.');
        process.exit(1);
      }

      const input = validateNoteInput({
        agentId: options.agentId,
        md: markdown,
        ts: options.timestamp
      });

      const dbPath = resolve('./trails.sqlite');
      const db = await setupDatabase(dbPath);
      const noteId = await addNote(db, input);
      
      console.log(`Note added: ${noteId}`);
    } catch (error) {
      console.error('Error adding note:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('tail')
  .description('List recent notes')
  .option('-n, --limit <number>', 'Number of notes to show', parseInt, 5)
  .option('-a, --agent-id <id>', 'Filter by agent ID')
  .option('--after <ts>', 'Show notes after timestamp', parseInt)
  .option('--before <ts>', 'Show notes before timestamp', parseInt)
  .action(async (options) => {
    try {
      const listOptions = validateListOptions({
        limit: options.limit,
        agentId: options.agentId,
        after: options.after,
        before: options.before
      });

      const dbPath = resolve('./trails.sqlite');
      const db = await setupDatabase(dbPath);
      const notes = await listNotes(db, listOptions);
      
      if (notes.length === 0) {
        console.log('No notes found.');
        return;
      }

      notes.forEach(note => {
        const date = new Date(note.ts).toISOString();
        console.log(`[${date}] ${note.agentId}`);
        console.log(note.md);
        console.log('---');
      });
    } catch (error) {
      console.error('Error listing notes:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();