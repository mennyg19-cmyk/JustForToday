import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { Habit } from '@/lib/database/schema';
import { formatDateKey, getTodayKey, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from '@/utils/date';
import { triggerSync } from '@/lib/sync';
import { getHabitsOrder } from '@/lib/settings';
import * as asyncHabits from '@/lib/database/asyncFallback/habits';

/**
 * Calculate current streak from history (consecutive days from today backwards)
 */
function calculateStreak(history: Record<string, boolean>): number {
  let streak = 0;
  const today = new Date();

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = formatDateKey(checkDate);

    if (history[dateKey]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate longest streak from history
 */
function calculateLongestStreak(history: Record<string, boolean>): number {
  const dates = Object.keys(history)
    .filter((date) => history[date])
    .sort();

  if (dates.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1] + 'T00:00:00');
    const currDate = new Date(dates[i] + 'T00:00:00');
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Calculate counts for a date range
 */
function calculateCounts(
  history: Record<string, boolean>,
  startDate: Date,
  endDate: Date
): number {
  let count = 0;
  const startKey = formatDateKey(startDate);
  const endKey = formatDateKey(endDate);

  for (const [dateKey, completed] of Object.entries(history)) {
    if (dateKey >= startKey && dateKey <= endKey && completed) {
      count++;
    }
  }

  return count;
}

/**
 * Get all habits with computed stats
 */
export async function getHabits(): Promise<Habit[]> {
  if (!(await isSQLiteAvailable())) {
    const order = await getHabitsOrder();
    return asyncHabits.getHabitsAsync(order);
  }
  const db = await getDatabase();

  // Get all habits
  const habitRows = await db.getAllAsync<{
    id: string;
    name: string;
    frequency: string;
    type: string;
    created_at: string;
    order_index: number;
    tracking_start_date: string | null;
  }>('SELECT * FROM habits ORDER BY order_index ASC, created_at ASC');

  // Get habit history — only for existing habits
  const habitIds = habitRows.map((h) => h.id);
  const historyRows = habitIds.length > 0
    ? await db.getAllAsync<{
        habit_id: string;
        date: string;
        completed: number;
      }>(`SELECT * FROM habit_history WHERE habit_id IN (${habitIds.map(() => '?').join(',')})`, habitIds)
    : [];

  // Group history by habit
  const historyByHabit: Record<string, Record<string, boolean>> = {};
  for (const row of historyRows) {
    if (!historyByHabit[row.habit_id]) {
      historyByHabit[row.habit_id] = {};
    }
    historyByHabit[row.habit_id][row.date] = row.completed === 1;
  }

  // Build habits with computed stats
  const today = new Date();
  const todayKey = getTodayKey();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(today);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekEnd);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
  const monthStart = getMonthStart(today);
  const monthEnd = getMonthEnd(today);
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(monthEnd);
  lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

  const habits: Habit[] = habitRows.map((row) => {
    const history = historyByHabit[row.id] || {};
    const streak = calculateStreak(history);
    const highScore = calculateLongestStreak(history);

    const createdDateKey = formatDateKey(new Date(row.created_at));
    return {
      id: row.id,
      name: row.name,
      frequency: row.frequency as 'daily' | 'weekly',
      type: row.type as 'build' | 'break',
      completedToday: history[todayKey] || false,
      currentStreak: streak,
      highScore,
      thisWeekCount: calculateCounts(history, weekStart, weekEnd),
      lastWeekCount: calculateCounts(history, lastWeekStart, lastWeekEnd),
      thisMonthCount: calculateCounts(history, monthStart, monthEnd),
      lastMonthCount: calculateCounts(history, lastMonthStart, lastMonthEnd),
      history,
      createdAt: row.created_at,
      trackingStartDate: row.tracking_start_date ?? createdDateKey,
    };
  });

  return habits;
}

/**
 * Create a new habit
 */
export async function createHabit(
  name: string,
  frequency: 'daily' | 'weekly',
  type: 'build' | 'break'
): Promise<Habit> {
  if (!(await isSQLiteAvailable())) {
    return asyncHabits.createHabitAsync(name, frequency, type);
  }
  const db = await getDatabase();
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  // Get max order_index
  const maxOrder = await db.getFirstAsync<{ max_order: number }>(
    'SELECT MAX(order_index) as max_order FROM habits'
  );
  const orderIndex = (maxOrder?.max_order ?? -1) + 1;

  // Insert habit
  await db.runAsync(
    'INSERT INTO habits (id, name, frequency, type, created_at, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, frequency, type, createdAt, orderIndex]
  );

  triggerSync();

  // Return the new habit
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === id);
  if (!habit) {
    throw new Error('Failed to create habit');
  }
  return habit;
}

export interface UpdateHabitInput {
  name?: string;
  trackingStartDate?: string; // YYYY-MM-DD
}

/**
 * Update habit name and/or tracking start date
 */
export async function updateHabit(habitId: string, updates: UpdateHabitInput): Promise<Habit> {
  if (!(await isSQLiteAvailable())) {
    return asyncHabits.updateHabitAsync(habitId, updates);
  }
  const db = await getDatabase();
  if (updates.name != null) {
    await db.runAsync('UPDATE habits SET name = ? WHERE id = ?', [updates.name.trim(), habitId]);
  }
  if (updates.trackingStartDate !== undefined) {
    await db.runAsync('UPDATE habits SET tracking_start_date = ? WHERE id = ?', [
      updates.trackingStartDate || null,
      habitId,
    ]);
  }
  triggerSync();
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) throw new Error('Habit not found');
  return habit;
}

/**
 * Toggle habit completion for a date
 */
export async function toggleHabitCompletion(habitId: string, date: string): Promise<Habit> {
  if (!(await isSQLiteAvailable())) {
    return asyncHabits.toggleHabitCompletionAsync(habitId, date);
  }
  const db = await getDatabase();

  // Check if entry exists
  const existing = await db.getFirstAsync<{ completed: number }>(
    'SELECT completed FROM habit_history WHERE habit_id = ? AND date = ?',
    [habitId, date]
  );

  const newCompleted = existing ? (existing.completed === 0 ? 1 : 0) : 1;

  if (existing) {
    // Update existing
    await db.runAsync(
      'UPDATE habit_history SET completed = ? WHERE habit_id = ? AND date = ?',
      [newCompleted, habitId, date]
    );
  } else {
    // Insert new
    await db.runAsync(
      'INSERT INTO habit_history (habit_id, date, completed) VALUES (?, ?, ?)',
      [habitId, date, newCompleted]
    );
  }

  triggerSync();

  // Return updated habit
  const habits = await getHabits();
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) {
    throw new Error('Habit not found');
  }
  return habit;
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncHabits.deleteHabitAsync(habitId);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM habit_history WHERE habit_id = ?', [habitId]);
  await db.runAsync('DELETE FROM habits WHERE id = ?', [habitId]);
  triggerSync();
}

/**
 * Update habit order
 */
export async function updateHabitOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncHabits.updateHabitOrderAsync(order);
    return;
  }
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < order.length; i++) {
      await db.runAsync('UPDATE habits SET order_index = ? WHERE id = ?', [i, order[i]]);
    }
  });

  triggerSync();
}
