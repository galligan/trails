import { beforeEach, afterEach, vi } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Mock console.error to prevent server logs in tests
export const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
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
