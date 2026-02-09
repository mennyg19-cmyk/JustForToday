import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Add optional tracking_start_date to habits (YYYY-MM-DD).
 * When null, app uses created_at date as tracking start.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE habits ADD COLUMN tracking_start_date TEXT;
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  // SQLite does not support DROP COLUMN easily; leave column in place
}
