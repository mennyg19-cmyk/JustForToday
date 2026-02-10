/**
 * Grounding Readings — data management for the "Read something grounding" tool.
 *
 * Stores a list of readings (default recovery literature + user-uploaded PDFs)
 * in AsyncStorage. User PDFs are copied into the app's document directory.
 *
 * Each reading has a `visible` flag so the user can hide entries without
 * deleting them. The reading list is editable from the Settings page and
 * consumed by the Hard Moment screen's GroundingExercise component.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroundingReading {
  id: string;
  title: string;
  subtitle: string;
  /** URL for web resources, or local file:// path for uploaded PDFs */
  uri: string;
  /** Whether this is a built-in default (cannot be deleted) */
  isDefault: boolean;
  /** Whether to show in the Hard Moment screen */
  visible: boolean;
  /** 'url' for web links, 'local' for uploaded files */
  type: 'url' | 'local';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'lifetrack_grounding_readings';
const READINGS_DIR = (FileSystem.documentDirectory ?? '') + 'readings/';

/** Built-in defaults — always present, can be hidden but not deleted. */
export const DEFAULT_READINGS: GroundingReading[] = [
  {
    id: 'default_big_book',
    title: 'Big Book (AA)',
    subtitle: 'Alcoholics Anonymous',
    uri: 'https://drive.google.com/file/d/1N6U1ogfe7pJjdRTmFB5L-d_FiNILvnH4/preview',
    isDefault: true,
    visible: true,
    type: 'url',
  },
  {
    id: 'default_12_12',
    title: 'Twelve Steps and Twelve Traditions',
    subtitle: 'AA 12&12',
    uri: 'https://drive.google.com/file/d/1j5ojPXOtHKZsLjTkP1rinniVjeshJxrn/preview',
    isDefault: true,
    visible: true,
    type: 'url',
  },
  {
    id: 'default_na_basic',
    title: 'NA Basic Text',
    subtitle: 'Narcotics Anonymous',
    uri: 'https://drive.google.com/file/d/1Nl3mBYX6Ekatu1o9Az2_P-H2m2rAnjm1/preview',
    isDefault: true,
    visible: true,
    type: 'url',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure the readings directory exists. */
async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(READINGS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(READINGS_DIR, { intermediates: true });
  }
}

/**
 * Merge saved readings with defaults so new defaults are always present.
 * Preserves user visibility settings for existing defaults.
 */
function mergeWithDefaults(saved: GroundingReading[]): GroundingReading[] {
  const savedById = new Map(saved.map((r) => [r.id, r]));
  const merged: GroundingReading[] = [];

  // Add defaults first (preserving any saved visibility overrides)
  for (const def of DEFAULT_READINGS) {
    const existing = savedById.get(def.id);
    if (existing) {
      // Keep the user's visibility preference but update other fields from default
      merged.push({ ...def, visible: existing.visible });
      savedById.delete(def.id);
    } else {
      merged.push({ ...def });
    }
  }

  // Then add any user entries
  for (const [, entry] of savedById) {
    if (!entry.isDefault) {
      merged.push(entry);
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

/** Load the full reading list (defaults + user entries). */
export async function getReadings(): Promise<GroundingReading[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_READINGS];
    const saved = JSON.parse(raw) as GroundingReading[];
    return mergeWithDefaults(saved);
  } catch {
    return [...DEFAULT_READINGS];
  }
}

/** Load only readings marked as visible. */
export async function getVisibleReadings(): Promise<GroundingReading[]> {
  const all = await getReadings();
  return all.filter((r) => r.visible);
}

/** Persist the full reading list. */
export async function saveReadings(readings: GroundingReading[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

/** Toggle the visible flag for a reading by ID. */
export async function toggleReadingVisibility(id: string): Promise<GroundingReading[]> {
  const readings = await getReadings();
  const updated = readings.map((r) =>
    r.id === id ? { ...r, visible: !r.visible } : r
  );
  await saveReadings(updated);
  return updated;
}

/**
 * Let the user pick a PDF and add it to the reading list.
 * Returns the updated list, or null if the user cancelled.
 */
export async function addReadingFromPicker(
  title: string,
  subtitle: string
): Promise<GroundingReading[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  await ensureDir();

  const id = `reading_${Date.now()}`;
  const fileName = `${id}.pdf`;
  const destPath = READINGS_DIR + fileName;

  // Copy the picked file to our persistent directory
  await FileSystem.copyAsync({ from: asset.uri, to: destPath });

  const newReading: GroundingReading = {
    id,
    title,
    subtitle,
    uri: destPath,
    isDefault: false,
    visible: true,
    type: 'local',
  };

  const readings = await getReadings();
  readings.push(newReading);
  await saveReadings(readings);
  return readings;
}

/** Remove a user-uploaded reading by ID. Deletes the local file too. */
export async function removeReading(id: string): Promise<GroundingReading[]> {
  const readings = await getReadings();
  const target = readings.find((r) => r.id === id);

  // Delete local file if it exists
  if (target && target.type === 'local' && target.uri) {
    try {
      const info = await FileSystem.getInfoAsync(target.uri);
      if (info.exists) {
        await FileSystem.deleteAsync(target.uri, { idempotent: true });
      }
    } catch {
      // Best-effort deletion
    }
  }

  const updated = readings.filter((r) => r.id !== id);
  await saveReadings(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Opening a reading
// ---------------------------------------------------------------------------

/**
 * Returns the route path for opening a reading in the in-app reader.
 * The caller should use router.push() with this path.
 */
export function getReaderRoute(reading: GroundingReading): string {
  return `/reader?readingId=${encodeURIComponent(reading.id)}`;
}
