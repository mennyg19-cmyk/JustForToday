import { runMigrations } from './migrations';

const DB_NAME = 'lifetrack.db';

let dbInstance: import('expo-sqlite').SQLiteDatabase | null = null;
let sqliteAvailable: boolean | null = null;
let migrationsVerified = false;

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
 * Runs migrations automatically on first access, and re-checks if a
 * previous migration attempt failed (so we don't cache broken state).
 * Throws if SQLite is not available (e.g. in Expo Go).
 */
export async function getDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  try {
    const available = await isSQLiteAvailable();
    if (!available) {
      throw new Error('EXPO_GO_NO_SQLITE');
    }

    if (!dbInstance) {
      const SQLite = await import('expo-sqlite');
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    }

    // Always run migrations if they haven't been verified in this JS session.
    // runMigrations is idempotent — it skips already-applied versions.
    if (!migrationsVerified) {
      await runMigrations(dbInstance);
      migrationsVerified = true;
    }

    return dbInstance;
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Clear failed instance so next attempt can retry
    dbInstance = null;
    migrationsVerified = false;
    throw new Error(
      `Failed to initialize database: ${error instanceof Error ? error.message : 'Unknown error'}. Please try restarting the app.`
    );
  }
}

/**
 * Close the database connection.
 * Useful for cleanup or testing.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    migrationsVerified = false;
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
