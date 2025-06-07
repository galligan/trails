import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { users, agents, notes } from './schema.js';
export function getDb(dbPath = './trails.sqlite') {
    const sqlite = new Database(dbPath);
    return drizzle(sqlite, { schema: { users, agents, notes } });
}
export async function setupDatabase(dbPath = './trails.sqlite') {
    const db = getDb(dbPath);
    // Create tables if they don't exist
    const sqlite = new Database(dbPath);
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    // Create tables manually for MVP (simple approach)
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      label TEXT,
      created_at INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id),
      ts INTEGER,
      md TEXT
    );
  `);
    return db;
}
