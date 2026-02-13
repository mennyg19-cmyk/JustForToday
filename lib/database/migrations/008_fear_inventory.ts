import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 008 — Add 'fear' to inventory_entries type CHECK constraint.
 *
 * SQLite does not support ALTER TABLE … ALTER CONSTRAINT, so we recreate
 * the table with the updated CHECK and copy existing data across.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_entries_new (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('morning', 'nightly', 'step10', 'fear')),
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
    `);
    await db.execAsync('INSERT INTO inventory_entries_new SELECT * FROM inventory_entries;');
    await db.execAsync('DROP TABLE inventory_entries;');
    await db.execAsync('ALTER TABLE inventory_entries_new RENAME TO inventory_entries;');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_inventory_entries_type ON inventory_entries(type);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_inventory_entries_created_at ON inventory_entries(created_at DESC);');
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    await db.execAsync("DELETE FROM inventory_entries WHERE type = 'fear';");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory_entries_old (
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
    `);
    await db.execAsync('INSERT INTO inventory_entries_old SELECT * FROM inventory_entries;');
    await db.execAsync('DROP TABLE inventory_entries;');
    await db.execAsync('ALTER TABLE inventory_entries_old RENAME TO inventory_entries;');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_inventory_entries_type ON inventory_entries(type);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_inventory_entries_created_at ON inventory_entries(created_at DESC);');
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
