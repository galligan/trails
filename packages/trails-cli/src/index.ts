#!/usr/bin/env node

import { resolve } from 'path';

import { Command } from 'commander';
import { eq } from 'drizzle-orm';
import {
  setupDatabase,
  addNote,
  listNotes,
  validateNoteInput,
  validateListOptions,
  users,
  agents,
  retryDb,
  TrailsDbError,
  type TrailsDb,
} from 'trails-lib';

const program = new Command();

async function ensureAgentExists(db: TrailsDb, agentId: string): Promise<void> {
  return retryDb(
    async () => {
      // Check if agent exists
      const existingAgent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);

      if (existingAgent.length === 0) {
        // Create default user if doesn't exist
        const defaultUserId = 'cli-user';
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, defaultUserId))
          .limit(1);

        if (existingUser.length === 0) {
          await db.insert(users).values({
            id: defaultUserId,
            name: 'CLI User',
            createdAt: Date.now(),
          });
        }

        // Create agent
        await db.insert(agents).values({
          id: agentId,
          userId: defaultUserId,
          label: agentId,
          createdAt: Date.now(),
        });
      }
    },
    {
      onRetry: (error, attempt) => {
        console.warn(`Failed to ensure agent exists (attempt ${attempt}):`, error);
      },
    },
  );
}

program.name('trails').description('CLI for Trails context-log service').version('0.0.1');

program
  .command('add')
  .description('Add a note')
  .argument('<markdown>', 'Note content in Markdown')
  .option('-a, --agent-id <id>', 'Agent ID', process.env.TRAILS_AGENT_ID)
  .option('-t, --timestamp <ts>', 'Timestamp (unix millis)', parseInt)
  .action(async (markdown: string, options: { agentId?: string; timestamp?: number }) => {
    try {
      if (options.agentId === undefined || options.agentId === '') {
        console.error(
          'Error: Agent ID is required. Set --agent-id or TRAILS_AGENT_ID environment variable.',
        );
        process.exit(1);
      }

      const input = validateNoteInput({
        agentId: options.agentId,
        md: markdown,
        ts: options.timestamp,
      });

      const dbPath = resolve('./trails.sqlite');
      const db = await setupDatabase(dbPath);

      // Ensure agent exists
      await ensureAgentExists(db, input.agentId);

      const noteId = await addNote(db, input);

      console.log(`Note added: ${noteId}`);
    } catch (error) {
      console.error('Error adding note:', error instanceof Error ? error.message : String(error));
      if (error instanceof TrailsDbError) {
        console.error('This appears to be a database error. The operation was retried but failed.');
      }
      if (error instanceof Error && error.cause !== undefined) {
        console.error('Caused by:', error.cause);
      }
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
  .action(
    async (options: { limit?: number; agentId?: string; after?: number; before?: number }) => {
      try {
        const listOptions = validateListOptions({
          limit: options.limit,
          agentId: options.agentId,
          after: options.after,
          before: options.before,
        });

        const dbPath = resolve('./trails.sqlite');
        const db = await setupDatabase(dbPath);
        const notes = await listNotes(db, listOptions);

        if (notes.length === 0) {
          console.log('No notes found.');
          return;
        }

        notes.forEach((note) => {
          const date = new Date(note.ts).toISOString();
          console.log(`[${date}] ${note.agentId}`);
          console.log(note.md);
          console.log('---');
        });
      } catch (error) {
        console.error(
          'Error listing notes:',
          error instanceof Error ? error.message : String(error),
        );
        if (error instanceof TrailsDbError) {
          console.error(
            'This appears to be a database error. The operation was retried but failed.',
          );
        }
        if (error instanceof Error && error.cause !== undefined) {
          console.error('Caused by:', error.cause);
        }
        process.exit(1);
      }
    },
  );

program.parse();
