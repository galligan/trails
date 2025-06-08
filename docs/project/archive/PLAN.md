# Trails MVP - Complete Implementation Plan

## 1.0 Bootstrap Monorepo Structure

- **Priority:** High (Foundational)
- **Subtasks:**
  - [1.1 Set up pnpm workspace](#11-set-up-pnpm-workspace)
  - [1.2 Initialize package structure](#12-initialize-package-structure)
  - [1.3 Configure TypeScript and tooling](#13-configure-typescript-and-tooling)
  - [1.4 Set up testing framework](#14-set-up-testing-framework)
  - [1.5 Configure CI/CD pipeline](#15-configure-cicd-pipeline)
- **Depends on:** None
- **Description:**

Create the project foundation by setting up a pnpm monorepo structure with proper TypeScript configuration, linting rules, and build pipeline. This establishes the development environment for all subsequent tasks.

### 1.1 Set up pnpm workspace

Create the workspace configuration to manage the multi-package repo structure:

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
  - "basecamp"
```

### 1.2 Initialize package structure

Create the folder structure for all packages:

```bash
mkdir -p packages/trails-lib/src
mkdir -p packages/trails-server/src
mkdir -p packages/trails-cli/src
mkdir -p basecamp
```

### 1.3 Configure TypeScript and tooling

Set up TypeScript, ESLint, and Prettier for consistent code quality:

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 1.4 Set up testing framework

Configure Vitest for unit and integration testing:

```json
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### 1.5 Configure CI/CD pipeline

Set up GitHub Actions for continuous integration:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
```

## 2.0 Implement Data Model with Drizzle

- **Priority:** High (Foundational)
- **Subtasks:**
  - [2.1 Define schema models](#21-define-schema-models)
  - [2.2 Create migration utilities](#22-create-migration-utilities)
  - [2.3 Implement database helpers](#23-implement-database-helpers)
  - [2.4 Create CRUD operations](#24-create-crud-operations)
  - [2.5 Write schema tests](#25-write-schema-tests)
- **Depends on:** [1.0 Bootstrap Monorepo Structure](#10-bootstrap-monorepo-structure)
- **Description:**

Implement the core data model using Drizzle ORM for SQLite. Define the schema for users, agents, and notes tables with proper relationships, and create utilities for database migrations and operations.

### 2.1 Define schema models

Create the schema definitions as specified in the requirements:

```typescript
// packages/trails-lib/src/schema.ts
import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),        // UUID
  name: text('name'),                 // display name
  createdAt: integer('created_at')    // unix millis
});

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),        // UUID or slug
  userId: text('user_id').references(() => users.id),
  label: text('label'),               // e.g. "cursor-gpt-4o"
  createdAt: integer('created_at')
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').references(() => agents.id),
  ts: integer('ts'),                  // unix millis
  md: text('md')                      // Markdown body
});
```

### 2.2 Create migration utilities

Implement migration helpers for database setup:

```typescript
// packages/trails-lib/src/migrate.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';

export async function setupDatabase(dbPath: string): Promise<typeof schema> {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });
  
  await migrate(db, { migrationsFolder: './migrations' });
  
  return db;
}
```

### 2.3 Implement database helpers

Create utility functions for database operations:

```typescript
// packages/trails-lib/src/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

export function getDb(dbPath?: string): ReturnType<typeof drizzle> {
  const finalPath = dbPath || process.env.TRAILS_DB_PATH || './trails.sqlite';
  
  // Ensure directory exists
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const sqlite = new Database(finalPath);
  return drizzle(sqlite, { schema });
}
```

### 2.4 Create CRUD operations

Implement basic CRUD operations for each entity:

```typescript
// packages/trails-lib/src/operations.ts
import { eq } from 'drizzle-orm';
import { users, agents, notes } from './schema';
import { v4 as uuidv4 } from 'uuid';

export async function createUser(db, name: string) {
  const id = uuidv4();
  await db.insert(users).values({
    id,
    name,
    createdAt: Date.now()
  });
  return id;
}

