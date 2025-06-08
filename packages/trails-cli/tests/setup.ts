import { beforeEach, afterEach, vi } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Mock process.exit to prevent tests from exiting
export const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

// Mock console methods
export const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset environment variables
  process.env.TRAILS_AGENT_ID = undefined;
});

afterEach(() => {
  // Clean up test databases
  const files = require('fs').readdirSync(tmpdir());
  files.forEach((file: string) => {
    if (file.startsWith('test-trails-') && file.endsWith('.sqlite')) {
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

  // Clean up any local trails.sqlite created during tests
  if (existsSync('./trails.sqlite')) {
    try {
      unlinkSync('./trails.sqlite');
    } catch {
      // Ignore
    }
  }
});
