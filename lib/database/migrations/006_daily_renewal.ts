import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Add last_daily_renewal to sobriety_counters (ISO timestamp of last 24h commitment).
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE sobriety_counters ADD COLUMN last_daily_renewal TEXT;
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  // SQLite does not support DROP COLUMN easily
}
