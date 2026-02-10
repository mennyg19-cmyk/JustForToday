/**
 * Sync manager — orchestrates cloud sync operations.
 *
 * All sync is opt-in: nothing happens unless the user explicitly enables
 * cloud sync in Settings. The manager delegates to cloudProvider.ts which
 * dispatches to the right platform implementation (iCloud / SAF).
 */

import { AppState, type AppStateStatus, type NativeEventSubscription } from 'react-native';
import { isSQLiteAvailable } from '../database/db';
import { getCloudSyncEnabled } from '../settings/database';
import * as cloudProvider from './cloudProvider';
import { logger } from '../logger';

let syncInProgress = false;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let appStateSubscription: NativeEventSubscription | null = null;

/** Cached enabled flag — refreshed on every initializeSync / enableSync call. */
let syncEnabled = false;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function performSync(): Promise<void> {
  syncInProgress = true;
  try {
    await cloudProvider.uploadDatabase();
  } catch (error) {
    logger.error('Sync failed:', error);
  } finally {
    syncInProgress = false;
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
  }
}

async function syncToCloud(immediate = false): Promise<void> {
  if (!syncEnabled) return;
  if (!(await isSQLiteAvailable())) return;
  if (syncInProgress) return;

  if (!immediate) {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      performSync();
    }, 2000);
    return;
  }

  await performSync();
}

function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === 'background' || nextAppState === 'inactive') {
    syncToCloud(true).catch((error) => {
      logger.error('Background sync failed:', error);
    });
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize sync manager — reads the enabled setting and, if sync is on,
 * downloads the latest cloud database and subscribes to app-state changes.
 *
 * Safe to call at any time; no-ops when sync is disabled or SQLite is
 * unavailable (Expo Go).
 */
export async function initializeSync(): Promise<void> {
  syncEnabled = await getCloudSyncEnabled();
  if (!syncEnabled) return;
  if (!(await isSQLiteAvailable())) return;

  try {
    const downloaded = await cloudProvider.downloadDatabase();
    if (downloaded) {
      logger.info('Database updated from cloud');
    }
  } catch (error) {
    logger.error('Failed to initialize sync:', error);
  }

  // Subscribe to app-state changes (sync on background)
  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

/**
 * Called from Settings when the user turns sync ON.
 */
export async function enableSync(): Promise<void> {
  syncEnabled = true;

  // Attempt an initial download + start background listener
  try {
    if (await isSQLiteAvailable()) {
      const downloaded = await cloudProvider.downloadDatabase();
      if (downloaded) {
        logger.info('Database updated from cloud');
      }
    }
  } catch (error) {
    logger.error('Enable sync — download failed:', error);
  }

  appStateSubscription?.remove();
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

/**
 * Called from Settings when the user turns sync OFF.
 */
export function disableSync(): void {
  syncEnabled = false;
  cleanupSync();
}

/**
 * Trigger a debounced sync (call after database mutations).
 * No-op when sync is disabled.
 */
export function triggerSync(): void {
  if (!syncEnabled) return;
  syncToCloud(false).catch((error) => {
    logger.error('Sync trigger failed:', error);
  });
}

/**
 * Force an immediate sync. Returns only after the upload completes.
 */
export async function forceSync(): Promise<void> {
  // Temporarily treat as enabled for this single call so the user can
  // test sync from Settings even if the cached flag is stale.
  const wasEnabled = syncEnabled;
  syncEnabled = true;
  try {
    await syncToCloud(true);
  } finally {
    syncEnabled = wasEnabled;
  }
}

/**
 * Tear down listeners and timers.
 */
export function cleanupSync(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
