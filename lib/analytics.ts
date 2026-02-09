import { getHabits } from '@/features/habits/database';
import { getStepsForDates } from '@/features/steps/database';
import { getWorkoutsForDates } from '@/features/steps/database';
import { getInventoryEntries } from '@/features/inventory/database';
import { getGratitudeEntries } from '@/features/gratitude/database';
import { getFastingHoursForDates } from '@/features/fasting/database';
import { getSobrietyCounters } from '@/features/sobriety/database';
import { getStoicReflectionDoneForDates } from '@/features/stoic/database';
import { getGoals } from '@/lib/settings';
import { getAppVisibility, getModuleSettings } from '@/lib/settings/database';
import type { AppVisibility, ModuleId, ModuleSettingsMap } from '@/lib/database/schema';
import { getDateKeysForLastDays, formatDateKey } from '@/utils/date';

function isDateInTrackingRange(
  dateKey: string,
  moduleId: ModuleId,
  moduleSettings: ModuleSettingsMap
): boolean {
  const start = moduleSettings[moduleId]?.trackingStartDate;
  if (!start) return true;
  return dateKey >= start;
}

export interface DayScore {
  dateKey: string;
  score: number; // 0–100
  /** True when this day is before the earliest tracking start date across visible modules (show grey in heatmaps). */
  beforeTrackingStart: boolean;
  habitsPct: number;
  stepsPct: number;
  invPct: number;
  gratitudePct: number;
  fastingPct: number;
  workoutsPct: number;
  sobrietyPct: number;
  stoicPct: number;
  habitsCompleted: number;
  habitsTotal: number;
  stepsCount: number;
  stepsGoal: number;
  inventoryCount: number;
  inventoriesGoal: number;
  gratitudeCount: number;
  gratitudesGoal: number;
  fastingHours: number;
  fastingGoal: number;
  workoutsCount: number;
  workoutsGoal: number;
  sobrietyTracked: number;
  sobrietyTotal: number;
  stoicDone: boolean;
}

/**
 * Compute daily score from enabled modules only (visibility). Each area contributes 0–100%;
 * score is the average of visible areas. Missing goals / no trackers count as 100%.
 */
