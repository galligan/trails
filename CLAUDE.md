# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Instructions

About You: @.ai/prompts/MAX.md

## Overview

Trails is a context-logging service for AI agents and users to append or fetch notes for updates, recaps, and hand-offs. It's built as a monorepo using pnpm workspaces with three main packages: trails-lib (core library), trails-cli (command-line interface), and trails-server (MCP server).

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
pnpm --filter trails-lib build
pnpm --filter trails-cli test
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
pnpm --filter trails-lib test
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
# Run migrations (from trails-lib)
pnpm --filter trails-lib db:migrate

# Generate migration files
pnpm --filter trails-lib db:generate
```

## Architecture

The project uses a clean monorepo structure with:

- **trails-lib**: Core domain logic, database models (Drizzle ORM + SQLite), and validation (Zod)
- **trails-cli**: Command-line interface with commands `add` and `tail`
- **trails-server**: MCP server exposing `addNote` and `listNotes` tools via stdio transport

Key architectural patterns:
- All inputs validated with Zod schemas before processing
- Custom error hierarchy (TrailsError) with retry logic for database operations
- SQLite database with migrations support
- Strict TypeScript with no `any` types
- Async/await throughout with proper error handling

The data model consists of:
- `users`: User accounts
- `agents`: AI agents associated with users
- `notes`: Context log entries with timestamps and markdown content

## Testing Approach

Tests use Vitest with separate test databases. Integration tests cover the full flow from API to database. Target is >95% coverage. Tests are located alongside source files as `*.test.ts`.

## MCP Server Development

The trails-server package implements the Model Context Protocol. When modifying:
- Update the tool schemas in `server.ts`
- Ensure stdio transport compatibility
- Test with the MCP inspector or basecamp demo scripts