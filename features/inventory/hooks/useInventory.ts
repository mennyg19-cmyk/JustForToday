import { useState, useCallback, useEffect } from 'react';
import type { InventoryEntry } from '@/lib/database/schema';
import {
  getInventoryEntries,
  createInventoryEntry,
  updateInventoryEntry,
  deleteInventoryEntry,
} from '../database';
import { logger } from '@/lib/logger';

export function useInventory() {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await getInventoryEntries();
      setEntries(list);
    } catch (err) {
      logger.error('Failed to load inventory:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    async (
      entry: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
      options?: { createdAt?: string }
    ) => {
      const created = await createInventoryEntry(entry, options);
      setEntries((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateEntry = useCallback(
    async (
      entryId: string,
      updates: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
      const updated = await updateInventoryEntry(entryId, updates);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? updated : e))
      );
      return updated;
    },
    []
  );

  const removeEntry = useCallback(async (entryId: string) => {
    await deleteInventoryEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const step10Entries = entries.filter((e) => e.type === 'step10');
  const morningEntries = entries.filter((e) => e.type === 'morning');
  const nightlyEntries = entries.filter((e) => e.type === 'nightly');

  return {
    entries,
    step10Entries,
    morningEntries,
    nightlyEntries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  };
}