export async function getDailyScoresForLastDays(days: number): Promise<DayScore[]> {
  const dateKeys = getDateKeysForLastDays(days);
  const [
    visibility,
    moduleSettings,
    habits,
    stepsRecords,
    inventoryEntries,
    gratitudeEntries,
    fastingHoursPerDay,
    workoutsByDate,
    sobrietyCounters,
    goals,
    stoicDoneByDate,
  ] = await Promise.all([
    getAppVisibility(),
    getModuleSettings(),
    getHabits(),
    getStepsForDates(dateKeys),
    getInventoryEntries(),
    getGratitudeEntries(),
    getFastingHoursForDates(dateKeys),
    getWorkoutsForDates(dateKeys),
    getSobrietyCounters(),
    getGoals(),
    getStoicReflectionDoneForDates(dateKeys),
  ]);

  const habitsTotal = Math.max(1, habits.length);
  const stepsGoal = Math.max(1, goals.stepsGoal);
  const invGoal = Math.max(1, goals.inventoriesPerDayGoal);
  const gratGoal = Math.max(1, goals.gratitudesPerDayGoal);
  const fastingGoal = Math.max(1, goals.fastingHoursGoal);
  const workoutsGoal = Math.max(1, goals.workoutsGoal);
  const sobrietyTotal = Math.max(1, sobrietyCounters.length);

  const stepsByDate = new Map(stepsRecords.map((r) => [r.date, r.steps_count]));
  const invCountByDate = new Map<string, number>();
  for (const e of inventoryEntries) {
    const key = e.createdAt.slice(0, 10);
    invCountByDate.set(key, (invCountByDate.get(key) ?? 0) + 1);
  }
  const gratCountByDate = new Map<string, number>();
  for (const e of gratitudeEntries) {
    const key = e.createdAt.slice(0, 10);
    gratCountByDate.set(key, (gratCountByDate.get(key) ?? 0) + 1);
  }
  const fastingByDate = new Map(dateKeys.map((k, i) => [k, fastingHoursPerDay[i] ?? 0]));
  const workoutsCountByDate = new Map(
    dateKeys.map((k, i) => [k, (workoutsByDate[i] ?? []).length])
  );
  const sobrietyTrackedByDate = new Map<string, number>();
  for (const c of sobrietyCounters) {
    for (const [dateKey, tracked] of Object.entries(c.allHistory)) {
      if (tracked) {
        sobrietyTrackedByDate.set(dateKey, (sobrietyTrackedByDate.get(dateKey) ?? 0) + 1);
      }
    }
  }

  const habitsGoal = goals.habitsGoal > 0 ? goals.habitsGoal : habitsTotal;

  // Earliest tracking start among visible modules (YYYY-MM-DD); null if none set
  const visibilityKeys = (Object.keys(visibility) as ModuleId[]).filter((k) => visibility[k]);
  let earliestStart: string | null = null;
  for (const mid of visibilityKeys) {
    const start = moduleSettings[mid]?.trackingStartDate;
    if (start && (earliestStart == null || start < earliestStart)) {
      earliestStart = start;
    }
  }

  return dateKeys.map((dateKey) => {
    const habitsCompleted = habits.filter((h) => h.history[dateKey]).length;
    const habitsPct = habitsGoal > 0 ? Math.min(100, (habitsCompleted / habitsGoal) * 100) : 100;
    const stepsCount = stepsByDate.get(dateKey) ?? 0;
    const stepsPct = Math.min(100, (stepsCount / stepsGoal) * 100);
    const inventoryCount = invCountByDate.get(dateKey) ?? 0;
    const invPct = Math.min(100, (inventoryCount / invGoal) * 100);
    const gratitudeCount = gratCountByDate.get(dateKey) ?? 0;
    const gratitudePct = Math.min(100, (gratitudeCount / gratGoal) * 100);
    const fastingHours = fastingByDate.get(dateKey) ?? 0;
    const fastingPct = Math.min(100, (fastingHours / fastingGoal) * 100);
    const workoutsCount = workoutsCountByDate.get(dateKey) ?? 0;
    const workoutsPct = Math.min(100, (workoutsCount / workoutsGoal) * 100);
    const sobrietyTracked = sobrietyTrackedByDate.get(dateKey) ?? 0;
    const sobrietyPct =
      sobrietyTotal > 0 ? (sobrietyTracked / sobrietyTotal) * 100 : 100;
    const stoicDone = stoicDoneByDate.get(dateKey) ?? false;
    const stoicPct = stoicDone ? 100 : 0;

    const count = (id: keyof ModuleSettingsMap) => moduleSettings[id]?.countInScore !== false;
    const parts: number[] = [];
    if (visibility.habits && count('habits') && isDateInTrackingRange(dateKey, 'habits', moduleSettings)) parts.push(habitsPct);
    if (visibility.steps && count('steps') && isDateInTrackingRange(dateKey, 'steps', moduleSettings)) parts.push(stepsPct);
    if (visibility.inventory && count('inventory') && isDateInTrackingRange(dateKey, 'inventory', moduleSettings)) parts.push(invPct);
    if (visibility.gratitude && count('gratitude') && isDateInTrackingRange(dateKey, 'gratitude', moduleSettings)) parts.push(gratitudePct);
    if (visibility.fasting && count('fasting') && isDateInTrackingRange(dateKey, 'fasting', moduleSettings)) parts.push(fastingPct);
    if (visibility.workouts && count('workouts') && isDateInTrackingRange(dateKey, 'workouts', moduleSettings)) parts.push(workoutsPct);
    if (visibility.sobriety && count('sobriety') && isDateInTrackingRange(dateKey, 'sobriety', moduleSettings)) parts.push(sobrietyPct);
    if (visibility.stoic && count('stoic') && isDateInTrackingRange(dateKey, 'stoic', moduleSettings) && stoicDone) parts.push(stoicPct);

    const beforeTrackingStart =
      earliestStart != null && dateKey < earliestStart;

    // Do not count days before tracking start: score 0 and they're excluded from averages
    const score =
      beforeTrackingStart
        ? 0
        : parts.length > 0
          ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
          : 0;

    return {
      dateKey,
      score: Math.min(100, score),
      beforeTrackingStart,
      habitsPct,
      stepsPct,
      invPct,
      gratitudePct,
      fastingPct,
      workoutsPct,
      sobrietyPct,
      stoicPct,
      habitsCompleted,
      habitsTotal,
      stepsCount,
      stepsGoal,
      inventoryCount,
      inventoriesGoal: invGoal,
      gratitudeCount,
      gratitudesGoal: gratGoal,
      fastingHours,
      fastingGoal: goals.fastingHoursGoal,
      workoutsCount,
      workoutsGoal: goals.workoutsGoal,
      sobrietyTracked,
      sobrietyTotal,
      stoicDone,
    };
  });
}

