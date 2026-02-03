import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Initial database migration
 * Creates all tables for the LifeTrack Pro app
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  // Habits table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
      type TEXT NOT NULL CHECK (type IN ('build', 'break')),
      created_at TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Habit history table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_history (
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      PRIMARY KEY (habit_id, date),
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_habit_history_date ON habit_history(date);
    CREATE INDEX IF NOT EXISTS idx_habit_history_habit_date ON habit_history(habit_id, date);
  `);

  // Sobriety counters table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sobriety_counters (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      actual_name TEXT,
      start_date TEXT NOT NULL,
      current_streak_start TEXT NOT NULL,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Sobriety history table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sobriety_history (
      counter_id TEXT NOT NULL,
      date TEXT NOT NULL,
      tracked INTEGER NOT NULL DEFAULT 0 CHECK (tracked IN (0, 1)),
      PRIMARY KEY (counter_id, date),
      FOREIGN KEY (counter_id) REFERENCES sobriety_counters(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sobriety_history_date ON sobriety_history(date);
    CREATE INDEX IF NOT EXISTS idx_sobriety_history_counter_date ON sobriety_history(counter_id, date);
  `);

  // Inventory entries table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_entries (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('morning', 'nightly', 'step10')),
      who TEXT NOT NULL,
      what_happened TEXT NOT NULL,
      affects_json TEXT NOT NULL,
      defects_json TEXT NOT NULL,
      assets_json TEXT NOT NULL,
      seventh_step_prayer TEXT NOT NULL,
      prayed INTEGER NOT NULL DEFAULT 0 CHECK (prayed IN (0, 1)),
      amends_needed INTEGER NOT NULL DEFAULT 0 CHECK (amends_needed IN (0, 1)),
      amends_to TEXT NOT NULL DEFAULT '',
      help_who TEXT NOT NULL DEFAULT '',
      share_with TEXT NOT NULL DEFAULT '',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inventory_entries_type ON inventory_entries(type);
    CREATE INDEX IF NOT EXISTS idx_inventory_entries_created_at ON inventory_entries(created_at DESC);
  `);

  // Steps data table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS steps_data (
      date TEXT PRIMARY KEY,
      steps_count INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL CHECK (source IN ('healthkit', 'manual'))
    );
    CREATE INDEX IF NOT EXISTS idx_steps_data_date ON steps_data(date DESC);
  `);

  // Gratitude entries table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS gratitude_entries (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_gratitude_entries_created_at ON gratitude_entries(created_at DESC);
  `);

  // App settings table (key-value store)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );
  `);
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS app_settings;
    DROP TABLE IF EXISTS gratitude_entries;
    DROP TABLE IF EXISTS steps_data;
    DROP TABLE IF EXISTS inventory_entries;
    DROP TABLE IF EXISTS sobriety_history;
    DROP TABLE IF EXISTS sobriety_counters;
    DROP TABLE IF EXISTS habit_history;
    DROP TABLE IF EXISTS habits;
  `);
}
