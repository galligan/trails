import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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