export interface WeekScore {
  dateKey: string; // week start (Sunday) YYYY-MM-DD
  score: number;
  label: string;
}

/** Weekly average score for the last N weeks (each week Sun–Sat). */
export async function getWeeklyScoresForLastWeeks(
  weeks: number
): Promise<WeekScore[]> {
  const dayScores = await getDailyScoresForLastDays(weeks * 7 + 7);
  const byWeek = new Map<string, number[]>();
  for (const d of dayScores) {
    const date = new Date(d.dateKey + 'T00:00:00');
    const sun = new Date(date);
    sun.setDate(date.getDate() - date.getDay());
    const weekKey = formatDateKey(sun);
    if (!byWeek.has(weekKey)) byWeek.set(weekKey, []);
    byWeek.get(weekKey)!.push(d.score);
  }
  const sortedKeys = Array.from(byWeek.keys()).sort();
  return sortedKeys.slice(-weeks).map((dateKey) => {
    const scores = byWeek.get(dateKey)!;
    const score = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    const d = new Date(dateKey + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    return { dateKey, score: Math.min(100, score), label };
  });
}

export interface MonthScore {
  dateKey: string; // first day of month YYYY-MM-DD
  score: number;
  label: string;
}

/** Monthly average score for the last N months. */
export async function getMonthlyScoresForLastMonths(
  months: number
): Promise<MonthScore[]> {
  const allScores = await getDailyScoresForLastDays(400);
  const byMonth = new Map<string, number[]>();
  for (const d of allScores) {
    const monthKey = d.dateKey.slice(0, 7) + '-01'; // YYYY-MM-01
    if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
    byMonth.get(monthKey)!.push(d.score);
  }
  const sortedKeys = Array.from(byMonth.keys()).sort();
  return sortedKeys.slice(-months).map((dateKey) => {
    const scores = byMonth.get(dateKey)!;
    const score =
      scores.length > 0
        ? Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          )
        : 0;
    const d = new Date(dateKey + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { dateKey, score: Math.min(100, score), label };
  });
}

export interface Suggestion {
  id: string;
  label: string;
  avgPct: number;
  message: string;
}

/** Suggest what to work on based on recent daily scores (lowest averages first). Only includes visible modules. */
export function getSuggestionsFromScores(
  dayScores: DayScore[],
  visibility: AppVisibility
): Suggestion[] {
  if (dayScores.length === 0) return [];
  const n = dayScores.length;
  const sum = (key: keyof DayScore) =>
    dayScores.reduce((a, d) => a + (typeof d[key] === 'number' ? (d[key] as number) : 0), 0);
  const areas: { id: string; label: string; avgPct: number; visible: boolean }[] = [
    { id: 'habits', label: 'Habits', avgPct: sum('habitsPct') / n, visible: visibility.habits },
    { id: 'steps', label: 'Steps', avgPct: sum('stepsPct') / n, visible: visibility.steps },
    { id: 'inventory', label: 'Inventory', avgPct: sum('invPct') / n, visible: visibility.inventory },
    { id: 'gratitude', label: 'Gratitude', avgPct: sum('gratitudePct') / n, visible: visibility.gratitude },
    { id: 'fasting', label: 'Fasting', avgPct: sum('fastingPct') / n, visible: visibility.fasting },
    { id: 'workouts', label: 'Exercise', avgPct: sum('workoutsPct') / n, visible: visibility.workouts },
    { id: 'sobriety', label: 'Sobriety', avgPct: sum('sobrietyPct') / n, visible: visibility.sobriety },
    { id: 'daily_renewal', label: 'Daily Renewal', avgPct: sum('sobrietyPct') / n, visible: visibility.daily_renewal },
    { id: 'stoic', label: 'Stoic Handbook', avgPct: sum('stoicPct') / n, visible: visibility.stoic },
  ];
  const sorted = areas
    .filter((a) => a.visible && a.avgPct < 100)
    .sort((a, b) => a.avgPct - b.avgPct);
  return sorted.map((a) => ({
    id: a.id,
    label: a.label,
    avgPct: Math.round(a.avgPct),
    message:
      a.avgPct < 50
        ? `Focus here — you're at ${Math.round(a.avgPct)}% on average`
        : `Room to improve — ${Math.round(a.avgPct)}% average`,
  }));
}
