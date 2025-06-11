# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Instructions

About You: @.ai/prompts/MAX.md

## Overview

Logbooks is a field recording service for AI agents and users to append or fetch entries for updates, recaps, and hand-offs. It's built as a monorepo using pnpm workspaces with three main packages: logbooks-lib (core library), logbooks-cli (command-line interface), and logbooks-mcp (MCP server).

## Commands

### Development
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Watch mode for development
pnpm dev

# Run specific package commands
pnpm --filter logbooks-lib build
pnpm --filter logbooks-cli test
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
pnpm --filter logbooks-lib test
```

### Code Quality
```bash
# Full CI check (lint, format, typecheck, test)
pnpm ci:local

# Lint all code
pnpm lint

# Format all code
pnpm format

# Type checking
pnpm typecheck
```

### Database
```bash
# Run migrations (from logbooks-lib)
pnpm --filter logbooks-lib db:migrate

# Generate migration files
pnpm --filter logbooks-lib db:generate
```

## Architecture

The project uses a clean monorepo structure with:

- **logbooks-lib**: Core domain logic, database models (Drizzle ORM + SQLite), and validation (Zod)
- **logbooks-cli**: Command-line interface with commands `add` and `list`
- **logbooks-mcp**: MCP server exposing `addEntry` and `listEntries` tools via stdio transport

Key architectural patterns:
- All inputs validated with Zod schemas before processing
- Custom error hierarchy (LogbooksError) with retry logic for database operations
- SQLite database with migrations support
- Strict TypeScript with no `any` types
- Async/await throughout with proper error handling

The data model consists of:
- `authors`: Unified table for users, agents, and services
- `entries`: Field recording entries with timestamps, markdown content, and types

## Testing Approach

Tests use Vitest with separate test databases. Integration tests cover the full flow from API to database. Target is >95% coverage. Tests are located alongside source files as `*.test.ts`.

## MCP Server Development

The logbooks-mcp package implements the Model Context Protocol. When modifying:
- Update the tool schemas in `index.ts`
- Ensure stdio transport compatibility
- Test with the MCP inspector or basecamp demo scripts