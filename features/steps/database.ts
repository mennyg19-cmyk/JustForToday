import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import { triggerSync } from '@/lib/sync';
import * as asyncSteps from '@/lib/database/asyncFallback/steps';
import * as asyncWorkouts from '@/lib/database/asyncFallback/workouts';
import { getTodayKey } from '@/utils/date';
import type { Workout } from '@/lib/database/schema';

export async function getStepsForDate(dateKey: string): Promise<number> {
  if (!(await isSQLiteAvailable())) {
    return asyncSteps.getStepsForDateAsync(dateKey);
  }
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ steps_count: number }>(
    'SELECT steps_count FROM steps_data WHERE date = ?',
    [dateKey]
  );
  return row?.steps_count ?? 0;
}

export async function getTodayStepsCount(): Promise<number> {
  return getStepsForDate(getTodayKey());
}

export async function setStepsForDate(
  dateKey: string,
  stepsCount: number,
  source: 'healthkit' | 'manual'
): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSteps.setStepsForDateAsync(dateKey, stepsCount, source);
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO steps_data (date, steps_count, source) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET steps_count = ?, source = ?`,
    [dateKey, stepsCount, source, stepsCount, source]
  );
  triggerSync();
}

export interface StepsDayRecord {
  date: string;
  steps_count: number;
}

/** Get steps for multiple dates. Missing dates return 0. */
export async function getStepsForDates(dateKeys: string[]): Promise<StepsDayRecord[]> {
  if (dateKeys.length === 0) return [];
  if (!(await isSQLiteAvailable())) {
    return asyncSteps.getStepsForDatesAsync(dateKeys);
  }
  const db = await getDatabase();
  const placeholders = dateKeys.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ date: string; steps_count: number }>(
    `SELECT date, steps_count FROM steps_data WHERE date IN (${placeholders})`,
    dateKeys
  );
  const byDate = new Map(rows.map((r) => [r.date, r.steps_count]));
  return dateKeys.map((date) => ({
    date,
    steps_count: byDate.get(date) ?? 0,
  }));
}

// ——— Workouts (manual entries; HealthKit workouts are fetched live) ———

function rowToWorkout(r: {
  id: string;
  date: string;
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  source: 'healthkit' | 'manual';
}): Workout {
  return {
    id: r.id,
    date: r.date,
    activityName: r.activity_name,
    durationMinutes: r.duration_minutes,
    caloriesBurned: r.calories_burned,
    source: r.source,
  };
}

export async function getWorkoutsForDate(dateKey: string): Promise<Workout[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncWorkouts.getWorkoutsForDateAsync(dateKey);
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    activity_name: string;
    duration_minutes: number;
    calories_burned: number;
    source: 'healthkit' | 'manual';
  }>('SELECT * FROM workouts WHERE date = ? ORDER BY id DESC', [dateKey]);
  return rows.map(rowToWorkout);
}

export async function addWorkout(workout: Workout): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncWorkouts.addWorkoutAsync(workout);
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO workouts (id, date, activity_name, duration_minutes, calories_burned, source)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      workout.id,
      workout.date,
      workout.activityName,
      workout.durationMinutes,
      workout.caloriesBurned,
      workout.source,
    ]
  );
  triggerSync();
}

export async function deleteWorkout(id: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncWorkouts.deleteWorkoutAsync(id);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  triggerSync();
}
