import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GratitudeEntry } from '@/lib/database/schema';

const GRATITUDE_KEY = 'lifetrack_gratitude';

export async function getGratitudeEntriesAsync(): Promise<GratitudeEntry[]> {
  const raw = await AsyncStorage.getItem(GRATITUDE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function createGratitudeEntryAsync(
  text: string
): Promise<GratitudeEntry> {
  const entries = await getGratitudeEntriesAsync();
  const now = new Date().toISOString();
  const newEntry: GratitudeEntry = {
    id: Date.now().toString(),
    text: text.trim(),
    createdAt: now,
  };
  entries.unshift(newEntry);
  await AsyncStorage.setItem(GRATITUDE_KEY, JSON.stringify(entries));
  return newEntry;
}

export async function updateGratitudeEntryAsync(
  entryId: string,
  text: string
): Promise<GratitudeEntry> {
  const entries = await getGratitudeEntriesAsync();
  const trimmed = text.trim();
  const index = entries.findIndex((e) => e.id === entryId);
  if (index === -1) throw new Error('Entry not found');
  const updated: GratitudeEntry = {
    ...entries[index],
    text: trimmed,
  };
  entries[index] = updated;
  await AsyncStorage.setItem(GRATITUDE_KEY, JSON.stringify(entries));
  return updated;
}

export async function deleteGratitudeEntryAsync(entryId: string): Promise<void> {
  const entries = await getGratitudeEntriesAsync();
  const filtered = entries.filter((e) => e.id !== entryId);
  await AsyncStorage.setItem(GRATITUDE_KEY, JSON.stringify(filtered));
}
