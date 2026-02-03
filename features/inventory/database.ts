import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { InventoryEntry } from '@/lib/database/schema';
import { triggerSync } from '@/lib/sync';
import * as asyncInv from '@/lib/database/asyncFallback/inventory';

function rowToEntry(row: {
  id: string;
  type: string;
  who: string;
  what_happened: string;
  affects_json: string;
  defects_json: string;
  assets_json: string;
  seventh_step_prayer: string;
  prayed: number;
  amends_needed: number;
  amends_to: string;
  help_who: string;
  share_with: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): InventoryEntry {
  return {
    id: row.id,
    type: row.type as InventoryEntry['type'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    who: row.who,
    whatHappened: row.what_happened,
    affects: row.affects_json ? JSON.parse(row.affects_json) : [],
    defects: row.defects_json ? JSON.parse(row.defects_json) : [],
    assets: row.assets_json ? JSON.parse(row.assets_json) : [],
    seventhStepPrayer: row.seventh_step_prayer,
    prayed: row.prayed === 1,
    amendsNeeded: row.amends_needed === 1,
    amendsTo: row.amends_to,
    helpWho: row.help_who,
    shareWith: row.share_with,
    notes: row.notes ?? undefined,
  };
}

export async function getInventoryEntries(): Promise<InventoryEntry[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncInv.getInventoryEntriesAsync();
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM inventory_entries ORDER BY created_at DESC'
  );
  return rows.map(rowToEntry);
}

export async function getInventoryEntriesByType(
  type: InventoryEntry['type']
): Promise<InventoryEntry[]> {
  const all = await getInventoryEntries();
  return all.filter((e) => e.type === type);
}

export async function createInventoryEntry(
  entry: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<InventoryEntry> {
  if (!(await isSQLiteAvailable())) {
    return asyncInv.createInventoryEntryAsync(entry);
  }
  const db = await getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO inventory_entries (
      id, type, who, what_happened, affects_json, defects_json, assets_json,
      seventh_step_prayer, prayed, amends_needed, amends_to, help_who, share_with, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      entry.type,
      entry.who,
      entry.whatHappened,
      JSON.stringify(entry.affects),
      JSON.stringify(entry.defects),
      JSON.stringify(entry.assets),
      entry.seventhStepPrayer,
      entry.prayed ? 1 : 0,
      entry.amendsNeeded ? 1 : 0,
      entry.amendsTo,
      entry.helpWho,
      entry.shareWith,
      entry.notes ?? null,
      now,
      now,
    ]
  );
  triggerSync();
  const list = await getInventoryEntries();
  const created = list.find((e) => e.id === id);
  if (!created) throw new Error('Failed to create entry');
  return created;
}

export async function updateInventoryEntry(
  entryId: string,
  updates: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<InventoryEntry> {
  if (!(await isSQLiteAvailable())) {
    return asyncInv.updateInventoryEntryAsync(entryId, updates);
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM inventory_entries WHERE id = ?',
    [entryId]
  );
  if (!row) throw new Error('Entry not found');
  const who = updates.who ?? row.who;
  const what_happened = updates.whatHappened ?? row.what_happened;
  const affects_json = updates.affects != null ? JSON.stringify(updates.affects) : row.affects_json;
  const defects_json = updates.defects != null ? JSON.stringify(updates.defects) : row.defects_json;
  const assets_json = updates.assets != null ? JSON.stringify(updates.assets) : row.assets_json;
  const seventh_step_prayer = updates.seventhStepPrayer ?? row.seventh_step_prayer;
  const prayed = updates.prayed != null ? (updates.prayed ? 1 : 0) : row.prayed;
  const amends_needed = updates.amendsNeeded != null ? (updates.amendsNeeded ? 1 : 0) : row.amends_needed;
  const amends_to = updates.amendsTo ?? row.amends_to;
  const help_who = updates.helpWho ?? row.help_who;
  const share_with = updates.shareWith ?? row.share_with;
  const notes = updates.notes !== undefined ? updates.notes : row.notes;
  const updated_at = new Date().toISOString();
  await db.runAsync(
    `UPDATE inventory_entries SET
      who = ?, what_happened = ?, affects_json = ?, defects_json = ?, assets_json = ?,
      seventh_step_prayer = ?, prayed = ?, amends_needed = ?, amends_to = ?, help_who = ?, share_with = ?, notes = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      who,
      what_happened,
      affects_json,
      defects_json,
      assets_json,
      seventh_step_prayer,
      prayed,
      amends_needed,
      amends_to,
      help_who,
      share_with,
      notes ?? null,
      updated_at,
      entryId,
    ]
  );
  triggerSync();
  const list = await getInventoryEntries();
  const out = list.find((e) => e.id === entryId);
  if (!out) throw new Error('Entry not found');
  return out;
}

export async function deleteInventoryEntry(entryId: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncInv.deleteInventoryEntryAsync(entryId);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM inventory_entries WHERE id = ?', [entryId]);
  triggerSync();
}
