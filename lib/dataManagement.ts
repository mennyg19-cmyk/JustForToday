import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, isSQLiteAvailable } from './database/db';
import { uploadDatabaseToICloud } from './sync/icloud';
import { downloadDatabaseFromICloud } from './sync/icloud';

const ASYNC_STORAGE_PREFIX = 'lifetrack_';

/**
 * Get all AsyncStorage keys that belong to LifeTrack (for clear).
 */
async function getLifeTrackKeys(): Promise<string[]> {
  const allKeys = await AsyncStorage.getAllKeys();
  return allKeys.filter((k) => k.startsWith(ASYNC_STORAGE_PREFIX));
}

/**
 * Clear all data from AsyncStorage (used when SQLite is not available, e.g. Expo Go).
 */
export async function clearAsyncStorageData(): Promise<void> {
  const keys = await getLifeTrackKeys();
  if (keys.length > 0) {
    await AsyncStorage.multiRemove(keys);
  }
}

/**
 * Clear all data from SQLite tables (keeps schema and migrations).
 */
export async function clearSQLiteData(): Promise<void> {
  const db = await getDatabase();
  const tables = [
    'habit_history',
    'habits',
    'sobriety_history',
    'sobriety_counters',
    'inventory_entries',
    'steps_data',
    'gratitude_entries',
    'fasting_sessions',
    'app_settings',
  ];
  for (const table of tables) {
    await db.runAsync(`DELETE FROM ${table}`);
  }
}

/**
 * Clear all app data. Uses AsyncStorage clear when in Expo Go, SQLite clear when available.
 */
export async function clearAllData(): Promise<void> {
  const useSqlite = await isSQLiteAvailable();
  if (useSqlite) {
    await clearSQLiteData();
  }
  await clearAsyncStorageData();
}

/**
 * Export (upload) database to iCloud. No-op if iCloud not available.
 */
export async function exportToICloud(): Promise<void> {
  await uploadDatabaseToICloud();
}

/**
 * Import (download) database from iCloud. Returns true if a newer file was downloaded.
 */
export async function importFromICloud(): Promise<boolean> {
  return downloadDatabaseFromICloud();
}
