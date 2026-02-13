import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Migration 009 — Rename module ID "inventory" to "step11" in stored
 * app_visibility JSON (app_settings table, key = "app_visibility").
 *
 * The "inventory" key previously mapped to Step 11 (morning/nightly
 * reflections), which was confusing because the features/inventory/
 * directory also contains Step 10. This rename clarifies the mapping.
 */
export async function up(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    const row = await db.getFirstAsync<{ value_json: string }>(
      "SELECT value_json FROM app_settings WHERE key = 'app_visibility'"
    );
    if (row) {
      try {
        const vis = JSON.parse(row.value_json);
        if ('inventory' in vis && !('step11' in vis)) {
          vis.step11 = vis.inventory;
          delete vis.inventory;
          await db.runAsync(
            "UPDATE app_settings SET value_json = ? WHERE key = 'app_visibility'",
            [JSON.stringify(vis)]
          );
        }
      } catch { /* corrupted JSON — skip, defaults will apply */ }
    }

    const modRow = await db.getFirstAsync<{ value_json: string }>(
      "SELECT value_json FROM app_settings WHERE key = 'module_settings'"
    );
    if (modRow) {
      try {
        const settings = JSON.parse(modRow.value_json);
        if ('inventory' in settings && !('step11' in settings)) {
          settings.step11 = settings.inventory;
          delete settings.inventory;
          await db.runAsync(
            "UPDATE app_settings SET value_json = ? WHERE key = 'module_settings'",
            [JSON.stringify(settings)]
          );
        }
      } catch { /* corrupted JSON — skip */ }
    }

    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}

export async function down(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    const row = await db.getFirstAsync<{ value_json: string }>(
      "SELECT value_json FROM app_settings WHERE key = 'app_visibility'"
    );
    if (row) {
      try {
        const vis = JSON.parse(row.value_json);
        if ('step11' in vis && !('inventory' in vis)) {
          vis.inventory = vis.step11;
          delete vis.step11;
          await db.runAsync(
            "UPDATE app_settings SET value_json = ? WHERE key = 'app_visibility'",
            [JSON.stringify(vis)]
          );
        }
      } catch { /* skip */ }
    }
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
