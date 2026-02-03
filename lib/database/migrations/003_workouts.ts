import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Workouts table: manual workout entries (HealthKit workouts are fetched live, not stored).
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      calories_burned INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL CHECK (source IN ('healthkit', 'manual'))
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS workouts;');
}
