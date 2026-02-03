import * as FileSystem from 'expo-file-system';

const DB_FILENAME = 'lifetrack.db';
const ICLOUD_FOLDER = 'LifeTrackPro';
const ICLOUD_DB_PATH = `${ICLOUD_FOLDER}/${DB_FILENAME}`;

/** Lazy-load iCloud module so Expo Go doesn't crash (it doesn't include this native module). */
async function getICloudStorage(): Promise<typeof import('@oleg_svetlichnyi/expo-icloud-storage') | null> {
  try {
    return await import('@oleg_svetlichnyi/expo-icloud-storage');
  } catch {
    return null;
  }
}

/**
 * Get the local database file path
 */
async function getLocalDbPath(): Promise<string> {
  const documentDir = FileSystem.documentDirectory;
  if (!documentDir) {
    throw new Error('Document directory not available');
  }
  return `${documentDir}${DB_FILENAME}`;
}

/**
 * Check if iCloud is available (and native module is present)
 */
export async function isICloudAvailable(): Promise<boolean> {
  try {
    const ICloudStorage = await getICloudStorage();
    if (!ICloudStorage) return false;
    return await ICloudStorage.isAvailable();
  } catch {
    return false;
  }
}

/**
 * Upload database file to iCloud Drive
 */
export async function uploadDatabaseToICloud(): Promise<void> {
  try {
    const ICloudStorage = await getICloudStorage();
    if (!ICloudStorage) return;

    const available = await ICloudStorage.isAvailable();
    if (!available) {
      console.log('iCloud not available, skipping upload');
      return;
    }

    const localPath = await getLocalDbPath();

    const fileInfo = await FileSystem.getInfoAsync(localPath);
    if (!fileInfo.exists) {
      console.log('Database file does not exist locally');
      return;
    }

    try {
      await ICloudStorage.createDirectory(ICLOUD_FOLDER, true);
    } catch (error) {
      console.log('iCloud folder creation:', error);
    }

    await ICloudStorage.upload(localPath, ICLOUD_DB_PATH, {
      overwrite: true,
      onProgress: (progress) => {
        console.log(`Upload progress: ${(progress.loaded / progress.total) * 100}%`);
      },
    });

    console.log('Database uploaded to iCloud successfully');
  } catch (error) {
    console.error('Failed to upload database to iCloud:', error);
    throw error;
  }
}

/**
 * Download database file from iCloud Drive
 * Returns true if download was successful and file is newer than local
 */
export async function downloadDatabaseFromICloud(): Promise<boolean> {
  try {
    const ICloudStorage = await getICloudStorage();
    if (!ICloudStorage) return false;

    const available = await ICloudStorage.isAvailable();
    if (!available) {
      console.log('iCloud not available, skipping download');
      return false;
    }

    const localPath = await getLocalDbPath();

    try {
      const cloudFileInfo = await ICloudStorage.getFileInfo(ICLOUD_DB_PATH);
      if (!cloudFileInfo.exists) {
        console.log('Database file does not exist in iCloud');
        return false;
      }

      const localFileInfo = await FileSystem.getInfoAsync(localPath);
      if (localFileInfo.exists) {
        const localModTime = localFileInfo.modificationTime || 0;
        const cloudModTime = cloudFileInfo.modificationTime || 0;

        if (cloudModTime <= localModTime) {
          console.log('Local database is up to date');
          return false;
        }
      }

      await ICloudStorage.download(ICLOUD_DB_PATH, localPath, {
        overwrite: true,
        onProgress: (progress) => {
          console.log(`Download progress: ${(progress.loaded / progress.total) * 100}%`);
        },
      });

      console.log('Database downloaded from iCloud successfully');
      return true;
    } catch (error) {
      console.error('Failed to download database from iCloud:', error);
      return false;
    }
  } catch (error) {
    console.error('Error checking iCloud for database:', error);
    return false;
  }
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<Date | null> {
  try {
    const ICloudStorage = await getICloudStorage();
    if (!ICloudStorage) return null;

    const available = await ICloudStorage.isAvailable();
    if (!available) return null;

    const fileInfo = await ICloudStorage.getFileInfo(ICLOUD_DB_PATH);
    if (!fileInfo.exists) return null;

    return fileInfo.modificationTime ? new Date(fileInfo.modificationTime * 1000) : null;
  } catch {
    return null;
  }
}
