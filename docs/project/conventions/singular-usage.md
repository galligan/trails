# Fieldbook vs Fieldbooks: Singular Usage Guidelines

## Overview

While the project name is "Fieldbooks" (plural), there are many contexts where "fieldbook" (singular) is more appropriate. This document outlines where to use each form.

## Use "Fieldbook" (Singular) For:

### 1. Database References
- **Database filename**: `fieldbook.sqlite` (not `fieldbooks.sqlite`)
  - Rationale: Each database file represents a single fieldbook instance
- **Connection strings**: "Connecting to fieldbook database..."
- **Initialization**: "Initializing fieldbook..."

### 2. Instance-Specific Operations
When referring to operations on a specific fieldbook instance:
- "Add a new entry to the fieldbook"
- "List entries from the fieldbook"
- "Query the fieldbook for recent updates"
- "Successfully saved to fieldbook"

### 3. User-Facing Messages
#### Success Messages
- "Entry added to fieldbook"
- "Fieldbook initialized successfully"
- "Connected to fieldbook"

#### Error Messages
- "Error: Cannot connect to fieldbook database"
- "Error: Failed to initialize fieldbook"
- "Error: Invalid fieldbook configuration"

#### Example Content
- "Hello Fieldbook!" (writing TO the fieldbook)
- "Recording in fieldbook: [content]"

### 4. Conceptual References
When explaining what a fieldbook is:
- "A fieldbook contains entries from various authors"
- "Each fieldbook stores field recordings with timestamps"
- "The fieldbook tracks updates, decisions, errors, and more"
- "Your fieldbook is a chronological record of field observations"

### 5. Type/Class Names (Future)
If we add types or classes representing a single instance:
```typescript
interface Fieldbook {
  id: string;
  name: string;
  createdAt: Date;
}

class FieldbookDatabase {
  // Methods for a single fieldbook
}

type FieldbookConfig = {
  dbPath: string;
  defaultAuthor?: string;
}

interface FieldbookEntry {
  // Single entry in a fieldbook
}
```

### 6. Documentation
When describing the concept:
- "A fieldbook is a chronological log of field recordings"
- "Each author writes to their fieldbook"
- "The fieldbook maintains a history of all entries"

## Keep "Fieldbooks" (Plural) For:

### 1. Project Identity
- Project name: **Fieldbooks**
- Repository name: `fieldbooks`
- Package scope: `@fieldbooks/*` (if scoped)

### 2. Package Names
- `fieldbooks-lib` - Core library
- `fieldbooks-cli` - Command line interface
- `fieldbooks-mcp` - MCP server
- `fieldbooks-api` - Future HTTP API package

### 3. CLI Command
- Command: `fieldbooks`
- Usage: `fieldbooks add "my entry"`
- Help: `fieldbooks --help`

### 4. Service Descriptions
- "Fieldbooks field recording service"
- "Fieldbooks - A tiny, opinionated field recording service"
- "CLI for Fieldbooks field recording service"

### 5. Marketing/Product Language
- "Welcome to Fieldbooks"
- "Fieldbooks helps you track field observations"
- "Get started with Fieldbooks"

## Implementation Checklist

### High Priority Changes
- [ ] Rename `fieldbooks.sqlite` → `fieldbook.sqlite` throughout codebase
- [ ] Update MCP tool descriptions:
  - [ ] "Add a new entry to the fieldbook"
  - [ ] "List entries from the fieldbook"
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
$ fieldbooks add "Starting new experiment"

# Response uses singular
✓ Entry added to fieldbook

# Error uses singular
✗ Error: Cannot connect to fieldbook database
```

### API Usage
```typescript
// Import uses plural
import { setupDatabase } from 'fieldbooks-lib';

// But operations reference singular
const db = await setupDatabase('./fieldbook.sqlite');
console.log('Fieldbook initialized');
```

### MCP Usage
```json
{
  "name": "addEntry",
  "description": "Add a new entry to the fieldbook",
  "inputSchema": { ... }
}
```

## Rationale

This distinction follows common patterns in software:
- **Git** (product) vs "repository" (instance)
- **WordPress** (product) vs "blog" (instance)
- **Notion** (product) vs "workspace" (instance)

The plural "Fieldbooks" represents the service/platform that manages fieldbooks, while "fieldbook" represents an individual instance that users interact with.