import { beforeEach, afterEach, vi } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Mock for process.exit to prevent tests from actually exiting
 * Throws an error instead of exiting to allow tests to catch exit behavior
 */
export const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

/**
 * Mocked console methods to prevent test output noise
 * Includes mocks for console.log and console.error
 */
export const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset environment variables
  process.env.LOGBOOKS_AUTHOR_ID = undefined;
});

afterEach(() => {
  // Clean up test databases
  const files = require('fs').readdirSync(tmpdir());
  files.forEach((file: string) => {
    if (file.startsWith('test-logbook-') && file.endsWith('.sqlite')) {
      const path = join(tmpdir(), file);
      if (existsSync(path)) {
        try {
          unlinkSync(path);
        } catch {
          // Ignore errors
        }
      }
    }
  });

  // Clean up any local logbook.sqlite created during tests
  if (existsSync('./logbook.sqlite')) {
    try {
      unlinkSync('./logbook.sqlite');
    } catch {
      // Ignore
    }
  }
});
