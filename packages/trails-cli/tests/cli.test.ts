import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupDatabase, addNote, listNotes } from 'trails-lib';
import { mockExit, mockConsole } from './setup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = join(__dirname, '..', 'dist', 'index.js');

/**
 * Helper to run CLI commands in a subprocess
 * @param args - Array of command-line arguments
 * @param env - Optional environment variables to set
 * @returns Object containing stdout, stderr, and exit code
 */
function runCLI(
  args: string[],
  env: Record<string, string> = {},
): { stdout: string; stderr: string; code: number } {
  try {
    const argsString = args
      .map((arg) => {
        // Escape arguments that contain spaces or special characters
        if (arg.includes(' ') || arg.includes('\\') || arg.includes('"') || arg.includes('$')) {
          // Escape backslashes first, then quotes
          return `"${arg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
        }
        return arg;
      })
      .join(' ');

    const command = `node ${cliPath} ${argsString}`;
    console.log('Running command:', command);

    const result = execSync(command, {
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: result.toString(), stderr: '', code: 0 };
  } catch (error) {
    const err = error as { stderr?: Buffer; stdout?: Buffer; status?: number };
    const stderr = err.stderr ? err.stderr.toString() : '';
    const stdout = err.stdout ? err.stdout.toString() : '';

    console.log('Command failed:', { stderr, stdout, code: err.status });

    return {
      stdout,
      stderr,
      code: err.status || 1,
    };
  }
}

describe('Trails CLI', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = './trails.sqlite';
    // Clean up any existing database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
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

  describe('General', () => {
    it('should display help when no command is provided', () => {
      const result = runCLI(['--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('CLI for Trails context-log service');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('tail');
    });

    it('should display version', () => {
      const result = runCLI(['--version']);
      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe('0.0.1');
    });
  });

  describe('add command', () => {
    it('should add a note with agent ID from command line', () => {
      // Temporarily unmock console.log to see output
      mockConsole.log.mockRestore();

      const result = runCLI(['add', 'Test note content', '--agent-id', 'test-agent']);
      console.log('Test result:', result);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Note saved successfully');
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should add a note with agent ID from environment', () => {
      const result = runCLI(['add', 'Test note from env'], { TRAILS_AGENT_ID: 'env-agent' });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Note saved successfully');
    });

    it('should prefer command line agent ID over environment', async () => {
      const result = runCLI(['add', 'Test note', '--agent-id', 'cli-agent'], {
        TRAILS_AGENT_ID: 'env-agent',
      });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Note saved successfully');

      // Verify the note was added with CLI agent ID
      const db = await setupDatabase(testDbPath);
      const notes = await listNotes(db, { agentId: 'cli-agent' });
      expect(notes).toHaveLength(1);
    });

    it('should fail when no agent ID is provided', () => {
      const result = runCLI(['add', 'Test note']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Agent ID is required');
    });

    it('should add note with custom timestamp', () => {
      const timestamp = Date.now() - 10000;
      const result = runCLI([
        'add',
        'Test note with timestamp',
        '--agent-id',
        'test-agent',
        '--timestamp',
        timestamp.toString(),
      ]);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Note saved successfully');
    });

    it('should handle markdown content with special characters', () => {
      const markdown = '# Test\\n\\n```js\\nconst x = 5;\\n```';
      const result = runCLI(['add', markdown, '--agent-id', 'test-agent']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Note saved successfully');
    });

    it('should handle validation errors', () => {
      const result = runCLI(['add', '', '--agent-id', 'test-agent']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('error: missing required argument');
    });

    it('should display help for add command', () => {
      const result = runCLI(['add', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Add a note');
      expect(result.stdout).toContain('-a, --agent-id');
      expect(result.stdout).toContain('-t, --timestamp');
    });
  });

  describe('tail command', () => {
    beforeEach(async () => {
      // Set up test data
      const db = await setupDatabase(testDbPath);
      const baseTime = Date.now();

      // Import tables
      const { users, agents } = await import('trails-lib');

      // Create users
      await db.insert(users).values({
        id: 'test-user-1',
        name: 'Test User 1',
        createdAt: Date.now(),
      });

      // Create agents
      await db.insert(agents).values([
        {
          id: 'agent-1',
          userId: 'test-user-1',
          label: 'Agent 1',
          createdAt: Date.now(),
        },
        {
          id: 'agent-2',
          userId: 'test-user-1',
          label: 'Agent 2',
          createdAt: Date.now(),
        },
      ]);

      // Add notes for different agents
      for (let i = 0; i < 10; i++) {
        await addNote(db, {
          agentId: 'agent-1',
          md: `Note ${i} for agent-1`,
          ts: baseTime + i * 1000,
        });
      }

      for (let i = 0; i < 5; i++) {
        await addNote(db, {
          agentId: 'agent-2',
          md: `Note ${i} for agent-2`,
          ts: baseTime + i * 2000,
        });
      }
    });

    it('should list recent notes with default limit', () => {
      const result = runCLI(['tail']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Recent Notes');
      
      // Should show 5 notes by default (the React Ink output shows them in a table format)
      const lines = result.stdout.split('\n').filter(line => line.includes('agent-'));
      expect(lines.length).toBe(5);
    });

    it('should list notes with custom limit', () => {
      const result = runCLI(['tail', '--limit', '3']);
      expect(result.code).toBe(0);

      const lines = result.stdout.split('\n').filter(line => line.includes('agent-'));
      expect(lines.length).toBe(3);
    });

    it('should filter notes by agent ID', () => {
      const result = runCLI(['tail', '--agent-id', 'agent-2', '--limit', '10']);
      expect(result.code).toBe(0);

      // Should only show agent-2 notes
      expect(result.stdout).toContain('agent-2');
      expect(result.stdout).not.toContain('agent-1');
    });

    it('should filter notes by timestamp range', () => {
      const baseTime = Date.now();
      const afterTime = baseTime + 3000;
      const beforeTime = baseTime + 7000;

      const result = runCLI([
        'tail',
        '--after',
        afterTime.toString(),
        '--before',
        beforeTime.toString(),
        '--limit',
        '20',
      ]);
      expect(result.code).toBe(0);

      // Should show filtered notes (in React Ink table format)
      const lines = result.stdout.split('\n').filter(line => line.includes('agent-'));
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThan(15); // Total notes
    });

    it('should handle empty results', () => {
      const futureTime = Date.now() + 1000000;
      const result = runCLI(['tail', '--after', futureTime.toString()]);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('No notes found.');
    });

    it('should display formatted timestamps', () => {
      const result = runCLI(['tail', '--limit', '1']);
      expect(result.code).toBe(0);

      // Should contain date format in React Ink output (e.g., "6/8/2025, 7:25:26 AM")
      expect(result.stdout).toMatch(/\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+(AM|PM)/);
    });

    it('should handle validation errors', () => {
      const result = runCLI(['tail', '--limit', '-1']);
      // React Ink handles errors differently - they show in stdout
      expect(result.stdout).toContain('Error');
    });

    it('should display help for tail command', () => {
      const result = runCLI(['tail', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('List recent notes');
      expect(result.stdout).toContain('-n, --limit');
      expect(result.stdout).toContain('-a, --agent-id');
      expect(result.stdout).toContain('--after');
      expect(result.stdout).toContain('--before');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', () => {
      // Create a corrupted database
      const fs = require('fs');
      fs.writeFileSync(testDbPath, 'corrupted data');

      const result = runCLI(['add', 'Test note', '--agent-id', 'test-agent']);
      // React Ink shows errors in stdout
      expect(result.stdout).toContain('Error');
    });

    it('should handle invalid commands', () => {
      const result = runCLI(['invalid-command']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("error: unknown command 'invalid-command'");
    });

    it('should handle missing arguments', () => {
      const result = runCLI(['add']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain("error: missing required argument 'markdown'");
    });

    it('should handle invalid option types', () => {
      const result = runCLI(['add', 'Test', '--agent-id', 'test', '--timestamp', 'not-a-number']);
      // Commander validates the timestamp option type
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should support full workflow: add and tail', { timeout: 10000 }, () => {
      // Add multiple notes
      const notes = [
        { content: '# First note', agentId: 'agent-1' },
        { content: '## Second note', agentId: 'agent-1' },
        { content: '### Third note', agentId: 'agent-2' },
      ];

      notes.forEach(({ content, agentId }) => {
        const result = runCLI(['add', content, '--agent-id', agentId]);
        expect(result.code).toBe(0);
      });

      // List all notes
      const listResult = runCLI(['tail', '--limit', '10']);
      expect(listResult.code).toBe(0);
      expect(listResult.stdout).toContain('First note');
      expect(listResult.stdout).toContain('Second note');
      expect(listResult.stdout).toContain('Third note');

      // List notes for specific agent
      const agent1Result = runCLI(['tail', '--agent-id', 'agent-1']);
      expect(agent1Result.code).toBe(0);
      expect(agent1Result.stdout).toContain('First note');
      expect(agent1Result.stdout).toContain('Second note');
      expect(agent1Result.stdout).not.toContain('Third note');
    });

    it('should persist data across CLI invocations', () => {
      // Add note
      const addResult = runCLI(['add', 'Persistent note', '--agent-id', 'test-agent']);
      expect(addResult.code).toBe(0);

      // List notes in separate invocation
      const listResult = runCLI(['tail']);
      expect(listResult.code).toBe(0);
      expect(listResult.stdout).toContain('Persistent note');
    });
  });
});
