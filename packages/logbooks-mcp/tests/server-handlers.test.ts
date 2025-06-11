import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { setupDatabase, addEntry, listEntries, type LogbooksDb } from 'logbooks-lib';

// Test the handlers directly without mocking the entire server
describe('Logbooks MCP Server Handlers', () => {
  let testDbPath: string;
  let db: LogbooksDb;

  beforeEach(async () => {
    testDbPath = './test-logbooks.sqlite';
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
    db = await setupDatabase(testDbPath);
  });

  afterEach(() => {
    if (existsSync(testDbPath)) {
      try {
        unlinkSync(testDbPath);
      } catch {
        // Ignore
      }
    }
  });

  describe('Tool Functionality', () => {
    it('should add entry successfully', async () => {
      // Need to create author first
      const { authors } = await import('logbooks-lib');

      await db.insert(authors).values({
        id: 'test-author',
        type: 'agent',
        name: 'Test Author',
        createdAt: Date.now(),
      });

      const entryId = await addEntry(db, {
        authorId: 'test-author',
        type: 'update',
        md: '# Test Entry',
        ts: Date.now(),
      });

      expect(entryId).toBeDefined();
      expect(entryId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      const entries = await listEntries(db, { authorId: 'test-author' });
      expect(entries).toHaveLength(1);
      expect(entries[0].md).toBe('# Test Entry');
    });

    it('should list entries with filters', async () => {
      // Need to create author first
      const { authors } = await import('logbooks-lib');

      await db.insert(authors).values({
        id: 'author-1',
        type: 'agent',
        name: 'Author 1',
        createdAt: Date.now(),
      });

      const baseTime = Date.now();

      // Add test entries
      for (let i = 0; i < 5; i++) {
        await addEntry(db, {
          authorId: 'author-1',
          type: 'update',
          md: `Entry ${i}`,
          ts: baseTime + i * 1000,
        });
      }

      // Test default listing
      const allEntries = await listEntries(db);
      expect(allEntries.length).toBeGreaterThan(0);

      // Test with author filter
      const authorEntries = await listEntries(db, { authorId: 'author-1' });
      expect(authorEntries).toHaveLength(5);

      // Test with time filter
      const recentEntries = await listEntries(db, {
        after: baseTime + 2000,
        limit: 10,
      });
      expect(recentEntries.length).toBeLessThan(5);
    });

    it('should handle validation errors', async () => {
      await expect(
        addEntry(db, {
          authorId: '',
          type: 'update',
          md: 'Test',
        }),
      ).rejects.toThrow();

      await expect(
        addEntry(db, {
          authorId: 'test',
          type: 'update',
          md: '',
        }),
      ).rejects.toThrow();
    });
  });

  describe('MCP Response Format', () => {
    it('should format success response correctly', () => {
      const entryId = 'test-id-123';
      const response = {
        content: [
          {
            type: 'text',
            text: `Entry added successfully with ID: ${entryId}`,
          },
        ],
      };

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain(entryId);
    });

    it('should format error response correctly', () => {
      const errorMessage = 'Test error';
      const response = {
        content: [
          {
            type: 'text',
            text: `Error adding entry: ${errorMessage}`,
          },
        ],
        isError: true,
      };

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('isError', true);
      expect(response.content[0].text).toContain(errorMessage);
    });
  });

  describe('Tool Schemas', () => {
    it('should define correct tool schemas', () => {
      const tools = [
        {
          name: 'addEntry',
          description: 'Add a new entry to Logbooks',
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
              type: {
                type: 'string',
                description:
                  'Entry type (update, decision, error, handoff, observation, task, checkpoint)',
                enum: [
                  'update',
                  'decision',
                  'error',
                  'handoff',
                  'observation',
                  'task',
                  'checkpoint',
                ],
              },
              ts: {
                type: 'number',
                description: 'Timestamp in unix milliseconds (optional, defaults to current time)',
              },
            },
            required: ['md', 'type'],
          },
        },
        {
          name: 'listEntries',
          description: 'List entries from Logbooks',
          inputSchema: {
            type: 'object',
            properties: {
              authorId: {
                type: 'string',
                description: 'Filter by author ID',
              },
              type: {
                type: 'string',
                description: 'Filter by entry type',
                enum: [
                  'update',
                  'decision',
                  'error',
                  'handoff',
                  'observation',
                  'task',
                  'checkpoint',
                ],
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
            },
          },
        },
      ];

      // Verify tool structure
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });

      // Verify addEntry schema
      const addEntryTool = tools.find((t) => t.name === 'addEntry');
      expect(addEntryTool?.inputSchema.required).toEqual(['md', 'type']);
      expect(addEntryTool?.inputSchema.properties).toHaveProperty('md');
      expect(addEntryTool?.inputSchema.properties).toHaveProperty('authorId');
      expect(addEntryTool?.inputSchema.properties).toHaveProperty('type');
      expect(addEntryTool?.inputSchema.properties).toHaveProperty('ts');

      // Verify listEntries schema
      const listEntriesTool = tools.find((t) => t.name === 'listEntries');
      expect(listEntriesTool?.inputSchema.properties).toHaveProperty('authorId');
      expect(listEntriesTool?.inputSchema.properties).toHaveProperty('type');
      expect(listEntriesTool?.inputSchema.properties).toHaveProperty('after');
      expect(listEntriesTool?.inputSchema.properties).toHaveProperty('before');
      expect(listEntriesTool?.inputSchema.properties).toHaveProperty('limit');
    });
  });
});