export async function createAgent(db, userId: string, label: string) {
  const id = uuidv4();
  await db.insert(agents).values({
    id,
    userId,
    label,
    createdAt: Date.now()
  });
  return id;
}

// Additional CRUD operations...
```

### 2.5 Write schema tests

Create comprehensive tests for the data model:

```typescript
// packages/trails-lib/test/schema.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from '../src/db';
import { setupDatabase } from '../src/migrate';
import * as ops from '../src/operations';
import fs from 'fs';

describe('Trails Schema', () => {
  const TEST_DB = './test.sqlite';
  let db;
  
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    db = await setupDatabase(TEST_DB);
  });
  
  afterEach(() => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });
  
  it('should create and retrieve a user', async () => {
    const userId = await ops.createUser(db, 'Test User');
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    expect(user).toBeDefined();
    expect(user.name).toBe('Test User');
  });
  
  // Additional tests...
});
```

## 3.0 Develop Core API Layer in trails-lib

- **Priority:** High (Foundational)
- **Subtasks:**
  - [3.1 Implement addNote function](#31-implement-addnote-function)
  - [3.2 Create listNotes function](#32-create-listnotes-function)
  - [3.3 Add error handling](#33-add-error-handling)
  - [3.4 Write API tests](#34-write-api-tests)
  - [3.5 Create public exports](#35-create-public-exports)
- **Depends on:** [2.0 Implement Data Model with Drizzle](#20-implement-data-model-with-drizzle)
- **Description:**

Develop the core API layer for trails-lib that provides the main functionality for adding and retrieving notes. This creates the foundation that both the CLI and MCP server will build upon.

### 3.1 Implement addNote function

Create the primary function for adding notes:

```typescript
// packages/trails-lib/src/api.ts
import { notes } from './schema';
import { v4 as uuidv4 } from 'uuid';

export interface NoteInput {
  agentId: string;
  md: string;
  ts?: number;
}

export async function addNote(db, input: NoteInput): Promise<string> {
  const id = uuidv4();
  const timestamp = input.ts || Date.now();
  
  await db.insert(notes).values({
    id,
    agentId: input.agentId,
    ts: timestamp,
    md: input.md
  });
  
  return id;
}
```

### 3.2 Create listNotes function

Implement the function to retrieve notes with pagination:

```typescript
// packages/trails-lib/src/api.ts (continued)
import { desc, eq, gt, lt } from 'drizzle-orm';

export interface ListOptions {
  agentId?: string;
  after?: number;
  before?: number;
  limit?: number;
}

export interface Note {
  id: string;
  agentId: string;
  ts: number;
  md: string;
}

export async function listNotes(
  db, 
  options: ListOptions = {}
): Promise<Note[]> {
  const { agentId, after, before, limit = 20 } = options;
  
  let query = db.select().from(notes);
  
  if (agentId) {
    query = query.where(eq(notes.agentId, agentId));
  }
  
  if (after) {
    query = query.where(gt(notes.ts, after));
  }
  
  if (before) {
    query = query.where(lt(notes.ts, before));
  }
  
  return query.orderBy(desc(notes.ts)).limit(limit);
}
```

### 3.3 Add error handling

Implement consistent error handling:

```typescript
// packages/trails-lib/src/errors.ts
export class TrailsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TrailsError';
  }
}

// Update API functions with error handling
// packages/trails-lib/src/api.ts (updated)
export async function addNote(db, input: NoteInput): Promise<string> {
  try {
    const id = uuidv4();
    const timestamp = input.ts || Date.now();
    
    await db.insert(notes).values({
      id,
      agentId: input.agentId,
      ts: timestamp,
      md: input.md
    });
    
    return id;
  } catch (err) {
    throw new TrailsError('Failed to add note', err);
  }
}
```

### 3.4 Write API tests

Create comprehensive tests for the API:

```typescript
// packages/trails-lib/test/api.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from '../src/db';
import { setupDatabase } from '../src/migrate';
import { addNote, listNotes } from '../src/api';
import fs from 'fs';

