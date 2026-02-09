/**
 * AsyncStorage fallback for trusted contacts (used in Expo Go where SQLite is unavailable).
 * Mirrors the trusted_contacts SQLite table with JSON serialization.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrustedContact } from '@/lib/database/schema';

const PREFIX = 'lifetrack_';
const KEY = PREFIX + 'trusted_contacts';

async function loadAll(): Promise<TrustedContact[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrustedContact[];
  } catch {
    return [];
  }
}

async function saveAll(contacts: TrustedContact[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(contacts));
}

export async function getTrustedContactsAsync(): Promise<TrustedContact[]> {
  return loadAll();
}

export async function saveTrustedContactAsync(contact: TrustedContact): Promise<void> {
  const all = await loadAll();
  const idx = all.findIndex((c) => c.id === contact.id);
  if (idx >= 0) {
    all[idx] = contact;
  } else {
    all.push(contact);
  }
  await saveAll(all);
}

export async function deleteTrustedContactAsync(id: string): Promise<void> {
  const all = await loadAll();
  await saveAll(all.filter((c) => c.id !== id));
}
