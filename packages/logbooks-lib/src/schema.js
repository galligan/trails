import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
/**
 * Authors table schema
 *
 * Stores authors (users, agents, or services) that create entries.
 */
export const authors = sqliteTable('authors', {
    /** Unique identifier for the author (UUID) */
    id: text('id').primaryKey().notNull(),
    /** Type of author: 'user', 'agent', or 'service' */
    type: text('type', { enum: ['user', 'agent', 'service'] }).notNull(),
    /** Display name for the author */
    name: text('name'),
    /** Model name for AI agents (e.g., 'claude-3-opus', 'gpt-4') */
    model: text('model'),
    /** Tool name for AI agents (e.g., 'claude-code', 'cursor', 'codex') */
    tool: text('tool'),
    /** Service type for services (e.g., 'ci', 'webhook', 'cron') */
    serviceType: text('service_type'),
    /** Timestamp when the author was created (Unix milliseconds) */
    createdAt: integer('created_at').notNull(),
}, (table) => ({
    /** Index on type for efficient filtering by author type */
    typeIdx: index('authors_type_idx').on(table.type),
    /** Index on createdAt for efficient sorting by creation date */
    createdAtIdx: index('authors_created_at_idx').on(table.createdAt),
    /** Index on tool for efficient lookups by tool */
    toolIdx: index('authors_tool_idx').on(table.tool),
    /** Index on model for efficient lookups by model */
    modelIdx: index('authors_model_idx').on(table.model),
}));
/**
 * Entries table schema
 *
 * Stores the field recording entries created by authors.
 * Each entry contains markdown content and is associated with a specific author,
 * timestamp, and type.
 */
export const entries = sqliteTable('entries', {
    /** Unique identifier for the entry (UUID) */
    id: text('id').primaryKey().notNull(),
    /** Foreign key reference to the author that created this entry */
    authorId: text('author_id')
        .references(() => authors.id)
        .notNull(),
    /** Type of entry (e.g., 'update', 'decision', 'error', 'handoff', 'observation', 'task', 'checkpoint') */
    type: text('type', {
        enum: ['update', 'decision', 'error', 'handoff', 'observation', 'task', 'checkpoint'],
    })
        .notNull()
        .default('update'),
    /** Timestamp when the entry was created (Unix milliseconds) */
    ts: integer('timestamp').notNull(),
    /** The markdown content of the entry */
    md: text('content').notNull(),
}, (table) => ({
    /** Index on authorId for efficient queries by author */
    authorIdIdx: index('entries_author_id_idx').on(table.authorId),
    /** Index on ts for efficient sorting and time-based queries */
    tsIdx: index('entries_timestamp_idx').on(table.ts),
    /** Index on type for efficient filtering by entry type */
    typeIdx: index('entries_type_idx').on(table.type),
    /** Composite index for efficient queries by author and timestamp */
    authorIdTsIdx: index('entries_author_id_timestamp_idx').on(table.authorId, table.ts),
    /** Composite index for efficient queries by type and timestamp */
    typeTsIdx: index('entries_type_timestamp_idx').on(table.type, table.ts),
}));
