import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InventoryEntry } from '@/lib/database/schema';

const INVENTORY_KEY = 'lifetrack_inventory';

export async function getInventoryEntriesAsync(): Promise<InventoryEntry[]> {
  const raw = await AsyncStorage.getItem(INVENTORY_KEY);
  const data = raw ? JSON.parse(raw) : [];
  return data.map((e: any) => ({
    ...e,
    type: e.type || 'step10',
    affects: e.affects ?? [],
    defects: e.defects ?? [],
    assets: e.assets ?? [],
  }));
}

export async function createInventoryEntryAsync(
  entry: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
  options?: { createdAt?: string }
): Promise<InventoryEntry> {
  const entries = await getInventoryEntriesAsync();
  const now = options?.createdAt ?? new Date().toISOString();
  const newEntry: InventoryEntry = {
    ...entry,
    id: Date.now().toString(),
    createdAt: now,
    updatedAt: now,
  };
  entries.unshift(newEntry);
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(entries));
  return newEntry;
}

export async function updateInventoryEntryAsync(
  entryId: string,
  updates: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InventoryEntry> {
  const entries = await getInventoryEntriesAsync();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) throw new Error('Entry not found');
  const existing = entries[idx];
  const updated: InventoryEntry = {
    ...existing,
    ...updates,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  entries[idx] = updated;
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(entries));
  return updated;
}

export async function deleteInventoryEntryAsync(entryId: string): Promise<void> {
  const entries = await getInventoryEntriesAsync();
  const filtered = entries.filter((e) => e.id !== entryId);
  await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(filtered));
}
