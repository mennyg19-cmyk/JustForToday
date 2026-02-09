import { SQLiteDatabase } from 'expo-sqlite';
import * as migration001 from './001_initial';
import * as migration002 from './002_fasting';
import * as migration003 from './003_workouts';
import * as migration004 from './004_stoic';
import * as migration005 from './005_habit_tracking_start';
import * as migration006 from './006_daily_renewal';
import * as migration007 from './007_checkin_and_contacts';

export interface Migration {
  up: (db: SQLiteDatabase) => Promise<void>;
  down: (db: SQLiteDatabase) => Promise<void>;
}

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
];

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

  // Repair step: if migration 7 was recorded but the table doesn't actually
  // exist (e.g. multi-statement execAsync partially failed on web), remove
  // the record so it re-runs. Safe because the migration uses IF NOT EXISTS.
  if (appliedSet.has(7)) {
    const tableExists = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_checkins'"
    );
    if (!tableExists) {
      console.warn('Migration 7 was recorded but daily_checkins table missing — re-running');
      await db.runAsync('DELETE FROM _migrations WHERE version = 7');
      appliedSet.delete(7);
    }
  }

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
