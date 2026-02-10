import { useState, useCallback, useEffect } from 'react';
import type { GratitudeEntry } from '@/lib/database/schema';
import {
  getGratitudeEntries,
  createGratitudeEntry,
  updateGratitudeEntry,
  deleteGratitudeEntry,
} from '../database';
import { logger } from '@/lib/logger';

export function useGratitude() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await getGratitudeEntries();
      setEntries(list);
    } catch (err) {
      logger.error('Failed to load gratitude:', err);
      setError(err instanceof Error ? err.message : 'Failed to load gratitude');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(async (text: string) => {
    const created = await createGratitudeEntry(text);
    setEntries((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateEntry = useCallback(
    async (entryId: string, text: string) => {
      const updated = await updateGratitudeEntry(entryId, text);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? updated : e))
      );
      return updated;
    },
    []
  );

  const removeEntry = useCallback(async (entryId: string) => {
    await deleteGratitudeEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  return {
    entries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  };
}