describe('Trails API', () => {
  const TEST_DB = './test-api.sqlite';
  let db;
  
  beforeEach(async () => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
    db = await setupDatabase(TEST_DB);
    
    // Set up test data - create a test agent
    await db.insert(users).values({
      id: 'test-user',
      name: 'Test User',
      createdAt: Date.now()
    });
    
    await db.insert(agents).values({
      id: 'test-agent',
      userId: 'test-user',
      label: 'Test Agent',
      createdAt: Date.now()
    });
  });
  
  afterEach(() => {
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });
  
  it('should add a note and retrieve it', async () => {
    const noteId = await addNote(db, {
      agentId: 'test-agent',
      md: 'Test note content'
    });
    
    const retrievedNotes = await listNotes(db, {
      agentId: 'test-agent'
    });
    
    expect(retrievedNotes).toHaveLength(1);
    expect(retrievedNotes[0].id).toBe(noteId);
    expect(retrievedNotes[0].md).toBe('Test note content');
  });
  
  // Additional tests...
});
```

### 3.5 Create public exports

Set up the public API exports:

```typescript
// packages/trails-lib/src/index.ts
export * from './schema';
export * from './migrate';
export * from './db';
export * from './api';
export * from './errors';
```

## 4.0 Build Validation Layer with Zod

- **Priority:** High
- **Subtasks:**
  - [4.1 Create validation schema](#41-create-validation-schema)
  - [4.2 Implement validator functions](#42-implement-validator-functions)
  - [4.3 Define custom error types](#43-define-custom-error-types)
  - [4.4 Integrate with API functions](#44-integrate-with-api-functions)
  - [4.5 Write validation tests](#45-write-validation-tests)
- **Depends on:** [3.0 Develop Core API Layer in trails-lib](#30-develop-core-api-layer-in-trails-lib)
- **Description:**

Build a comprehensive validation layer using Zod to ensure data integrity and provide clear error messages for note inputs and other data structures.

### 4.1 Create validation schema

Define validation schemas for all input types:

```typescript
// packages/trails-lib/src/validation.ts
import { z } from 'zod';

export const NoteSchema = z.object({
  agentId: z.string().uuid(),
  md: z.string().min(1).max(10000),  // Reasonable size limit
  ts: z.number().optional().default(() => Date.now())
});

export type ValidatedNoteInput = z.infer<typeof NoteSchema>;

export const ListOptionsSchema = z.object({
  agentId: z.string().optional(),
  after: z.number().optional(),
  before: z.number().optional(),
  limit: z.number().int().positive().optional().default(20)
});

export type ValidatedListOptions = z.infer<typeof ListOptionsSchema>;
```

### 4.2 Implement validator functions

Create validator functions that apply the schemas:

```typescript
// packages/trails-lib/src/validation.ts (continued)
export function validateNote(input: unknown): ValidatedNoteInput {
  return NoteSchema.parse(input);
}

export function validateListOptions(input: unknown): ValidatedListOptions {
  return ListOptionsSchema.parse(input);
}
```

### 4.3 Define custom error types

Create specialized error types for validation:

```typescript
// packages/trails-lib/src/errors.ts (updated)
import { ZodError } from 'zod';

export class TrailsError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TrailsError';
  }
}

export class TrailsValidationError extends TrailsError {
  constructor(message: string, public errors: Record<string, any>) {
    super(message);
    this.name = 'TrailsValidationError';
  }
  
  static fromZodError(err: ZodError): TrailsValidationError {
    return new TrailsValidationError(
      'Validation failed',
      err.format()
    );
  }
}
```

### 4.4 Integrate with API functions

Update API functions to use validation:

```typescript
// packages/trails-lib/src/api.ts (updated)
import { validateNote, validateListOptions } from './validation';
import { TrailsValidationError } from './errors';
import { z } from 'zod';

export async function addNote(db, input: NoteInput): Promise<string> {
  try {
    const validatedInput = validateNote(input);
    
    const id = uuidv4();
    await db.insert(notes).values({
      id,
      agentId: validatedInput.agentId,
      ts: validatedInput.ts,
      md: validatedInput.md
    });
    
    return id;
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw TrailsValidationError.fromZodError(err);
    }
    throw new TrailsError('Failed to add note', err);
  }
}

