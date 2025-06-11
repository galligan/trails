import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setupDatabase, setupFieldbook, addEntry, listEntries } from 'logbooks-lib';
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

    console.log('Running command:', cliPath, args);

    // Include FIELDBOOKS_DB from process.env if not overridden
    const envVars = {
      ...process.env,
      ...env,
    };

    const result = execFileSync('node', [cliPath, ...args], {
      env: envVars,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { stdout: result.toString(), stderr: '', code: 0 };
  } catch (error) {
    const err = error as {
      stderr?: Buffer | string;
      stdout?: Buffer | string;
      status?: number;
      output?: Array<Buffer | string | null>;
    };

    // execSync with stdio:'pipe' returns output in the error object
    let stdout = '';
    let stderr = '';

    if (err.output) {
      // output[0] is stdin (null), output[1] is stdout, output[2] is stderr
      stdout = err.output[1] ? err.output[1].toString() : '';
      stderr = err.output[2] ? err.output[2].toString() : '';
    } else {
      // Fallback to direct properties
      stderr = err.stderr ? err.stderr.toString() : '';
      stdout = err.stdout ? err.stdout.toString() : '';
    }

    console.log('Command failed:', { stderr, stdout, code: err.status });

    return {
      stdout,
      stderr,
      code: err.status || 1,
    };
  }
}

