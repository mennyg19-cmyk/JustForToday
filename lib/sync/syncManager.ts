import { AppState, AppStateStatus } from 'react-native';
import * as uploadModule from './icloud';
import { isSQLiteAvailable } from '../database/db';

let syncInProgress = false;
let syncTimeout: NodeJS.Timeout | null = null;

/**
 * Sync database to iCloud (no-op when SQLite is not available, e.g. Expo Go)
 */
async function syncToICloud(immediate = false): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    return;
  }
  if (syncInProgress) {
    return;
  }

  if (!immediate && syncTimeout) {
    // Debounce: wait a bit before syncing
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      performSync();
    }, 2000); // Wait 2 seconds after last change
    return;
  }

  await performSync();
}

async function performSync(): Promise<void> {
  syncInProgress = true;
  try {
    // Ensure database is closed before syncing
    // (SQLite locks the file while open)
    await uploadModule.uploadDatabaseToICloud();
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    syncInProgress = false;
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
  }
}

/**
 * Initialize sync manager (no-op when SQLite is not available, e.g. Expo Go)
 */
export async function initializeSync(): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    return;
  }
  try {
    const downloaded = await uploadModule.downloadDatabaseFromICloud();
    if (downloaded) {
      console.log('Database updated from iCloud');
    }
  } catch (error) {
    console.error('Failed to initialize sync:', error);
  }

  AppState.addEventListener('change', handleAppStateChange);
}

/**
 * Handle app state changes
 * Sync when app goes to background
 */
function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    // Sync when app goes to background
    syncToICloud(true).catch((error) => {
      console.error('Background sync failed:', error);
    });
  }
}

/**
 * Trigger a sync (call after database mutations)
 * Debounced to avoid too frequent syncs
 */
export function triggerSync(): void {
  syncToICloud(false).catch((error) => {
    console.error('Sync trigger failed:', error);
  });
}

/**
 * Force an immediate sync
 */
export async function forceSync(): Promise<void> {
  await syncToICloud(true);
}

/**
 * Cleanup sync manager
 */
export function cleanupSync(): void {
  AppState.removeEventListener('change', handleAppStateChange);
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
