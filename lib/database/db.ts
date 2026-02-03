import { runMigrations } from './migrations';

const DB_NAME = 'lifetrack.db';

let dbInstance: import('expo-sqlite').SQLiteDatabase | null = null;
let sqliteAvailable: boolean | null = null;

/**
 * Check if the native Expo SQLite module is available.
 * In Expo Go it is not included, so we use AsyncStorage fallback there.
 */
export async function isSQLiteAvailable(): Promise<boolean> {
  if (sqliteAvailable !== null) {
    return sqliteAvailable;
  }
  try {
    const SQLite = await import('expo-sqlite');
    const testDb = await SQLite.openDatabaseAsync('_probe_');
    await testDb.closeAsync();
    sqliteAvailable = true;
  } catch {
    sqliteAvailable = false;
  }
  return sqliteAvailable;
}

/**
 * Get or create the database instance.
 * Runs migrations automatically on first access.
 * Throws if SQLite is not available (e.g. in Expo Go).
 */
export async function getDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  const available = await isSQLiteAvailable();
  if (!available) {
    throw new Error('EXPO_GO_NO_SQLITE');
  }

  if (dbInstance) {
    return dbInstance;
  }

  const SQLite = await import('expo-sqlite');
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(dbInstance);

  return dbInstance;
}

/**
 * Close the database connection.
 * Useful for cleanup or testing.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

export const EXPO_GO_NO_SQLITE = 'EXPO_GO_NO_SQLITE';

/**
 * Get the database file path
 * Used for iCloud sync
 * Note: expo-sqlite stores databases in the app's document directory
 * The actual path will be resolved in the sync layer using expo-file-system
 */
export function getDatabaseName(): string {
  return DB_NAME;
}
