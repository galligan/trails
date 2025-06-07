# Trails v0.0.1

A tiny, opinionated context-log service that agents and users can call to append or fetch notes for updates, recaps, hand-offs, etc.

## Project Structure

```
trails/
├── packages/
│   ├── trails-lib/          # Core library with DB + domain logic
│   ├── trails-server/       # MCP server wrapper
│   └── trails-cli/          # Command line interface
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
TRAILS_AGENT_ID=my-agent node packages/trails-cli/dist/index.js add "Hello Trails!"
node packages/trails-cli/dist/index.js tail -n 5

# Test MCP server
node packages/trails-server/dist/index.js
```

## Core API

### trails-lib

```typescript
export interface NoteInput { 
  agentId: string; 
  md: string; 
  ts?: number 
}

export async function addNote(db, input: NoteInput): Promise<string>
export async function listNotes(db, options: ListOptions): Promise<Note[]>
```

### CLI Usage

```bash
# Add a note
trails add "Completed feature X" --agent-id my-agent

# List recent notes
trails tail -n 10
trails tail --agent-id my-agent
```

### MCP Server

The MCP server provides two tools:
- `addNote` - Add a new note
- `listNotes` - List existing notes

## Database Schema

- **users** - User accounts
- **agents** - AI agents associated with users  
- **notes** - Context log entries with markdown content

## Features

- ✅ SQLite storage with Drizzle ORM
- ✅ TypeScript throughout
- ✅ Input validation with Zod
- ✅ CLI with Commander.js
- ✅ MCP server for agent integration
- ✅ Workspace monorepo with pnpm
- ✅ Comprehensive error handling
- ✅ Demo environment

## Environment Variables

- `TRAILS_AGENT_ID` - Default agent ID for CLI operations

## Development

```bash
# Watch mode for development
pnpm dev

# Clean build artifacts
pnpm clean

# Run specific package tests
pnpm --filter trails-lib test
```