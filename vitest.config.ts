import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/dist/**',
        '**/*.config.{js,ts,mjs}',
        '**/*.d.ts',
        '**/types.ts',
        '**/__tests__/**',
        '**/tests/**',
        'basecamp/**',
        'setup-cli.js',
        '**/bin/**',
        '**/examples/**',
        '**/scripts/**',
      ],
      include: ['packages/*/src/**/*.{js,ts}'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