describe('Fieldbooks CLI', () => {
  let testDbPath: string;

  beforeEach(() => {
    testDbPath = './fieldbook.sqlite';
    // Set environment variable for tests to use current directory
    process.env.FIELDBOOKS_DB = testDbPath;
    // Clean up any existing database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    delete process.env.FIELDBOOKS_DB;
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
      expect(result.stdout).toContain('CLI for Fieldbooks field recording service');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('list');
    });

    it('should display version', () => {
      const result = runCLI(['--version']);
      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe('0.0.1');
    });
  });

  describe('add command', () => {
    it('should add an entry with author ID from command line', () => {
      // Temporarily unmock console.log to see output
      mockConsole.log.mockRestore();

      const result = runCLI(['add', 'Test entry content', '--author', 'test-author']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Entry saved successfully');
      expect(existsSync(testDbPath)).toBe(true);
    });

    it('should add an entry with author ID from environment', () => {
      const result = runCLI(['add', 'Test entry from env'], { FIELDBOOKS_AUTHOR_ID: 'env-author' });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Entry saved successfully');
    });

    it('should prefer command line author ID over environment', async () => {
      const result = runCLI(['add', 'Test entry', '--author', 'cli-author'], {
        FIELDBOOKS_AUTHOR_ID: 'env-author',
      });
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Entry saved successfully');

      // Verify the entry was added with CLI author ID
      const db = await setupDatabase(testDbPath);
      const entries = await listEntries(db, { authorId: 'cli-author' });
      expect(entries).toHaveLength(1);
    });

    it('should fail when no author ID is provided', () => {
      // Explicitly clear FIELDBOOKS_AUTHOR_ID to ensure no environment leak
      const result = runCLI(['add', 'Test entry'], { FIELDBOOKS_AUTHOR_ID: '' });
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Author ID is required');
    });

    it('should add entry with custom timestamp', () => {
      const timestamp = Date.now() - 10000;
      const result = runCLI([
        'add',
        'Test entry with timestamp',
        '--author',
        'test-author',
        '--timestamp',
        timestamp.toString(),
      ]);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Entry saved successfully');
    });

    it('should handle markdown content with special characters', () => {
      const markdown = '# Test\\n\\n```js\\nconst x = 5;\\n```';
      const result = runCLI(['add', markdown, '--author', 'test-author']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Entry saved successfully');
    });

    it('should handle validation errors', () => {
      const result = runCLI(['add', '', '--author', 'test-author']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('error: missing required argument');
    });

    it('should display help for add command', () => {
      const result = runCLI(['add', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Add an entry');
      expect(result.stdout).toContain('-a, --author');
      expect(result.stdout).toContain('-t, --timestamp');
    });
  });

  describe('list command', () => {
    beforeEach(async () => {
      // Set up test data
      const db = await setupDatabase(testDbPath);
      const baseTime = Date.now();

      // Import tables
      const { authors } = await import('logbooks-lib');

      // Create authors
      await db.insert(authors).values([
        {
          id: 'author-1',
          type: 'agent',
          name: 'Author 1',
          createdAt: Date.now(),
        },
        {
          id: 'author-2',
          type: 'agent',
          name: 'Author 2',
          createdAt: Date.now(),
        },
      ]);

      // Add entries for different authors
      for (let i = 0; i < 10; i++) {
        await addEntry(db, {
          authorId: 'author-1',
          type: 'update',
          md: `Entry ${i} for author-1`,
          ts: baseTime + i * 1000,
        });
      }

      for (let i = 0; i < 5; i++) {
        await addEntry(db, {
          authorId: 'author-2',
          type: 'observation',
          md: `Entry ${i} for author-2`,
          ts: baseTime + i * 2000,
        });
      }
    });

    it('should list recent entries with default limit', () => {
      const result = runCLI(['list']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Recent Entries');

      // Should show 5 entries by default (the React Ink output shows them in a table format)
      const lines = result.stdout.split('\n').filter((line) => line.includes('author-'));
      expect(lines.length).toBe(5);
    });

    it('should list entries with custom limit', () => {
      const result = runCLI(['list', '--limit', '3']);
      expect(result.code).toBe(0);

      const lines = result.stdout.split('\n').filter((line) => line.includes('author-'));
      expect(lines.length).toBe(3);
    });

    it('should filter entries by author ID', () => {
      const result = runCLI(['list', '--author', 'author-2', '--limit', '10']);
      expect(result.code).toBe(0);

      // Should only show author-2 entries
      expect(result.stdout).toContain('author-2');
      expect(result.stdout).not.toContain('author-1');
    });

    it('should filter entries by timestamp range', () => {
      const baseTime = Date.now();
      const afterTime = baseTime + 3000;
      const beforeTime = baseTime + 7000;

      const result = runCLI([
        'list',
        '--after',
        afterTime.toString(),
        '--before',
        beforeTime.toString(),
        '--limit',
        '20',
      ]);
      expect(result.code).toBe(0);

      // Should show filtered entries (in React Ink table format)
      const lines = result.stdout.split('\n').filter((line) => line.includes('author-'));
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThan(15); // Total entries
    });

    it('should handle empty results', () => {
      const futureTime = Date.now() + 1000000;
      const result = runCLI(['list', '--after', futureTime.toString()]);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('No entries found.');
    });

    it('should display formatted timestamps', () => {
      const result = runCLI(['list', '--limit', '1']);
      expect(result.code).toBe(0);

      // Should contain date format in React Ink output (e.g., "6/8/2025, 7:25:26 AM")
      expect(result.stdout).toMatch(/\d{1,2}\/\d{1,2}\/\d{4},\s+\d{1,2}:\d{2}:\d{2}\s+(AM|PM)/);
    });

    it('should handle validation errors', () => {
      const result = runCLI(['list', '--limit', '-1']);
      // React Ink handles errors differently - they show in stdout
      expect(result.stdout).toContain('Error');
    });

    it('should display help for list command', () => {
      const result = runCLI(['list', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('List recent entries');
      expect(result.stdout).toContain('-n, --limit');
      expect(result.stdout).toContain('-a, --author');
      expect(result.stdout).toContain('--after');
      expect(result.stdout).toContain('--before');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', { timeout: 35000 }, () => {
      // Create a corrupted database
      const fs = require('fs');
      fs.writeFileSync(testDbPath, 'corrupted data');

      const result = runCLI(['add', 'Test entry', '--author', 'test-author']);
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
      const result = runCLI(['add', 'Test', '--author', 'test', '--timestamp', 'not-a-number']);
      // Validation catches NaN from parseInt and shows error via React Ink
      expect(result.stdout).toContain('expected": "number');
      expect(result.stdout).toContain('received": "nan');
    });
  });

  describe('Integration Tests', () => {
    it('should support full workflow: add and tail', { timeout: 10000 }, () => {
      // Add multiple entries
      const entries = [
        { content: '# First entry', authorId: 'author-1' },
        { content: '## Second entry', authorId: 'author-1' },
        { content: '### Third entry', authorId: 'author-2' },
      ];

      entries.forEach(({ content, authorId }) => {
        const result = runCLI(['add', content, '--author', authorId]);
        expect(result.code).toBe(0);
      });

      // List all entries
      const listResult = runCLI(['list', '--limit', '10']);
      expect(listResult.code).toBe(0);
      expect(listResult.stdout).toContain('First entry');
      expect(listResult.stdout).toContain('Second entry');
      expect(listResult.stdout).toContain('Third entry');

      // List entries for specific author
      const author1Result = runCLI(['list', '--author', 'author-1']);
      expect(author1Result.code).toBe(0);
      expect(author1Result.stdout).toContain('First entry');
      expect(author1Result.stdout).toContain('Second entry');
      expect(author1Result.stdout).not.toContain('Third entry');
    });

    it('should persist data across CLI invocations', () => {
      // Add entry
      const addResult = runCLI(['add', 'Persistent entry', '--author', 'test-author']);
      expect(addResult.code).toBe(0);

      // List entries in separate invocation
      const listResult = runCLI(['list']);
      expect(listResult.code).toBe(0);
      expect(listResult.stdout).toContain('Persistent entry');
    });
  });
});
