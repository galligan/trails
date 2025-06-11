# Logbook vs Logbooks: Singular Usage Guidelines

## Overview

While the project name is "Logbooks" (plural), there are many contexts where "logbook" (singular) is more appropriate. This document outlines where to use each form.

## Use "Logbook" (Singular) For:

### 1. Database References
- **Database filename**: `logbook.sqlite` (not `logbooks.sqlite`)
  - Rationale: Each database file represents a single logbook instance
- **Connection strings**: "Connecting to logbook database..."
- **Initialization**: "Initializing logbook..."

### 2. Instance-Specific Operations
When referring to operations on a specific logbook instance:
- "Add a new entry to the logbook"
- "List entries from the logbook"
- "Query the logbook for recent updates"
- "Successfully saved to logbook"

### 3. User-Facing Messages
#### Success Messages
- "Entry added to logbook"
- "Logbook initialized successfully"
- "Connected to logbook"

#### Error Messages
- "Error: Cannot connect to logbook database"
- "Error: Failed to initialize logbook"
- "Error: Invalid logbook configuration"

#### Example Content
- "Hello Logbook!" (writing TO the logbook)
- "Recording in logbook: [content]"

### 4. Conceptual References
When explaining what a logbook is:
- "A logbook contains entries from various authors"
- "Each logbook stores field recordings with timestamps"
- "The logbook tracks updates, decisions, errors, and more"
- "Your logbook is a chronological record of field observations"

### 5. Type/Class Names (Future)
If we add types or classes representing a single instance:
```typescript
interface Logbook {
  id: string;
  name: string;
  createdAt: Date;
}

class LogbookDatabase {
  // Methods for a single logbook
}

type LogbookConfig = {
  dbPath: string;
  defaultAuthor?: string;
}

interface LogbookEntry {
  // Single entry in a logbook
}
```

### 6. Documentation
When describing the concept:
- "A logbook is a chronological log of field recordings"
- "Each author writes to their logbook"
- "The logbook maintains a history of all entries"

## Keep "Logbooks" (Plural) For:

### 1. Project Identity
- Project name: **Logbooks**
- Repository name: `logbooks`
- Package scope: `@logbooks/*` (if scoped)

### 2. Package Names
- `logbooks-lib` - Core library
- `logbooks-cli` - Command line interface
- `logbooks-mcp` - MCP server
- `logbooks-api` - Future HTTP API package

### 3. CLI Command
- Command: `logbooks`
- Usage: `logbooks add "my entry"`
- Help: `logbooks --help`

### 4. Service Descriptions
- "Logbooks field recording service"
- "Logbooks - A tiny, opinionated field recording service"
- "CLI for Logbooks field recording service"

### 5. Marketing/Product Language
- "Welcome to Logbooks"
- "Logbooks helps you track field observations"
- "Get started with Logbooks"

## Implementation Checklist

### High Priority Changes
- [ ] Rename `logbooks.sqlite` → `logbook.sqlite` throughout codebase
- [ ] Update MCP tool descriptions:
  - [ ] "Add a new entry to the logbook"
  - [ ] "List entries from the logbook"
- [ ] Update success/error messages to use singular form

### Medium Priority Changes
- [ ] Update example content in documentation
- [ ] Review and update inline comments
- [ ] Update test descriptions where appropriate

### Low Priority Changes
- [ ] Consider future type names when adding new interfaces
- [ ] Update conceptual documentation as it's written

## Examples in Context

### CLI Usage
```bash
# Command uses plural
$ logbooks add "Starting new experiment"

# Response uses singular
✓ Entry added to logbook

# Error uses singular
✗ Error: Cannot connect to logbook database
```

### API Usage
```typescript
// Import uses plural
import { setupDatabase } from 'logbooks-lib';

// But operations reference singular
const db = await setupDatabase('./logbook.sqlite');
console.log('Logbook initialized');
```

### MCP Usage
```json
{
  "name": "addEntry",
  "description": "Add a new entry to the logbook",
  "inputSchema": { ... }
}
```

## Rationale

This distinction follows common patterns in software:
- **Git** (product) vs "repository" (instance)
- **WordPress** (product) vs "blog" (instance)
- **Notion** (product) vs "workspace" (instance)

The plural "Logbooks" represents the service/platform that manages logbooks, while "logbook" represents an individual instance that users interact with.