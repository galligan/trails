import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function runMigrations(dbPath = './trails.sqlite') {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);
    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');
    // Run migrations
    const migrationsFolder = join(__dirname, '..', 'drizzle');
    migrate(db, { migrationsFolder });
    sqlite.close();
}
//# sourceMappingURL=migrate.js.map