import { runMigrations } from './migrations';

const DB_NAME = 'lifetrack.db';

let dbInstance: import('expo-sqlite').SQLiteDatabase | null = null;
let sqliteAvailable: boolean | null = null;
let migrationsVerified = false;
/** Shared promise so concurrent getDatabase() callers don't run migrations in parallel. */
let initPromise: Promise<import('expo-sqlite').SQLiteDatabase> | null = null;

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
 * Internal initializer — opens the database and runs migrations exactly once.
 * Callers share a single promise so concurrent access is safe.
 */
async function initializeDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  const available = await isSQLiteAvailable();
  if (!available) {
    throw new Error('EXPO_GO_NO_SQLITE');
  }

  if (!dbInstance) {
    const SQLite = await import('expo-sqlite');
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }

  await runMigrations(dbInstance);
  migrationsVerified = true;
  return dbInstance;
}

/**
 * Get or create the database instance.
 * Runs migrations automatically on first access. Concurrent callers share
 * a single init promise so migrations never run in parallel (which would
 * cause a UNIQUE-constraint error on the _migrations table).
 * Throws if SQLite is not available (e.g. in Expo Go).
 */
export function getDatabase(): Promise<import('expo-sqlite').SQLiteDatabase> {
  // Fast path — already fully initialised.
  if (migrationsVerified && dbInstance) {
    return Promise.resolve(dbInstance);
  }

  // Ensure only one initialisation is in flight at a time.
  if (!initPromise) {
    initPromise = initializeDatabase().catch((err) => {
      // Allow retry on next call.
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
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
    initPromise = null;
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