export async function listNotes(
  db, 
  options: ListOptions = {}
): Promise<Note[]> {
  try {
    const validatedOptions = validateListOptions(options);
    
    // Use validated options for query
    // ...existing implementation
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw TrailsValidationError.fromZodError(err);
    }
    throw new TrailsError('Failed to list notes', err);
  }
}
```

### 4.5 Write validation tests

Test the validation layer:

```typescript
// packages/trails-lib/test/validation.test.ts
import { describe, it, expect } from 'vitest';
import { validateNote, validateListOptions } from '../src/validation';
import { TrailsValidationError } from '../src/errors';
import { z } from 'zod';

describe('Validation', () => {
  describe('validateNote', () => {
    it('should validate a valid note input', () => {
      const input = {
        agentId: '123e4567-e89b-12d3-a456-426614174000',
        md: 'Valid note content'
      };
      
      const result = validateNote(input);
      expect(result).toEqual({
        ...input,
        ts: expect.any(Number)
      });
    });
    
    it('should throw on invalid note input', () => {
      const input = {
        agentId: 'not-a-uuid',
        md: ''
      };
      
      expect(() => validateNote(input)).toThrow(z.ZodError);
    });
  });
  
  // Additional tests...
});
```

## Dependency Graph

```
1.0 Bootstrap Monorepo Structure
    ↓
2.0 Implement Data Model with Drizzle
    ↓
3.0 Develop Core API Layer in trails-lib
    ↓
    ├─────────┬────────────┬──────────┐
    ↓         ↓            ↓          ↓
4.0 Build    5.0 Create   6.0 Develop 7.0 Build MCP 
   Validation   Config       CLI        Server
    ↓         ↓            ↓          ↓
    │         │            ├──────────┼──────────┐
    │         │            ↓          ↓          │
    │         │      9.0 Implement  8.0 Add JSON │
    │         │         Query       Schema       │
    │         │            │          │          │
    │         └────────────┼──────────┘          │
    │                      │                     │
    │                      ├─────────────────────┘
    │                      │
    │              10.0 Create Backup/Restore
    │                      ↓
    └───────────────→ 11.0 Add Edit Functionality
                            ↓
                     12.0 Build Basecamp Playground
                            ↓
                     13.0 Write Integration Tests
                            ↓
                     14.0 Create Documentation
                            ↓
                     15.0 Configure Publishing
