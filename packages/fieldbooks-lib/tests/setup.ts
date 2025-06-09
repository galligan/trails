import { beforeEach, afterEach } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Test database path
export const getTestDbPath = () => join(tmpdir(), `test-fieldbooks-${Date.now()}.sqlite`);

// Global test setup
beforeEach(() => {
  // Each test gets a fresh database
});

afterEach(() => {
  // Clean up test databases
  const files = require('fs').readdirSync(tmpdir());
  files.forEach((file: string) => {
    if (file.startsWith('test-fieldbooks-') && file.endsWith('.sqlite')) {
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
});
