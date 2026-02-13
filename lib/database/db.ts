import { runMigrations } from './migrations';

const DB_NAME = 'lifetrack.db';

let dbInstance: import('expo-sqlite').SQLiteDatabase | null = null;
let sqliteAvailable: boolean | null = null;
let migrationsVerified = false;
let initPromise: Promise<import('expo-sqlite').SQLiteDatabase> | null = null;

/** Check if native SQLite is available (false in Expo Go). */
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

/** Opens DB and runs migrations; shared across concurrent callers. */
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

/** Get or create DB; runs migrations on first access. Throws in Expo Go. */
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

/** Close DB (for cleanup/testing). */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    migrationsVerified = false;
    initPromise = null;
  }
}

export const EXPO_GO_NO_SQLITE = 'EXPO_GO_NO_SQLITE';

/** DB file name (used for iCloud sync path resolution). */
export function getDatabaseName(): string {
  return DB_NAME;
}
