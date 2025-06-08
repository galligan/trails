import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().notNull(), // UUID
    name: text('name'), // display name (nullable)
    createdAt: integer('created_at').notNull(), // unix millis
  },
  (table) => ({
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

export const agents = sqliteTable(
  'agents',
  {
    id: text('id').primaryKey().notNull(), // UUID or slug
    userId: text('user_id')
      .references(() => users.id)
      .notNull(),
    label: text('label'), // e.g. "cursor-gpt-4o" (nullable)
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    userIdIdx: index('agents_user_id_idx').on(table.userId),
    createdAtIdx: index('agents_created_at_idx').on(table.createdAt),
    labelIdx: index('agents_label_idx').on(table.label),
  }),
);

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').primaryKey().notNull(),
    agentId: text('agent_id')
      .references(() => agents.id)
      .notNull(),
    ts: integer('ts').notNull(), // unix millis
    md: text('md').notNull(), // Markdown body
  },
  (table) => ({
    agentIdIdx: index('notes_agent_id_idx').on(table.agentId),
    tsIdx: index('notes_ts_idx').on(table.ts),
    agentIdTsIdx: index('notes_agent_id_ts_idx').on(table.agentId, table.ts), // Composite index for efficient querying by agent and timestamp
  }),
);