```

## Implementation Guidelines

### Error Handling Strategy

- **Error hierarchy:**
  ```typescript
  class TrailsError extends Error {
    constructor(message: string, public cause?: unknown) {
      super(message);
      this.name = 'TrailsError';
    }
  }
  
  class TrailsValidationError extends TrailsError {
    constructor(message: string, public errors: Record<string, any>) {
      super(message);
      this.name = 'TrailsValidationError';
    }
  }
  
  class TrailsConfigError extends TrailsError {
    constructor(message: string, public configPath?: string) {
      super(message);
      this.name = 'TrailsConfigError';
    }
  }
  
  class TrailsDbError extends TrailsError {
    constructor(message: string, public operation: string) {
      super(message);
      this.name = 'TrailsDbError';
    }
  }
  ```

- **Error format:**
  ```typescript
  try {
    // Operation
  } catch (err) {
    throw new TrailsError('Failed to perform operation', {
      code: 'OPERATION_FAILED',
      details: { /* contextual information */ },
      cause: err
    });
  }
  ```

### Data Persistence Strategy

- **SQLite configuration:**
  ```typescript
  function getDb(dbPath?: string) {
    const finalPath = dbPath || process.env.TRAILS_DB_PATH || './trails.sqlite';
    const sqlite = new Database(finalPath);
    
    // Set pragmas for better performance
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('synchronous = NORMAL');
    
    return drizzle(sqlite, { schema });
  }
  ```

- **Backup system:**
  ```typescript
  async function backupDatabase(
    dbPath: string, 
    backupDir: string = './backups'
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `trails-backup-${timestamp}.sqlite`);
    
    // Ensure backup directory exists
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Create backup
    const db = new Database(dbPath);
    await db.backup(backupPath);
    db.close();
    
    // Verify backup integrity
    const verifyDb = new Database(backupPath, { readonly: true });
    // Run integrity check
    const integrity = verifyDb.pragma('integrity_check', { simple: true });
    verifyDb.close();
    
    if (integrity !== 'ok') {
      throw new TrailsError('Backup integrity verification failed');
    }
    
    return backupPath;
  }
  ```

### CLI UX Design Principles

- **Command structure:**
  ```typescript
  // CLI command structure using commander.js
  import { Command } from 'commander';
  
  const program = new Command()
    .name('trails')
    .description('Context logging for agents')
    .version('0.1.0');
  
  program
    .command('add')
    .description('Add a new note')
    .argument('<note>', 'Note content in Markdown')
    .option('-a, --agent <id>', 'Agent ID', process.env.TRAILS_AGENT_ID)
    .action(async (note, options) => {
      // Implementation
    });
  
  program
    .command('tail')
    .description('Show recent notes')
    .option('-n, --count <number>', 'Number of notes to show', '5')
    .option('-a, --agent <id>', 'Filter by agent ID')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      // Implementation with formatted or JSON output
    });
  ```

### Configuration Management

- **Configuration schema:**
  ```typescript
  const ConfigSchema = z.object({
    dbPath: z.string().optional(),
    backupDir: z.string().optional(),
    defaultAgentId: z.string().optional(),
    listLimit: z.number().int().positive().optional().default(20)
  });
  
  type TrailsConfig = z.infer<typeof ConfigSchema>;
  ```

- **Configuration loading:**
  ```typescript
  function loadConfig(): TrailsConfig {
    // 1. Default values
    const defaultConfig: TrailsConfig = {
      dbPath: './trails.sqlite',
      backupDir: './backups',
      listLimit: 20
    };
    
    // 2. Load from global config
    let globalConfig = {};
    const globalPath = path.join(os.homedir(), '.trailsrc.json');
    if (fs.existsSync(globalPath)) {
      try {
        globalConfig = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
      } catch (err) {
        // Log warning but continue
      }
    }
    
    // 3. Load from project config
    let projectConfig = {};
    const projectPath = path.join(process.cwd(), '.trailsrc.json');
    if (fs.existsSync(projectPath)) {
      try {
        projectConfig = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
      } catch (err) {
        // Log warning but continue
      }
    }
    
    // 4. Environment variables
    const envConfig: Partial<TrailsConfig> = {
      dbPath: process.env.TRAILS_DB_PATH,
      backupDir: process.env.TRAILS_BACKUP_DIR,
      defaultAgentId: process.env.TRAILS_AGENT_ID,
      listLimit: process.env.TRAILS_LIST_LIMIT 
        ? parseInt(process.env.TRAILS_LIST_LIMIT, 10) 
        : undefined
    };
    
    // Merge with correct precedence
    const config = {
      ...defaultConfig,
      ...globalConfig,
      ...projectConfig,
      ...Object.fromEntries(
        Object.entries(envConfig).filter(([_, v]) => v !== undefined)
      )
    };
    
    // Validate configuration
    return ConfigSchema.parse(config);
  }
  ```

### Testing Approach

- **Unit test structure:**
  ```typescript
  // Example test for API functions
  describe('addNote', () => {
    it('should add a note with defaults', async () => {
      // Setup
      const db = getMockDb();
      const input = {
        agentId: 'test-agent',
        md: 'Test note'
      };
      
      // Execute
      const noteId = await addNote(db, input);
      
      // Verify
      expect(noteId).toBeTruthy();
      expect(db.insert).toHaveBeenCalledWith(
        notes,
        expect.objectContaining({
          agentId: 'test-agent',
          md: 'Test note',
          ts: expect.any(Number)
        })
      );
    });
    
    it('should handle validation errors', async () => {
      // Test validation scenarios
    });
    
    it('should handle database errors', async () => {
      // Test error handling
    });
  });
  ```