# 01: Foundational Architecture

**Status**: Proposed  
**Author**: Max (AI) & Matt Galligan  
**Date**: 2024-07-29

## 1. Overview

This document specifies the foundational architecture for Fieldbooks, focusing on a robust directory structure and a layered configuration system. The goal is to establish a predictable, reliable, and extensible foundation for all future development.

This plan supersedes and replaces the following documents:

- `current-state-vs-planned.md`
- `fieldbook-directory-structure.md`
- `fieldbook-configuration-system.md`
- `fieldbooks-v0.md`

## 2. Core Principles

- **Standard Compliance**: Adhere to the XDG Base Directory Specification for locating global configuration files.
- **Predictability**: Employ a clear and documented configuration hierarchy.
- **Robustness**: "Parse, don't validate." All configurations will be validated against a strict schema upon loading to prevent illegal states.
- **Developer Experience**: Leverage battle-tested libraries to handle common problems like path searching and configuration loading.
- **Explicitness**: No magic. All paths and configurations should be discoverable and auditable.

## 3. Directory Structure

Fieldbooks will support two primary locations for its data and configuration.

### Project-Specific (Primary)

Used when `fieldbooks` is run within a project directory. The system will search from the current working directory upwards to locate the `.fieldbook` directory.

```
<project-root>/
└── .fieldbook/
    ├── fieldbook.sqlite       # Main database (gitignored)
    ├── config.json            # Project-specific config (committed)
    ├── config.local.json      # Local overrides (gitignored)
    ├── backups/               # Database backups (gitignored)
    │   └── .gitkeep
    └── exports/               # Data exports (gitignored)
        └── .gitkeep
```

### Global (User-Level)

Used when the `--global` flag is specified or when not operating within a project that has a `.fieldbook` directory.

```
~/.config/fieldbooks/      # Or $XDG_CONFIG_HOME/fieldbooks
├── fieldbook.sqlite       # Global database
└── config.json            # Global user preferences
```

## 4. Configuration System

### 4.1. Loading and Precedence

Configuration will be loaded using `cosmiconfig`, which automatically handles searching parent directories and merging configuration sources. The strict order of precedence is as follows, with higher numbers overriding lower ones:

1. **System Defaults** (lowest priority, hardcoded in the application)
2. **Global Config**: `~/.config/fieldbooks/config.json`
3. **Project Config**: `.fieldbook/config.json`
4. **Local Project Overrides**: `.fieldbook/config.local.json`
5. **Environment Variables** (e.g., `FIELDBOOKS_AUTHOR_DEFAULTID`)
6. **Command-line Flags** (e.g., `--author-default-id`, highest priority)

### 4.2. Schema and Validation

All loaded configuration objects will be parsed and validated using a `zod` schema. This ensures type safety throughout the application and prevents runtime errors from invalid configuration.

```typescript
import { z } from 'zod';

export const FieldbookConfigSchema = z.object({
  version: z.literal("1.0.0").default("1.0.0"),
  
  author: z.object({
    defaultId: z.string().optional(),
    defaultType: z.enum(['user', 'agent', 'service']).optional(),
    defaultName: z.string().optional(),
    model: z.string().optional(),
    tool: z.string().optional(),
    serviceType: z.string().optional(),
  }).optional(),
  
  database: z.object({
    path: z.string().optional(),
    backup: z.object({
      enabled: z.boolean().default(false),
      interval: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
      retention: z.number().int().positive().optional(),
      location: z.string().default('./backups/'),
    }).optional(),
  }).optional(),

  cli: z.object({
    defaultCommand: z.enum(['list', 'add']).default('list'),
    listLimit: z.number().int().positive().default(20),
    richOutput: z.boolean().default(true),
    timestampFormat: z.enum(['iso', 'relative', 'local']).default('relative'),
    editor: z.string().optional(),
  }).optional(),

  entries: z.object({
    defaultType: z.string().default('update'),
    metadata: z.object({
      includeGitBranch: z.boolean().default(false),
      includeHostname: z.boolean().default(false),
      includeWorkingDirectory: z.boolean().default(false),
    }).optional(),
  }).optional(),

  hooks: z.object({
    preAdd: z.string().optional(),
    postAdd: z.string().optional(),
    preCommit: z.string().optional(),
  }).optional(),

  export: z.object({
    auto: z.object({
      onCommit: z.boolean().default(false),
      format: z.enum(['markdown', 'json', 'csv']).default('markdown'),
      location: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type FieldbookConfig = z.infer<typeof FieldbookConfigSchema>;
```

### 4.3. Environment Variable Mapping

Environment variables will map to config settings using a `FIELDBOOKS_` prefix and `__` for nesting. Example: `FIELDBOOKS_AUTHOR__DEFAULT_ID` maps to `author.defaultId`. This is a common pattern supported by many config loaders.

## 5. Migration Strategy

For users with a legacy `./fieldbook.sqlite` file:

1. **Detect**: On startup, the CLI will check for the existence of `./fieldbook.sqlite` (or `fieldbooks.sqlite`).
2. **Prompt**: If found, it will explicitly inform the user and ask for permission to migrate:
    > "Found a legacy `fieldbook.sqlite` file in the current directory. To use the new organized structure, it should be moved to `.fieldbook/fieldbook.sqlite`.
    > Move the file now? (Y/n)"
3. **Act**: If confirmed, the CLI will:
    a. Create the `.fieldbook/` directory.
    b. Move the database file into it.
    c. Inform the user of the successful migration.
4. **Deny**: If denied, the CLI will proceed to use the legacy file for that session but will issue a warning on every run until it is moved.

## 6. Implementation Phases

This project will be implemented in logical, sequential phases.

### Phase 1: Core Foundation (Highest Priority)

The goal of this phase is to build the complete, non-interactive foundation.

1. **Integrate Libraries**: Add `cosmiconfig`, `zod`, and `xdg-basedir` as dependencies.
2. **Implement Config Loading**: Create a configuration loader module that uses `cosmiconfig` to find and merge configurations, and `zod` to parse and validate the result.
3. **Implement Path Resolution**: The config loader will provide the final, correct path to the `fieldbook.sqlite` file, whether global or project-local.
4. **Update Database Connection**: Refactor `setupDatabase()` to use the path provided by the new configuration system.
5. **Implement Migration Logic**: Implement the one-time, explicit migration flow described above.

### Phase 2: CLI Integration

The goal of this phase is to make the new system usable via the CLI.

1. **`init` Command**: Create `fieldbooks init` to create a new `.fieldbook` directory with a default `config.json` and `.gitignore`.
2. **`config` Command Suite**:
    - `fieldbooks config get <path>`
    - `fieldbooks config set <path> <value> [--global]`
    - `fieldbooks config view` (shows the final merged config)
    - `fieldbooks config edit [--global | --local]`
3. **Update Existing Commands**: Refactor all existing commands (`add`, `list`, etc.) to source their settings (author, entry type, etc.) from the new configuration system.

### Phase 3: Advanced Features & Polish

With the foundation in place, these features can be built reliably.

1. **Backup & Export**: Implement the automatic backup and export features driven by settings in `config.json`.
2. **Hooks**: Implement the `preAdd`, `postAdd`, and `preCommit` hooks.
3. **Documentation**: Write comprehensive user-facing documentation for the new directory structure, configuration files, and CLI commands.