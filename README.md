# Logbooks v0.0.1

A tiny, opinionated field recording service that authors (users, agents, or services) can call to append or fetch entries for updates, recaps, hand-offs, etc.

## Project Structure

```
logbooks/
├── packages/
│   ├── logbooks-lib/       # Core library with DB + domain logic
│   ├── logbooks-mcp/       # MCP server wrapper
│   └── logbooks-cli/       # Command line interface
├── basecamp/               # Example repo & demo scripts
└── pnpm-workspace.yaml
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Set up demo environment
cd basecamp && node setup.js && node demo.js

# Test CLI
LOGBOOKS_AUTHOR_ID=my-author node packages/logbooks-cli/dist/index.js add "Hello Logbooks!"
node packages/logbooks-cli/dist/index.js list -n 5

# Test MCP server
node packages/logbooks-mcp/dist/index.js
```

## Core API

### logbooks-lib

```typescript
export interface EntryInput { 
  authorId: string; 
  md: string; 
  ts?: number;
  type?: 'update' | 'decision' | 'error' | 'handoff' | 'observation' | 'task' | 'checkpoint';
}

export async function addEntry(db, input: EntryInput): Promise<string>
export async function listEntries(db, options: ListOptions): Promise<Entry[]>
```

### CLI Usage

```bash
# Add an entry
logbook add "Completed feature X" --author-id my-author --type update

# List recent entries
logbook list -n 10
logbook list --author-id my-author --type decision
logbook list --sort timestamp --order asc
```

### MCP Server

The MCP server provides two tools:
- `addEntry` - Add a new entry with optional type
- `listEntries` - List existing entries with filtering

## Database Schema

- **authors** - Unified table for users, agents, and services
- **entries** - Field recording entries with markdown content and types

## Features

- ✅ SQLite storage with Drizzle ORM
- ✅ TypeScript throughout
- ✅ Input validation with Zod
- ✅ CLI with Commander.js and React Ink
- ✅ MCP server for agent integration
- ✅ Workspace monorepo with pnpm
- ✅ Comprehensive error handling
- ✅ Demo environment
- ✅ Entry types for categorization
- ✅ Flexible author system (users, agents, services)

## Environment Variables

- `LOGBOOKS_AUTHOR_ID` - Default author ID for CLI operations
- `LOGBOOKS_DB` - Path to SQLite database file

## Development

```bash
# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean

# Run specific package tests
pnpm --filter logbooks-lib test
```