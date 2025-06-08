#!/usr/bin/env node

import { resolve } from 'path';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  setupDatabase,
  addNote,
  listNotes,
  validateNoteInput,
  validateListOptions,
  TrailsDbError,
  type TrailsDb,
} from 'trails-lib';

const server = new Server(
  {
    name: 'trails',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Initialize database
const dbPath = resolve('./trails.sqlite');
let db: TrailsDb | null = null;

async function initializeDb(): Promise<void> {
  db = await setupDatabase(dbPath);
}

// Add note tool
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
    case 'addNote': {
      try {
        if (db === null) {
          await initializeDb();
          if (db === null) throw new Error('Failed to initialize database');
        }

        const input = validateNoteInput({
          agentId: args.agentId ?? 'mcp-client',
          md: args.md,
          ts: args.ts,
        });

        const noteId = await addNote(db, input);

        return {
          content: [
            {
              type: 'text',
              text: `Note added successfully with ID: ${noteId}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = `Error adding note: ${error instanceof Error ? error.message : String(error)}`;

        if (error instanceof TrailsDbError) {
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

    case 'listNotes': {
      try {
        if (db === null) {
          await initializeDb();
          if (db === null) throw new Error('Failed to initialize database');
        }

        const options = validateListOptions({
          agentId: args.agentId,
          after: args.after,
          before: args.before,
          limit: args.limit ?? 20,
        });

        const notes = await listNotes(db, options);

        const notesText =
          notes.length === 0
            ? 'No notes found.'
            : notes
                .map((note) => {
                  const date = new Date(note.ts).toISOString();
                  return `[${date}] ${note.agentId}\n${note.md}`;
                })
                .join('\n\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: notesText,
            },
          ],
        };
      } catch (error) {
        let errorMessage = `Error listing notes: ${error instanceof Error ? error.message : String(error)}`;

        if (error instanceof TrailsDbError) {
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
        name: 'addNote',
        description: 'Add a new note to Trails',
        inputSchema: {
          type: 'object',
          properties: {
            md: {
              type: 'string',
              description: 'Note content in Markdown',
            },
            agentId: {
              type: 'string',
              description: 'Agent ID (optional, defaults to mcp-client)',
            },
            ts: {
              type: 'number',
              description: 'Timestamp in unix milliseconds (optional, defaults to current time)',
            },
          },
          required: ['md'],
        },
      },
      {
        name: 'listNotes',
        description: 'List notes from Trails',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Filter by agent ID',
            },
            after: {
              type: 'number',
              description: 'Show notes after this timestamp',
            },
            before: {
              type: 'number',
              description: 'Show notes before this timestamp',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of notes to return (default: 20)',
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
  console.error('Trails MCP server running on stdio');
}

runServer().catch(console.error);
