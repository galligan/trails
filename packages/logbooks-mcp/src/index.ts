#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  setupLogbook,
  addEntry,
  listEntries,
  validateEntryInput,
  validateListOptions,
  LogbooksDbError,
  type LogbooksDb,
} from 'logbooks-lib';

const server = new Server(
  {
    name: 'logbooks',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Initialize database
let db: LogbooksDb | null = null;

async function initializeDb(): Promise<void> {
  db = await setupLogbook();
}

// Add entry tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: No arguments provided',
        },
      ],
      isError: true,
    };
  }

  switch (name) {
    case 'addEntry': {
      try {
        if (db === null) {
          await initializeDb();
          if (db === null) throw new Error('Failed to initialize database');
        }

        const input = validateEntryInput({
          authorId: args.authorId ?? 'mcp-client',
          md: args.md,
          ts: args.ts,
          type: args.type,
        });

        const entryId = await addEntry(db, input);

        return {
          content: [
            {
              type: 'text',
              text: `Entry added successfully with ID: ${entryId}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = `Error adding entry: ${error instanceof Error ? error.message : String(error)}`;

        if (error instanceof LogbooksDbError) {
          errorMessage += ' (The operation was automatically retried but still failed)';
        }

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    case 'listEntries': {
      try {
        if (db === null) {
          await initializeDb();
          if (db === null) throw new Error('Failed to initialize database');
        }

        const options = validateListOptions({
          authorId: args.authorId,
          after: args.after,
          before: args.before,
          limit: args.limit ?? 20,
          type: args.type,
        });

        const entries = await listEntries(db, options);

        const entriesText =
          entries.length === 0
            ? 'No entries found.'
            : entries
                .map((entry) => {
                  const date = new Date(entry.ts).toISOString();
                  const type = entry.type ? ` [${entry.type}]` : '';
                  return `[${date}] ${entry.authorId}${type}\n${entry.md}`;
                })
                .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: entriesText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = `Error listing entries: ${error instanceof Error ? error.message : String(error)}`;

        if (error instanceof LogbooksDbError) {
          errorMessage += ' (The operation was automatically retried but still failed)';
        }

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: 'addEntry',
        description: 'Add a new entry to the logbook',
        inputSchema: {
          type: 'object',
          properties: {
            md: {
              type: 'string',
              description: 'Entry content in Markdown',
            },
            authorId: {
              type: 'string',
              description: 'Author ID (optional, defaults to mcp-client)',
            },
            ts: {
              type: 'number',
              description: 'Timestamp in unix milliseconds (optional, defaults to current time)',
            },
            type: {
              type: 'string',
              enum: ['update', 'decision', 'error', 'handoff', 'observation', 'task', 'checkpoint'],
              description: 'Type of entry (optional, defaults to update)',
            },
          },
          required: ['md'],
        },
      },
      {
        name: 'listEntries',
        description: 'List entries from the logbook',
        inputSchema: {
          type: 'object',
          properties: {
            authorId: {
              type: 'string',
              description: 'Filter by author ID',
            },
            after: {
              type: 'number',
              description: 'Show entries after this timestamp',
            },
            before: {
              type: 'number',
              description: 'Show entries before this timestamp',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of entries to return (default: 20)',
            },
            type: {
              type: 'string',
              description: 'Filter by entry type',
            },
          },
        },
      },
    ],
  };
});

async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Logbooks MCP server running on stdio');
}

runServer().catch(console.error);
