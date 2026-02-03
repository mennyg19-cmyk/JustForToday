import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import {
  getTodayStepsCount,
  getStepsForDates,
  setStepsForDate,
  getWorkoutsForDate,
  addWorkout,
  deleteWorkout,
} from '../database';
import type { StepsDayRecord } from '../database';
import { CALORIES_PER_STEP_ESTIMATE } from '../constants';
import { getGoals } from '@/lib/settings';
import { getTodayKey, getDateKeysForLastDays } from '@/utils/date';
import type { Workout } from '@/lib/database/schema';
import * as HealthKit from '@/lib/healthKit';

const RECENT_DAYS = 7;

export interface RecentStepsDay extends StepsDayRecord {
  isToday: boolean;
}

export type ActiveCaloriesSource = 'healthkit' | 'estimated' | null;

export function useSteps() {
  const [stepsToday, setStepsToday] = useState<number>(0);
  const [stepsGoal, setStepsGoal] = useState<number>(10000);
  const [recentDays, setRecentDays] = useState<RecentStepsDay[]>([]);
  const [workoutsToday, setWorkoutsToday] = useState<Workout[]>([]);
  const [activeCaloriesToday, setActiveCaloriesToday] = useState<number>(0);
  const [activeCaloriesSource, setActiveCaloriesSource] = useState<ActiveCaloriesSource>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const dateKeys = getDateKeysForLastDays(RECENT_DAYS);
      const todayKey = getTodayKey();
      const [count, goals, dayRecords, manualWorkouts] = await Promise.all([
        getTodayStepsCount(),
        getGoals(),
        getStepsForDates(dateKeys),
        getWorkoutsForDate(todayKey),
      ]);
      setStepsToday(count);
      setStepsGoal(goals.stepsGoal);
      setRecentDays(
        dayRecords.map((r) => ({
          ...r,
          isToday: r.date === todayKey,
        }))
      );

      let healthKitWorkouts: Workout[] = [];
      let activeKcal: number | null = null;

      if (Platform.OS === 'ios') {
        try {
          const granted = await HealthKit.requestFitnessPermissions();
          if (granted) {
            const [hkWorkouts, energy] = await Promise.all([
              HealthKit.getWorkoutsForDate(new Date()),
              HealthKit.getActiveEnergyForDate(new Date()),
            ]);
            healthKitWorkouts = hkWorkouts.map((w) => ({
              id: w.id,
              date: todayKey,
              activityName: w.activityName,
              durationMinutes: w.durationMinutes,
              caloriesBurned: w.calories,
              source: 'healthkit' as const,
            }));
            activeKcal = energy;
          }
        } catch {
          // Permission denied or HealthKit unavailable – keep defaults
        }
      }

      const combined = [...healthKitWorkouts, ...manualWorkouts];
      setWorkoutsToday(combined);

      if (activeKcal !== null) {
        setActiveCaloriesToday(activeKcal);
        setActiveCaloriesSource('healthkit');
      } else if (count > 0) {
        const estimated = Math.round(count * CALORIES_PER_STEP_ESTIMATE);
        setActiveCaloriesToday(estimated);
        setActiveCaloriesSource('estimated');
      } else {
        setActiveCaloriesToday(0);
        setActiveCaloriesSource(null);
      }
    } catch (err) {
      console.error('Failed to load steps:', err);
      setError(err instanceof Error ? err.message : 'Failed to load steps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setManualSteps = useCallback(async (count: number, dateKey?: string) => {
    const key = dateKey ?? getTodayKey();
    await setStepsForDate(key, count, 'manual');
    if (key === getTodayKey()) {
      setStepsToday(count);
    }
    await refresh();
  }, [refresh]);

  const addManualWorkout = useCallback(
    async (activityName: string, durationMinutes: number, caloriesBurned: number) => {
      const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const workout: Workout = {
        id,
        date: getTodayKey(),
        activityName,
        durationMinutes,
        caloriesBurned,
        source: 'manual',
      };
      await addWorkout(workout);
      await refresh();
    },
    [refresh]
  );

  const removeWorkout = useCallback(
    async (id: string) => {
      await deleteWorkout(id);
      await refresh();
    },
    [refresh]
  );

  const syncFromHealthKit = useCallback(
    async (onPermissionDenied?: (message: string) => void, onSyncFailed?: (message: string) => void) => {
      setSyncing(true);
      try {
        const granted = await HealthKit.requestFitnessPermissions();
        if (!granted) {
          const msg = 'HealthKit permission denied';
          if (onPermissionDenied) onPermissionDenied(msg);
          else setError(msg);
          return;
        }
        const todayKey = getTodayKey();
        const [count, hkWorkouts, energy] = await Promise.all([
          HealthKit.getStepsForDate(new Date()),
          HealthKit.getWorkoutsForDate(new Date()),
          HealthKit.getActiveEnergyForDate(new Date()),
        ]);
        if (count !== null) {
          await setStepsForDate(todayKey, count, 'healthkit');
          setStepsToday(count);
        }
        setWorkoutsToday([
          ...hkWorkouts.map((w) => ({
            id: w.id,
            date: todayKey,
            activityName: w.activityName,
            durationMinutes: w.durationMinutes,
            caloriesBurned: w.calories,
            source: 'healthkit' as const,
          })),
          ...(await getWorkoutsForDate(todayKey)).filter((w) => w.source === 'manual'),
        ]);
        if (energy !== null) {
          setActiveCaloriesToday(energy);
          setActiveCaloriesSource('healthkit');
        } else if (count !== null && count > 0) {
          setActiveCaloriesToday(Math.round(count * CALORIES_PER_STEP_ESTIMATE));
          setActiveCaloriesSource('estimated');
        }
        await refresh();
      } catch (err) {
        console.error('HealthKit sync failed:', err);
        const msg = err instanceof Error ? err.message : 'Sync failed';
        if (onSyncFailed) onSyncFailed(msg);
        else setError(msg);
      } finally {
        setSyncing(false);
      }
    },
    [refresh]
  );

  return {
    stepsToday,
    stepsGoal,
    recentDays,
    workoutsToday,
    activeCaloriesToday,
    activeCaloriesSource,
    loading,
    error,
    syncing,
    refresh,
    setManualSteps,
    addManualWorkout,
    removeWorkout,
    syncFromHealthKit,
  };
}
