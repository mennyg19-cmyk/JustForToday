import { useState, useCallback, useEffect } from 'react';
import type { FastingSession } from '@/lib/database/schema';
import {
  getFastingSessions,
  getActiveFastingSession,
  startFastingSession,
  createFastingSessionWithTimes,
  endFastingSession,
  updateFastingSession,
  deleteFastingSession,
} from '../database';
import { logger } from '@/lib/logger';

export function useFasting() {
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [activeSession, setActiveSession] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [allSessions, active] = await Promise.all([
        getFastingSessions(),
        getActiveFastingSession(),
      ]);
      setSessions(allSessions);
      setActiveSession(active);
    } catch (err) {
      logger.error('Failed to load fasting:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fasting');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startFast = useCallback(async () => {
    const created = await startFastingSession();
    setSessions((prev) => [created, ...prev]);
    setActiveSession(created);
    return created;
  }, []);

  const endFast = useCallback(async (sessionId: string) => {
    const updated = await endFastingSession(sessionId);
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    setActiveSession(null);
    return updated;
  }, []);

  const addPastSession = useCallback(async (startAt: string, endAt: string) => {
    const created = await createFastingSessionWithTimes(startAt, endAt);
    setSessions((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: { startAt?: string; endAt?: string | null }
    ) => {
      const updated = await updateFastingSession(sessionId, updates);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      if (updated.endAt === null) {
        setActiveSession(updated);
      } else {
        setActiveSession((a) => (a?.id === sessionId ? null : a));
      }
      return updated;
    },
    []
  );

  const deleteSession = useCallback(async (sessionId: string) => {
    await deleteFastingSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setActiveSession((a) => (a?.id === sessionId ? null : a));
  }, []);

  return {
    sessions,
    activeSession,
    loading,
    error,
    refresh,
    startFast,
    endFast,
    addPastSession,
    updateSession,
    deleteSession,
  };
}
