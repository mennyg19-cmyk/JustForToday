/**
 * Data management — clear all, export to file, import from file.
 *
 * Export creates a JSON file with all user data that can be shared or saved
 * anywhere. Import reads that file and restores the data. No iCloud dependency.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase, isSQLiteAvailable } from './database/db';

const ASYNC_STORAGE_PREFIX = 'lifetrack_';

// Every SQLite table the app uses — keep in sync with migrations.
const ALL_TABLES = [
  'habits',
  'habit_history',
  'sobriety_counters',
  'sobriety_history',
  'inventory_entries',
  'steps_data',
  'gratitude_entries',
  'fasting_sessions',
  'app_settings',
  'stoic_entries',
  'workouts',
  'daily_checkins',
  'trusted_contacts',
];

/**
 * Get all AsyncStorage keys that belong to the app.
 */
async function getLifeTrackKeys(): Promise<string[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  return allKeys.filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
}

/**
 * Clear all data from AsyncStorage.
 */
export async function clearAsyncStorageData(): Promise<void> {
  const keys = await getLifeTrackKeys();
  if (keys.length > 0) {
    await AsyncStorage.multiRemove(keys);
  }
}

/**
 * Clear all data from SQLite tables (keeps schema and migrations intact).
 * Silently skips tables that don't exist yet.
 */
export async function clearSQLiteData(): Promise<void> {
  const db = await getDatabase();
  for (const table of ALL_TABLES) {
    try {
      await db.runAsync(`DELETE FROM ${table}`);
    } catch {
      // Table may not exist if migration hasn't run — safe to skip
    }
  }
}

/**
 * Clear all app data. Uses SQLite clear when available, always clears AsyncStorage.
 */
export async function clearAllData(): Promise<void> {
  const useSqlite = await isSQLiteAvailable();
  if (useSqlite) {
    await clearSQLiteData();
  }
  await clearAsyncStorageData();
}

// ---------------------------------------------------------------------------
// File-based export / import
// ---------------------------------------------------------------------------

interface BackupData {
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
  asyncStorage: Record<string, string>;
}

/**
 * Export all app data to a shareable JSON file.
 * Opens the native share sheet so the user can save it wherever they want.
 */
export async function exportToFile(): Promise<void> {
  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: {},
    asyncStorage: {},
  };

  // Collect SQLite data
  const useSqlite = await isSQLiteAvailable();
  if (useSqlite) {
    const db = await getDatabase();
    for (const table of ALL_TABLES) {
      try {
        const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
        backup.tables[table] = rows;
      } catch {
        // Table may not exist — skip silently
      }
    }
  }

  // Collect AsyncStorage data
  const keys = await getLifeTrackKeys();
  if (keys.length > 0) {
    const pairs = await AsyncStorage.multiGet(keys);
    for (const [key, value] of pairs) {
      if (value != null) {
        backup.asyncStorage[key] = value;
      }
    }
  }

  // Write to a temp file and share
  const filename = `justfortoday-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Save your backup',
      UTI: 'public.json',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

/**
 * Import app data from a previously exported JSON backup file.
 * Opens a document picker for the user to select the file.
 * Returns true if data was restored successfully.
 */
export async function importFromFile(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return false;
  }

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);

  let backup: BackupData;
  try {
    backup = JSON.parse(content);
  } catch {
    throw new Error('Invalid backup file format');
  }

  if (!backup.version || !backup.tables) {
    throw new Error('This file does not appear to be a valid backup');
  }

  // Restore SQLite data
  const useSqlite = await isSQLiteAvailable();
  if (useSqlite && Object.keys(backup.tables).length > 0) {
    const db = await getDatabase();
    for (const [table, rows] of Object.entries(backup.tables)) {
      if (!ALL_TABLES.includes(table) || !Array.isArray(rows) || rows.length === 0) continue;

      // Clear existing data in this table
      try {
        await db.runAsync(`DELETE FROM ${table}`);
      } catch {
        continue; // Table doesn't exist — skip
      }

      // Insert each row
      for (const row of rows) {
        const rowKeys = Object.keys(row as Record<string, unknown>);
        const values = rowKeys.map((k) => (row as Record<string, unknown>)[k]);
        const placeholders = rowKeys.map(() => '?').join(', ');
        const columns = rowKeys.join(', ');
        try {
          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`,
            values as (string | number | null)[]
          );
        } catch (err) {
          console.warn(`Failed to restore row in ${table}:`, err);
        }
      }
    }
  }

  // Restore AsyncStorage data
  if (backup.asyncStorage && Object.keys(backup.asyncStorage).length > 0) {
    const pairs = Object.entries(backup.asyncStorage);
    await AsyncStorage.multiSet(pairs);
  }

  return true;
}
