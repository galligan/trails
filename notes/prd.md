# Trails MVP – Product Requirements & Technical Spec

## Purpose

A tiny, opinionated context-log service that agents and users can call to append or fetch notes for updates, recaps, hand-offs,  etc.  For now, we keep the surface narrow on purpose—nothing more than:

- who (user / agent)
- when (timestamp)
- what (free-form Markdown note)

Everything else (projects, tasks, teams, sub-teams, labels) is either implicit (folder structure, repo URL) or deferred to future feature implementation.

## Scope (MVP)

- Included
  - trails-lib (Drizzle ORM models & helpers)	
  - trails-server (TypeScript MCP server, stdio only)
  - trails-cli (global CLI via pnpm exec)
  - storage with SQLite (file next to repo)
  - REST API (CRUD)
  - Basic playground (Basecamp)
- Deferred
  - HTTP/SSE transport
  - OAuth, hosted SaaS
  - Vector search, embeddings
  - Teams
  - Workspace UI Dashboard

## Project Workspace (pnpm mono-repo)

```txt
trails/
├── packages/
│   ├── trails-lib/          # DB + domain
│   ├── trails-server/       # MCP wrapper
│   └── trails-cli/          # bin/trails
├── basecamp/                # example repo & scripts
└── pnpm-workspace.yaml

pnpm-workspace.yaml

dirs:
  - "packages/*"
  - "basecamp"
```

## Data Model (Drizzle, SQLite)

```typescript
// packages/trails-lib/src/schema.ts
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),        // UUID
  name: text('name'),                // display name
  createdAt: integer('created_at')   // unix millis
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),        // UUID or slug
  userId: text('user_id').references(() => users.id),
  label: text('label'),              // e.g. "cursor-gpt-4o"
  createdAt: integer('created_at')
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').references(() => agents.id),
  ts: integer('ts'),                 // unix millis
  md: text('md')                     // Markdown body
});
```

Why Users & Agents up-front?

- future-proof for team ACLs; minimal perf cost (<3 joins)

Migration helper lives in trails-lib/src/migrate.ts and is reused by server & CLI.

## Library API (trails-lib)

```typescript
export interface NoteInput { agentId: string; md: string; ts?: number }
export async function addNote(db, input: NoteInput): Promise<string>
export async function listNotes(db, { after, limit }): Promise<Note[]>
```

Both trails-cli and trails-server import these.

## CLI (trails) – UX Sketch

Command	Example	Effect

```typescript
trails add "Finished parser refactor"	uses $TRAILS_AGENT_ID env	Inserts row
trails tail -n 5	reads last 5 notes	Prints Markdown, newest→oldest
```

Global install: pnpm dlx trails add ...

## MCP Server (mcp-trails)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { addNoteTool, listNotesResource } from './tools/index.js';

const server = new McpServer({ name: 'trails', version: '0.1.0' });
server.tool(addNoteTool);
server.resource(listNotesResource);
await server.connect(new StdioServerTransport());
```

Both tools wrap calls to trails-lib.

MCP Tool definitions (concise)
- `addNote – params { md: string, agentId?: string, ts?: number }`
- `listNotes – params { after?: number, limit?: number }`

No auth beyond environment isolation in MVP (future: token header).

## Setup & Dev Flow

```bash
# clone & bootstrap
pnpm install

# create Basecamp demo DB & run tests
pnpm --filter trails-lib test

# start MCP server (stdio)
pnpm --filter trails-server start

# example: agent writes a note
echo '{"tool":"addNote","parameters":{"md":"Initial check-in"}}' | mcp-trails
```

## Next-Step TODOs (post-MVP)

1. HTTP/SSE transport + token auth
2. Project/task foreign keys → notes
3. Team / sub-team tables + ACL enforcement
4. Embeddings for semantic fetch
5. Minimal web viewer (Basecamp overlay)