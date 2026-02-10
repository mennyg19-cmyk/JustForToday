/**
 * Hook for managing today's check-in state.
 *
 * Loads the current day's check-in from the database, exposes save/toggle
 * functions, and provides a `hasCheckedIn` flag for the home screen.
 *
 * Used by: CheckInFlow screen, home screen (app/index.tsx).
 */

import { useState, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import type { DailyCheckIn, CommitmentType } from '@/lib/database/schema';
import { getCheckInForDate, saveCheckIn, updateTodoCompleted, getMostRecentCheckIn, deleteCheckIn } from '../database';
import { buildTodoText } from '@/lib/commitment';
import { getTodayKey } from '@/utils/date';
import { logger } from '@/lib/logger';

export function useCheckIn() {
  const [todayCheckIn, setTodayCheckIn] = useState<DailyCheckIn | null>(null);
  /** Most recent check-in regardless of date — used for "last commitment" display. */
  const [lastCheckIn, setLastCheckIn] = useState<DailyCheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  // Recompute todayKey when app comes to foreground (handles midnight crossover)
  const [todayKey, setTodayKey] = useState(() => getTodayKey());
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const key = getTodayKey();
        setTodayKey((prev) => (prev !== key ? key : prev));
      }
    });
    return () => sub.remove();
  }, []);

  /** Fetch today's check-in and the most recent check-in from the database. */
  const refresh = useCallback(async () => {
    try {
      const [checkIn, recent] = await Promise.all([
        getCheckInForDate(todayKey),
        getMostRecentCheckIn(),
      ]);
      setTodayCheckIn(checkIn);
      setLastCheckIn(recent);
    } catch (err) {
      logger.error('Failed to load check-in:', err);
    } finally {
      setLoading(false);
    }
  }, [todayKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Whether the user has already checked in today. */
  const hasCheckedIn = todayCheckIn !== null;

  /**
   * Save a new check-in for today.
   * Accepts multiple challenge/plan pairs for the reflection step.
   */
  const submitCheckIn = useCallback(
    async (
      commitmentType: CommitmentType,
      challengePairs: Array<{ challenge: string; plan: string }>
    ): Promise<DailyCheckIn> => {
      // Combine challenge/plan pairs into single strings for storage
      const challenge = challengePairs.map((p) => p.challenge.trim()).filter(Boolean).join('\n---\n');
      const plan = challengePairs.map((p) => p.plan.trim()).filter(Boolean).join('\n---\n');
      const todoText = buildTodoText(challengePairs);
      const checkIn: DailyCheckIn = {
        date: todayKey,
        commitmentType,
        challenge,
        plan,
        todoText,
        todoCompleted: false,
        createdAt: new Date().toISOString(),
      };
      await saveCheckIn(checkIn);
      setTodayCheckIn(checkIn);
      return checkIn;
    },
    [todayKey]
  );

  /** Toggle the TODO completed flag for today's check-in. */
  const toggleTodo = useCallback(async () => {
    if (!todayCheckIn) return;
    const next = !todayCheckIn.todoCompleted;
    await updateTodoCompleted(todayKey, next);
    setTodayCheckIn({ ...todayCheckIn, todoCompleted: next });
  }, [todayCheckIn, todayKey]);

  /** Reset (delete) today's check-in so the user can redo it. */
  const resetCheckIn = useCallback(async () => {
    await deleteCheckIn(todayKey);
    setTodayCheckIn(null);
  }, [todayKey]);

  return {
    todayCheckIn,
    lastCheckIn,
    hasCheckedIn,
    loading,
    refresh,
    submitCheckIn,
    toggleTodo,
    resetCheckIn,
  };
}
