#!/usr/bin/env node

import { Command } from 'commander';

import { runAddCommand } from './commands/add.js';
import { runInitCommand } from './commands/init.js';
import { runListCommand } from './commands/list.js';

const program = new Command();

program
  .name('logbooks')
  .description('CLI for Logbooks field recording service')
  .version('0.0.1');

program
  .command('init')
  .description('Initialize a new logbook in the current directory')
  .action(runInitCommand);

program
  .command('add')
  .description('Add an entry')
  .argument('<markdown>', 'Entry content in Markdown')
  .option('-a, --author <id>', 'Author ID', process.env.LOGBOOKS_AUTHOR_ID)
  .option('-t, --timestamp <ts>', 'Timestamp (unix millis)', parseInt)
  .option(
    '--type <type>',
    'Entry type (update, decision, error, handoff, observation, task, checkpoint)',
    'update',
  )
  .action((markdown: string, options: { author?: string; timestamp?: number; type?: string }) => {
    if (options.author === undefined || options.author === '') {
      console.error(
        'Error: Author ID is required. Set --author or LOGBOOKS_AUTHOR_ID environment variable.',
      );
      process.exit(1);
    }

    runAddCommand({
      authorId: options.author,
      timestamp: options.timestamp,
      type: options.type as
        | 'update'
        | 'decision'
        | 'error'
        | 'handoff'
        | 'observation'
        | 'task'
        | 'checkpoint'
        | undefined,
      initialContent: markdown,
    });
  });

program
  .command('list')
  .description('List recent entries')
  .option('-n, --limit <number>', 'Number of entries to show', parseInt, 5)
  .option('-a, --author <id>', 'Filter by author ID')
  .option('--after <ts>', 'Show entries after timestamp', parseInt)
  .option('--before <ts>', 'Show entries before timestamp', parseInt)
  .option('--type <type>', 'Filter by entry type')
  .option('--sort <field>', 'Sort by field (timestamp, author, type)', 'timestamp')
  .option('--order <order>', 'Sort order (asc, desc)', 'desc')
  .action(
    (options: {
      limit?: number;
      author?: string;
      after?: number;
      before?: number;
      type?: string;
      sort?: string;
      order?: string;
    }) => {
      runListCommand({
        ...options,
        authorId: options.author,
      });
    },
  );

program.parse();
