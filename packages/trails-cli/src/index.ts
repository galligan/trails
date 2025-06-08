#!/usr/bin/env node

import { Command } from 'commander';
import { runAddCommand } from './commands/add.js';
import { runTailCommand } from './commands/tail.js';

const program = new Command();

program.name('trails').description('CLI for Trails context-log service').version('0.0.1');

program
  .command('add')
  .description('Add a note')
  .argument('<markdown>', 'Note content in Markdown')
  .option('-a, --agent-id <id>', 'Agent ID', process.env.TRAILS_AGENT_ID)
  .option('-t, --timestamp <ts>', 'Timestamp (unix millis)', parseInt)
  .action((markdown: string, options: { agentId?: string; timestamp?: number }) => {
    if (options.agentId === undefined || options.agentId === '') {
      console.error(
        'Error: Agent ID is required. Set --agent-id or TRAILS_AGENT_ID environment variable.',
      );
      process.exit(1);
    }

    runAddCommand({
      agentId: options.agentId,
      timestamp: options.timestamp,
      initialContent: markdown,
    });
  });

program
  .command('tail')
  .description('List recent notes')
  .option('-n, --limit <number>', 'Number of notes to show', parseInt, 5)
  .option('-a, --agent-id <id>', 'Filter by agent ID')
  .option('--after <ts>', 'Show notes after timestamp', parseInt)
  .option('--before <ts>', 'Show notes before timestamp', parseInt)
  .action((options: { limit?: number; agentId?: string; after?: number; before?: number }) => {
    runTailCommand(options);
  });

program.parse();
