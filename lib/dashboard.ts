import { getHabits } from '@/features/habits/database';
import { getSobrietyCounters } from '@/features/sobriety/database';
import { getInventoryEntries } from '@/features/inventory/database';
import { getGratitudeEntries } from '@/features/gratitude/database';
import { getFastingHoursToday } from '@/features/fasting/database';
import { getTodayStepsCount } from '@/features/steps/database';
import { getGoals } from '@/lib/settings';

export interface DashboardData {
  habitsCompleted: number;
  habitsTotal: number;
  hasHabits: boolean;
  sobrietyDays: number;
  hasSobrietyCounters: boolean;
  fastingHours: number;
  fastingHoursGoal: number;
  inventoryCount: number;
  inventoriesPerDayGoal: number;
  stepsCount: number;
  stepsGoal: number;
  gratitudeCount: number;
}

function daysSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const today = new Date();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

export async function getDashboardData(): Promise<DashboardData> {
  const [habits, goals, sobrietyCounters, inventoryEntries, gratitudeEntries, fastingHours, stepsCount] =
    await Promise.all([
      getHabits(),
      getGoals(),
      getSobrietyCounters(),
      getInventoryEntries(),
      getGratitudeEntries(),
      getFastingHoursToday(),
      getTodayStepsCount(),
    ]);

  const habitsCompleted = habits.filter((h) => h.completedToday).length;
  const habitsTotal = habits.length;
  const sobrietyDays =
    sobrietyCounters.length > 0
      ? Math.max(
          ...sobrietyCounters.map((c) => daysSince(c.currentStreakStart))
        )
      : 0;
  const inventoryCount = inventoryEntries.filter((e) =>
    isToday(e.createdAt)
  ).length;

  return {
    habitsCompleted,
    habitsTotal,
    hasHabits: habits.length > 0,
    sobrietyDays,
    hasSobrietyCounters: sobrietyCounters.length > 0,
    fastingHours: Math.round(fastingHours * 10) / 10,
    fastingHoursGoal: goals.fastingHoursGoal,
    inventoryCount,
    inventoriesPerDayGoal: goals.inventoriesPerDayGoal,
    stepsCount,
    stepsGoal: goals.stepsGoal,
    gratitudeCount: gratitudeEntries.length,
  };
}
