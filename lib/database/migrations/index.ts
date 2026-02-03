import { SQLiteDatabase } from 'expo-sqlite';
import * as migration001 from './001_initial';
import * as migration002 from './002_fasting';
import * as migration003 from './003_workouts';

export interface Migration {
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [migration001, migration002, migration003];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Check if migrations table exists
  const result = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
  );

  if (!result) {
    // Create migrations tracking table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
  }

  // Get already applied migrations
  const appliedVersions = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version'
  );
  const appliedSet = new Set(appliedVersions.map((m) => m.version));

  // Run pending migrations
  for (let i = 0; i < migrations.length; i++) {
    if (!appliedSet.has(i + 1)) {
      console.log(`Running migration ${i + 1}...`);
      await migrations[i].up(db);
      await db.runAsync(
        'INSERT INTO _migrations (version, applied_at) VALUES (?, ?)',
        [i + 1, new Date().toISOString()]
      );
      console.log(`Migration ${i + 1} completed`);
    }
  }
}
