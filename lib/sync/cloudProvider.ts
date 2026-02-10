/**
 * Cloud provider abstraction — dispatches sync operations to the correct
 * platform-specific implementation (iCloud on iOS, SAF on Android).
 *
 * This module is the only entry point the sync manager should use for
 * upload/download operations. It never touches the iCloud or SAF modules
 * directly and never loads them unless sync is actually requested.
 *
 * In Expo Go the iCloud native module is unavailable, so all iOS cloud
 * operations short-circuit to no-ops.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * True when running inside Expo Go, where native modules like
 * ExpoIcloudStorage are not bundled.
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Upload the local database to the user's chosen cloud.
 * iOS → iCloud Drive, Android → SAF folder.
 */
export async function uploadDatabase(): Promise<void> {
  if (Platform.OS === 'ios' && !isExpoGo) {
    const { uploadDatabaseToICloud } = await import('./icloud');
    await uploadDatabaseToICloud();
  } else if (Platform.OS === 'android') {
    const { uploadDatabaseToSaf } = await import('./androidSaf');
    await uploadDatabaseToSaf();
  }
  // web / Expo Go / other — no-op
}

/**
 * Download the database from the user's chosen cloud if newer than local.
 * Returns true when the local database was replaced.
 */
export async function downloadDatabase(): Promise<boolean> {
  if (Platform.OS === 'ios' && !isExpoGo) {
    const { downloadDatabaseFromICloud } = await import('./icloud');
    return downloadDatabaseFromICloud();
  } else if (Platform.OS === 'android') {
    const { downloadDatabaseFromSaf } = await import('./androidSaf');
    return downloadDatabaseFromSaf();
  }
  return false;
}

/**
 * Check whether the platform's cloud storage is reachable right now.
 */
export async function isCloudAvailable(): Promise<boolean> {
  if (Platform.OS === 'ios' && !isExpoGo) {
    const { isICloudAvailable } = await import('./icloud');
    return isICloudAvailable();
  } else if (Platform.OS === 'android') {
    const { isSafConfigured } = await import('./androidSaf');
    return isSafConfigured();
  }
  return false;
}

/**
 * Get the last-sync timestamp (platform-specific).
 */
export async function getLastSyncTimestamp(): Promise<Date | null> {
  if (Platform.OS === 'ios' && !isExpoGo) {
    const { getLastSyncTime } = await import('./icloud');
    return getLastSyncTime();
  } else if (Platform.OS === 'android') {
    const { getLastSafSyncTime } = await import('./androidSaf');
    return getLastSafSyncTime();
  }
  return null;
}
