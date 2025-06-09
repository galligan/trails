# Fieldbooks v0.0.1

A tiny, opinionated field recording service that authors (users, agents, or services) can call to append or fetch entries for updates, recaps, hand-offs, etc.

## Project Structure

```
fieldbooks/
├── packages/
│   ├── fieldbooks-lib/      # Core library with DB + domain logic
│   ├── fieldbooks-mcp/      # MCP server wrapper
│   └── fieldbooks-cli/      # Command line interface
├── basecamp/                # Example repo & demo scripts
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
FIELDBOOKS_AUTHOR_ID=my-author node packages/fieldbooks-cli/dist/index.js add "Hello Fieldbooks!"
node packages/fieldbooks-cli/dist/index.js list -n 5

# Test MCP server
node packages/fieldbooks-mcp/dist/index.js
```

## Core API

### fieldbooks-lib

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
fieldbooks add "Completed feature X" --author-id my-author --type update

# List recent entries
fieldbooks list -n 10
fieldbooks list --author-id my-author --type decision
fieldbooks list --sort timestamp --order asc
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

- `FIELDBOOKS_AUTHOR_ID` - Default author ID for CLI operations
- `FIELDBOOKS_DB` - Path to SQLite database file

## Development

```bash
# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean

# Run specific package tests
pnpm --filter fieldbooks-lib test
```