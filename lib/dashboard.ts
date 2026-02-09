import { getHabits } from '@/features/habits/database';
import { getSobrietyCounters } from '@/features/sobriety/database';
import { getInventoryEntries } from '@/features/inventory/database';
import { getGratitudeEntries } from '@/features/gratitude/database';
import { getFastingHoursToday } from '@/features/fasting/database';
import { getTodayStepsCount, getWorkoutsForDate } from '@/features/steps/database';
import { getStoicTodayReflectionDone } from '@/features/stoic/database';
import { getTodayKey } from '@/utils/date';
import { getGoals } from '@/lib/settings';

export interface DashboardData {
  habitsCompleted: number;
  habitsTotal: number;
  habitsGoal: number; // 0 = all habits count
  hasHabits: boolean;
  sobrietyDays: number;
  sobrietyTrackedToday: number;
  sobrietyTotal: number;
  hasSobrietyCounters: boolean;
  fastingHours: number;
  fastingHoursGoal: number;
  inventoryCount: number;
  inventoriesPerDayGoal: number;
  stepsCount: number;
  stepsGoal: number;
  workoutsCount: number;
  workoutsGoal: number;
  gratitudeCount: number;
  gratitudesPerDayGoal: number;
  stoicReflectionDoneToday: boolean;
  /** Daily Renewal: badge text "<renewed>/<total>" (e.g. "2/3"). */
  dailyRenewalCountdown: string;
  /** Number of addictions with an active (non-expired) 24h renewal. */
  dailyRenewalRenewed: number;
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
  const todayKey = getTodayKey();
  const [
    habits,
    goals,
    sobrietyCounters,
    inventoryEntries,
    gratitudeEntries,
    fastingHours,
    stepsCount,
    todayWorkouts,
    stoicReflectionDoneToday,
  ] = await Promise.all([
    getHabits(),
    getGoals(),
    getSobrietyCounters(),
    getInventoryEntries(),
    getGratitudeEntries(),
    getFastingHoursToday(),
    getTodayStepsCount(),
    getWorkoutsForDate(todayKey),
    getStoicTodayReflectionDone(),
  ]);
  const workoutsCount = todayWorkouts.length;

  const habitsCompleted = habits.filter((h) => h.completedToday).length;
  const habitsTotal = habits.length;
  const sobrietyDays =
    sobrietyCounters.length > 0
      ? Math.max(
          ...sobrietyCounters.map((c) => daysSince(c.currentStreakStart))
        )
      : 0;
  const sobrietyTrackedToday = sobrietyCounters.filter(
    (c) => c.allHistory[todayKey]
  ).length;
  const sobrietyTotal = sobrietyCounters.length;
  const inventoryCount = inventoryEntries.filter((e) =>
    isToday(e.createdAt)
  ).length;
  const gratitudeCount = gratitudeEntries.filter((e) =>
    isToday(e.createdAt)
  ).length;

  let dailyRenewalCountdown = '—';
  let dailyRenewalRenewed = 0;
  if (sobrietyCounters.length > 0) {
    const todayKey = getTodayKey();
    const total = sobrietyCounters.length;
    // Only count renewals made today (calendar day), not a timer still running from yesterday
    dailyRenewalRenewed = sobrietyCounters.filter((c) => {
      if (!c.lastDailyRenewal) return false;
      const renewalDateKey = c.lastDailyRenewal.slice(0, 10);
      return renewalDateKey === todayKey;
    }).length;
    dailyRenewalCountdown = `${dailyRenewalRenewed}/${total}`;
  }

  return {
    habitsCompleted,
    habitsTotal,
    habitsGoal: goals.habitsGoal,
    hasHabits: habits.length > 0,
    sobrietyDays,
    sobrietyTrackedToday,
    sobrietyTotal,
    hasSobrietyCounters: sobrietyCounters.length > 0,
    fastingHours: Math.round(fastingHours * 10) / 10,
    fastingHoursGoal: goals.fastingHoursGoal,
    inventoryCount,
    inventoriesPerDayGoal: goals.inventoriesPerDayGoal,
    stepsCount,
    stepsGoal: goals.stepsGoal,
    workoutsCount,
    workoutsGoal: goals.workoutsGoal,
    gratitudeCount,
    gratitudesPerDayGoal: goals.gratitudesPerDayGoal,
    stoicReflectionDoneToday,
    dailyRenewalCountdown,
    dailyRenewalRenewed,
  };
}
