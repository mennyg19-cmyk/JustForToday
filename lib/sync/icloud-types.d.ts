/**
 * Type declarations for @oleg_svetlichnyi/expo-icloud-storage
 * Runtime APIs available on iOS device with iCloud enabled.
 */
declare module '@oleg_svetlichnyi/expo-icloud-storage' {
  interface FileInfo {
    exists: boolean;
    modificationTime?: number;
    size?: number;
  }

  interface ProgressEvent {
    loaded: number;
    total: number;
  }

  interface TransferOptions {
    overwrite?: boolean;
    onProgress?: (progress: ProgressEvent) => void;
  }

  export function isAvailable(): Promise<boolean>;
  export function createDirectory(path: string, recursive?: boolean): Promise<void>;
  export function upload(localPath: string, cloudPath: string, options?: TransferOptions): Promise<void>;
  export function download(cloudPath: string, localPath: string, options?: TransferOptions): Promise<void>;
  export function getFileInfo(cloudPath: string): Promise<FileInfo>;
}
