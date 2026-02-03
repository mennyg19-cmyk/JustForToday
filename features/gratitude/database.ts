import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { GratitudeEntry } from '@/lib/database/schema';
import { triggerSync } from '@/lib/sync';
import * as asyncGrat from '@/lib/database/asyncFallback/gratitude';

function rowToEntry(row: { id: string; text: string; created_at: string }): GratitudeEntry {
  return {
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export async function getGratitudeEntries(): Promise<GratitudeEntry[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncGrat.getGratitudeEntriesAsync();
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT id, text, created_at FROM gratitude_entries ORDER BY created_at DESC'
  );
  return rows.map(rowToEntry);
}

export async function createGratitudeEntry(text: string): Promise<GratitudeEntry> {
  if (!(await isSQLiteAvailable())) {
    return asyncGrat.createGratitudeEntryAsync(text);
  }
  const db = await getDatabase();
  const id = Date.now().toString();
  const now = new Date().toISOString();
  const trimmed = text.trim();
  await db.runAsync(
    'INSERT INTO gratitude_entries (id, text, created_at) VALUES (?, ?, ?)',
    [id, trimmed, now]
  );
  triggerSync();
  const list = await getGratitudeEntries();
  const created = list.find((e) => e.id === id);
  if (!created) throw new Error('Failed to create entry');
  return created;
}

export async function updateGratitudeEntry(
  entryId: string,
  text: string
): Promise<GratitudeEntry> {
  if (!(await isSQLiteAvailable())) {
    return asyncGrat.updateGratitudeEntryAsync(entryId, text);
  }
  const db = await getDatabase();
  const trimmed = text.trim();
  await db.runAsync('UPDATE gratitude_entries SET text = ? WHERE id = ?', [
    trimmed,
    entryId,
  ]);
  triggerSync();
  const list = await getGratitudeEntries();
  const updated = list.find((e) => e.id === entryId);
  if (!updated) throw new Error('Failed to update entry');
  return updated;
}

export async function deleteGratitudeEntry(entryId: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncGrat.deleteGratitudeEntryAsync(entryId);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM gratitude_entries WHERE id = ?', [entryId]);
  triggerSync();
}
