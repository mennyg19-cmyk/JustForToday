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
    try {
      const created = await startFastingSession();
      setSessions((prev) => [created, ...prev]);
      setActiveSession(created);
      return created;
    } catch (err) {
      logger.error('Failed to start fast:', err);
      setError(err instanceof Error ? err.message : 'Failed to start fast');
      throw err;
    }
  }, []);

  const endFast = useCallback(async (sessionId: string) => {
    try {
      const updated = await endFastingSession(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setActiveSession(null);
      return updated;
    } catch (err) {
      logger.error('Failed to end fast:', err);
      setError(err instanceof Error ? err.message : 'Failed to end fast');
      throw err;
    }
  }, []);

  const addPastSession = useCallback(async (startAt: string, endAt: string) => {
    try {
      const created = await createFastingSessionWithTimes(startAt, endAt);
      setSessions((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      logger.error('Failed to add past session:', err);
      setError(err instanceof Error ? err.message : 'Failed to add session');
      throw err;
    }
  }, []);

  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: { startAt?: string; endAt?: string | null }
    ) => {
      try {
        const updated = await updateFastingSession(sessionId, updates);
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
        if (updated.endAt === null) {
          setActiveSession(updated);
        } else {
          setActiveSession((a) => (a?.id === sessionId ? null : a));
        }
        return updated;
      } catch (err) {
        logger.error('Failed to update session:', err);
        setError(err instanceof Error ? err.message : 'Failed to update session');
        throw err;
      }
    },
    []
  );

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteFastingSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActiveSession((a) => (a?.id === sessionId ? null : a));
    } catch (err) {
      logger.error('Failed to delete session:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
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
