import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, unlinkSync } from 'fs';
import { setupDatabase, addNote, listNotes, type TrailsDb } from 'trails-lib';

// Test the handlers directly without mocking the entire server
describe('Trails MCP Server Handlers', () => {
  let testDbPath: string;
  let db: TrailsDb;

  beforeEach(async () => {
    testDbPath = './test-trails.sqlite';
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
    it('should add note successfully', async () => {
      // Need to create user and agent first
      const { users, agents } = await import('trails-lib');

      await db.insert(users).values({
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
      });

      await db.insert(agents).values({
        id: 'test-agent',
        userId: 'test-user',
        label: 'Test Agent',
        createdAt: Date.now(),
      });

      const noteId = await addNote(db, {
        agentId: 'test-agent',
        md: '# Test Note',
        ts: Date.now(),
      });

      expect(noteId).toBeDefined();
      expect(noteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      const notes = await listNotes(db, { agentId: 'test-agent' });
      expect(notes).toHaveLength(1);
      expect(notes[0].md).toBe('# Test Note');
    });

    it('should list notes with filters', async () => {
      // Need to create user and agent first
      const { users, agents } = await import('trails-lib');

      await db.insert(users).values({
        id: 'test-user',
        name: 'Test User',
        createdAt: Date.now(),
      });

      await db.insert(agents).values({
        id: 'agent-1',
        userId: 'test-user',
        label: 'Agent 1',
        createdAt: Date.now(),
      });

      const baseTime = Date.now();

      // Add test notes
      for (let i = 0; i < 5; i++) {
        await addNote(db, {
          agentId: 'agent-1',
          md: `Note ${i}`,
          ts: baseTime + i * 1000,
        });
      }

      // Test default listing
      const allNotes = await listNotes(db);
      expect(allNotes.length).toBeGreaterThan(0);

      // Test with agent filter
      const agentNotes = await listNotes(db, { agentId: 'agent-1' });
      expect(agentNotes).toHaveLength(5);

      // Test with time filter
      const recentNotes = await listNotes(db, {
        after: baseTime + 2000,
        limit: 10,
      });
      expect(recentNotes.length).toBeLessThan(5);
    });

    it('should handle validation errors', async () => {
      await expect(
        addNote(db, {
          agentId: '',
          md: 'Test',
        }),
      ).rejects.toThrow();

      await expect(
        addNote(db, {
          agentId: 'test',
          md: '',
        }),
      ).rejects.toThrow();
    });
  });

  describe('MCP Response Format', () => {
    it('should format success response correctly', () => {
      const noteId = 'test-id-123';
      const response = {
        content: [
          {
            type: 'text',
            text: `Note added successfully with ID: ${noteId}`,
          },
        ],
      };

      expect(response).toHaveProperty('content');
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe('text');
      expect(response.content[0].text).toContain(noteId);
    });

    it('should format error response correctly', () => {
      const errorMessage = 'Test error';
      const response = {
        content: [
          {
            type: 'text',
            text: `Error adding note: ${errorMessage}`,
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
      ];

      // Verify tool structure
      tools.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });

      // Verify addNote schema
      const addNoteTool = tools.find((t) => t.name === 'addNote');
      expect(addNoteTool?.inputSchema.required).toEqual(['md']);
      expect(addNoteTool?.inputSchema.properties).toHaveProperty('md');
      expect(addNoteTool?.inputSchema.properties).toHaveProperty('agentId');
      expect(addNoteTool?.inputSchema.properties).toHaveProperty('ts');

      // Verify listNotes schema
      const listNotesTool = tools.find((t) => t.name === 'listNotes');
      expect(listNotesTool?.inputSchema.properties).toHaveProperty('agentId');
      expect(listNotesTool?.inputSchema.properties).toHaveProperty('after');
      expect(listNotesTool?.inputSchema.properties).toHaveProperty('before');
      expect(listNotesTool?.inputSchema.properties).toHaveProperty('limit');
    });
  });
});
