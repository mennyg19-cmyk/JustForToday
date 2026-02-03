import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Fasting sessions table: one row per fast (start_at, end_at).
 * end_at IS NULL means the fast is currently active.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS fasting_sessions (
      id TEXT PRIMARY KEY,
      start_at TEXT NOT NULL,
      end_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_fasting_sessions_start_at ON fasting_sessions(start_at DESC);
    CREATE INDEX IF NOT EXISTS idx_fasting_sessions_end_at ON fasting_sessions(end_at);
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS fasting_sessions;');
}
