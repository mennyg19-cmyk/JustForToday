import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Stoic module: weekly reading + daily exercise entries from
 * "A Handbook for New Stoics" (52 weeks). One row per (week, day).
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS stoic_entries (
      week_number INTEGER NOT NULL,
      day_key TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      useful INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (week_number, day_key)
    );
    CREATE INDEX IF NOT EXISTS idx_stoic_entries_week ON stoic_entries(week_number);
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS stoic_entries;');
}
