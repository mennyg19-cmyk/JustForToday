import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import * as habitsDb from '../database';
import { getHabitsOrder, saveHabitsOrder } from '@/lib/settings';
import { sortByOrder } from '@/utils/sorting';
import { getTodayKey } from '@/utils/date';
import type { Habit } from '../types';
import { logger } from '@/lib/logger';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [habitsData, orderData] = await Promise.all([
        habitsDb.getHabits(),
        getHabitsOrder(),
      ]);

      // Apply order if it exists
      const orderedHabits = orderData.length > 0 ? sortByOrder(habitsData, orderData) : habitsData;

      setHabits(orderedHabits);
      setOrder(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load habits';
      setError(errorMessage);
      logger.error('Failed to load habits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const toggleHabit = useCallback(
    async (habitId: string, date?: string) => {
      try {
        const dateKey = date || getTodayKey();
        const updated = await habitsDb.toggleHabitCompletion(habitId, dateKey);
        setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
      } catch (err) {
        logger.error('Failed to toggle habit:', err);
        throw err;
      }
    },
    []
  );

  const addHabit = useCallback(
    async (name: string, frequency: 'daily' | 'weekly', type: 'build' | 'break') => {
      try {
        const newHabit = await habitsDb.createHabit(name, frequency, type);
        setHabits((prev) => [...prev, newHabit]);
        return newHabit;
      } catch (err) {
        logger.error('Failed to add habit:', err);
        throw err;
      }
    },
    []
  );

  const deleteHabit = useCallback(async (habitId: string) => {
    try {
      await habitsDb.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setOrder((prev) => prev.filter((id) => id !== habitId));
    } catch (err) {
      logger.error('Failed to delete habit:', err);
      throw err;
    }
  }, []);

  const updateHabit = useCallback(
    async (habitId: string, updates: { name?: string; trackingStartDate?: string }) => {
      try {
        const updated = await habitsDb.updateHabit(habitId, updates);
        setHabits((prev) => prev.map((h) => (h.id === habitId ? updated : h)));
        return updated;
      } catch (err) {
        logger.error('Failed to update habit:', err);
        throw err;
      }
    },
    []
  );

  const reorderHabits = useCallback(
    async (newOrder: string[]) => {
      try {
        setOrder(newOrder);
        await saveHabitsOrder(newOrder);
        await habitsDb.updateHabitOrder(newOrder);
        // Reload to get updated order_index
        await loadHabits();
      } catch (err) {
        // Revert on error
        await loadHabits();
        logger.error('Failed to reorder habits:', err);
        throw err;
      }
    },
    [loadHabits]
  );

  const completedCount = useMemo(() => habits.filter((h) => h.completedToday).length, [habits]);
  const totalCount = useMemo(() => habits.length, [habits]);
  const allCompleted = useMemo(
    () => completedCount === totalCount && totalCount > 0,
    [completedCount, totalCount]
  );

  const orderedHabits = useMemo(
    () => (order.length > 0 ? sortByOrder(habits, order) : habits),
    [habits, order]
  );

  return {
    habits: orderedHabits,
    loading,
    error,
    toggleHabit,
    addHabit,
    deleteHabit,
    updateHabit,
    reorderHabits,
    refetch: loadHabits,
    completedCount,
    totalCount,
    allCompleted,
  };
}
