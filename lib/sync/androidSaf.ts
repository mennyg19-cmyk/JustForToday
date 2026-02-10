/**
 * Android SAF (Storage Access Framework) sync module.
 *
 * Lets the user pick ANY folder on their device — Google Drive, OneDrive,
 * Dropbox, or a plain local folder. The Android system handles the actual
 * cloud transport transparently.
 *
 * The database file is read/written as base64 because SAF URIs only support
 * string I/O via expo-file-system.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { getSafFolderUri, setSafFolderUri } from '../settings/database';
import { logger } from '../logger';

const DB_FILENAME = 'lifetrack.db';
const DB_MIME_TYPE = 'application/x-sqlite3';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Local document-directory path to the SQLite database. */
function getLocalDbPath(): string {
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error('Document directory not available');
  return `${dir}${DB_FILENAME}`;
}

/**
 * Scan the SAF directory for an existing backup file and return its URI.
 * Returns `null` when no matching file is found.
 */
async function findExistingBackup(directoryUri: string): Promise<string | null> {
  try {
    const entries = await StorageAccessFramework.readDirectoryAsync(directoryUri);
    // SAF URIs encode the filename — look for one that ends with our DB name.
    const match = entries.find((uri) => decodeURIComponent(uri).endsWith(DB_FILENAME));
    return match ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Open the Android folder picker and persist the chosen directory URI.
 * Returns the URI, or `null` if the user cancelled.
 */
export async function requestSyncFolder(): Promise<string | null> {
  const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) return null;

  await setSafFolderUri(permissions.directoryUri);
  return permissions.directoryUri;
}

/** Whether the user has already chosen a sync folder. */
export async function isSafConfigured(): Promise<boolean> {
  const uri = await getSafFolderUri();
  return uri != null;
}

/**
 * Upload the local database to the SAF folder.
 */
export async function uploadDatabaseToSaf(): Promise<void> {
  const folderUri = await getSafFolderUri();
  if (!folderUri) {
    logger.info('SAF folder not configured, skipping upload');
    return;
  }

  const localPath = getLocalDbPath();
  const localInfo = await FileSystem.getInfoAsync(localPath);
  if (!localInfo.exists) {
    logger.info('Local database does not exist, skipping upload');
    return;
  }

  // Read the local database as base64
  const base64 = await FileSystem.readAsStringAsync(localPath, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Try to find an existing backup to overwrite
  let targetUri = await findExistingBackup(folderUri);

  if (!targetUri) {
    // First sync — create the file
    targetUri = await StorageAccessFramework.createFileAsync(
      folderUri,
      DB_FILENAME,
      DB_MIME_TYPE
    );
  }

  await FileSystem.writeAsStringAsync(targetUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  logger.info('Database uploaded to SAF folder successfully');
}

/**
 * Download the database from the SAF folder if it is newer than the local copy.
 * Returns `true` when the local database was replaced.
 */
export async function downloadDatabaseFromSaf(): Promise<boolean> {
  const folderUri = await getSafFolderUri();
  if (!folderUri) return false;

  const remoteUri = await findExistingBackup(folderUri);
  if (!remoteUri) {
    logger.info('No database file found in SAF folder');
    return false;
  }

  const localPath = getLocalDbPath();

  // Compare modification times
  try {
    const remoteInfo = await FileSystem.getInfoAsync(remoteUri);
    const localInfo = await FileSystem.getInfoAsync(localPath);

    if (localInfo.exists && remoteInfo.exists) {
      const localMod = localInfo.modificationTime ?? 0;
      const remoteMod = remoteInfo.modificationTime ?? 0;
      if (remoteMod <= localMod) {
        logger.info('Local database is up to date');
        return false;
      }
    }
  } catch {
    // If we can't compare times, proceed with download to be safe
  }

  // Read remote as base64 and write to local path
  const base64 = await FileSystem.readAsStringAsync(remoteUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await FileSystem.writeAsStringAsync(localPath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  logger.info('Database downloaded from SAF folder successfully');
  return true;
}

/**
 * Get the modification time of the backup in the SAF folder.
 */
export async function getLastSafSyncTime(): Promise<Date | null> {
  try {
    const folderUri = await getSafFolderUri();
    if (!folderUri) return null;

    const fileUri = await findExistingBackup(folderUri);
    if (!fileUri) return null;

    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || !info.modificationTime) return null;

    return new Date(info.modificationTime * 1000);
  } catch {
    return null;
  }
}
