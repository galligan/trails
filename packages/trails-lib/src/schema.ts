import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Users table schema
 * 
 * Stores user accounts that own agents. Each user can have multiple agents.
 */
export const users = sqliteTable(
  'users',
  {
    /** Unique identifier for the user (UUID) */
    id: text('id').primaryKey().notNull(),
    /** Display name for the user (optional) */
    name: text('name'),
    /** Timestamp when the user was created (Unix milliseconds) */
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    /** Index on createdAt for efficient sorting by creation date */
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

/**
 * Agents table schema
 * 
 * Stores AI agents or users that create notes. Each agent belongs to a user
 * and is identified by a unique ID (can be UUID or human-readable slug).
 */
export const agents = sqliteTable(
  'agents',
  {
    /** Unique identifier for the agent (UUID or slug) */
    id: text('id').primaryKey().notNull(),
    /** Foreign key reference to the user who owns this agent */
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    /** Human-readable label for the agent (e.g., "cursor-gpt-4o") */
    label: text('label'),
    /** Timestamp when the agent was created (Unix milliseconds) */
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    /** Index on userId for efficient queries by user */
    userIdIdx: index('agents_user_id_idx').on(table.userId),
    /** Index on createdAt for efficient sorting by creation date */
    createdAtIdx: index('agents_created_at_idx').on(table.createdAt),
    /** Index on label for efficient lookups by label */
    labelIdx: index('agents_label_idx').on(table.label),
  }),
);

/**
 * Notes table schema
 * 
 * Stores the actual context log entries created by agents. Each note contains
 * markdown content and is associated with a specific agent and timestamp.
 */
export const notes = sqliteTable(
  'notes',
  {
    /** Unique identifier for the note (UUID) */
    id: text('id').primaryKey().notNull(),
    /** Foreign key reference to the agent that created this note */
    agentId: text('agent_id')
      .references(() => agents.id)
      .notNull(),
    /** Timestamp when the note was created (Unix milliseconds) */
    ts: integer('ts').notNull(),
    /** The markdown content of the note */
    md: text('md').notNull(),
  },
  (table) => ({
    /** Index on agentId for efficient queries by agent */
    agentIdIdx: index('notes_agent_id_idx').on(table.agentId),
    /** Index on ts for efficient sorting and time-based queries */
    tsIdx: index('notes_ts_idx').on(table.ts),
    /** Composite index for efficient queries by agent and timestamp */
    agentIdTsIdx: index('notes_agent_id_ts_idx').on(table.agentId, table.ts),
  }),
);
