import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 007: Add tables for the daily check-in flow and trusted contacts.
 *
 * daily_checkins — stores one row per day with commitment choice, reflection,
 *   and a private TODO item generated from the user's answers.
 *
 * trusted_contacts — small list of people the user can call during a Hard Moment.
 *   These are picked from device contacts and displayed only in Hard Moment mode.
 *
 * Note: each CREATE TABLE is a separate execAsync call — some SQLite
 * implementations (especially on web) don't fully execute multi-statement strings.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_checkins (
      date TEXT PRIMARY KEY,
      commitment_type TEXT NOT NULL DEFAULT 'none',
      challenge TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT '',
      todo_text TEXT NOT NULL DEFAULT '',
      todo_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DROP TABLE IF EXISTS daily_checkins;');
  await db.execAsync('DROP TABLE IF EXISTS trusted_contacts;');
}
