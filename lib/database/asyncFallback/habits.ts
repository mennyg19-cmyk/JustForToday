import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from '@/lib/database/schema';
import { formatDateKey, getTodayKey, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from '@/utils/date';

const HABITS_KEY = 'lifetrack_habits';

type StoredHabit = Pick<Habit, 'id' | 'name' | 'frequency' | 'type' | 'history' | 'createdAt'> & {
  trackingStartDate?: string;
};

function calculateStreak(history: Record<string, boolean>): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = formatDateKey(checkDate);
    if (history[dateKey]) streak++;
    else break;
  }
  return streak;
}

function calculateLongestStreak(history: Record<string, boolean>): number {
  const dates = Object.keys(history).filter((d) => history[d]).sort();
  if (dates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

function calculateCounts(
  history: Record<string, boolean>,
  startDate: Date,
  endDate: Date
): number {
  const startKey = formatDateKey(startDate);
  const endKey = formatDateKey(endDate);
  let count = 0;
  for (const [dateKey, completed] of Object.entries(history)) {
    if (dateKey >= startKey && dateKey <= endKey && completed) count++;
  }
  return count;
}

function toHabit(row: StoredHabit, _orderIndex: number): Habit {
  const history = row.history || {};
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

  const streak = calculateStreak(history);
  const highScore = calculateLongestStreak(history);

  const createdDateKey = formatDateKey(new Date(row.createdAt));
  return {
    ...row,
    completedToday: history[todayKey] || false,
    currentStreak: streak,
    highScore,
    thisWeekCount: calculateCounts(history, weekStart, weekEnd),
    lastWeekCount: calculateCounts(history, lastWeekStart, lastWeekEnd),
    thisMonthCount: calculateCounts(history, monthStart, monthEnd),
    lastMonthCount: calculateCounts(history, lastMonthStart, lastMonthEnd),
    history,
    trackingStartDate: row.trackingStartDate ?? createdDateKey,
  };
}

async function getStoredHabits(): Promise<StoredHabit[]> {
  const data = await AsyncStorage.getItem(HABITS_KEY);
  return data ? JSON.parse(data) : [];
}

async function saveStoredHabits(habits: StoredHabit[]): Promise<void> {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export async function getHabitsAsync(order: string[]): Promise<Habit[]> {
  const stored = await getStoredHabits();
  const orderMap = new Map(order.map((id, i) => [id, i]));
  const sorted =
    order.length > 0
      ? [...stored].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
      : stored;
  return sorted.map((row, i) => toHabit(row, i));
}

export async function createHabitAsync(
  name: string,
  frequency: 'daily' | 'weekly',
  type: 'build' | 'break'
): Promise<Habit> {
  const stored = await getStoredHabits();
  const newOne: StoredHabit = {
    id: Date.now().toString(),
    name,
    frequency,
    type,
    history: {},
    createdAt: new Date().toISOString(),
  };
  stored.push(newOne);
  await saveStoredHabits(stored);
  return toHabit(newOne, stored.length - 1);
}

export async function toggleHabitCompletionAsync(habitId: string, date: string): Promise<Habit> {
  const stored = await getStoredHabits();
  const habit = stored.find((h) => h.id === habitId);
  if (!habit) throw new Error('Habit not found');
  habit.history = habit.history || {};
  habit.history[date] = !habit.history[date];
  await saveStoredHabits(stored);
  return toHabit(habit, 0);
}

export async function deleteHabitAsync(habitId: string): Promise<void> {
  const stored = await getStoredHabits();
  const filtered = stored.filter((h) => h.id !== habitId);
  await saveStoredHabits(filtered);
}

export async function updateHabitOrderAsync(_order: string[]): Promise<void> {
  // Order is persisted in settings (getHabitsOrder/saveHabitsOrder). Nothing to store here.
  // Habits are re-ordered when we getHabits(order).
}

export async function updateHabitAsync(
  habitId: string,
  updates: { name?: string; trackingStartDate?: string }
): Promise<Habit> {
  const stored = await getStoredHabits();
  const habit = stored.find((h) => h.id === habitId);
  if (!habit) throw new Error('Habit not found');
  if (updates.name != null) habit.name = updates.name.trim();
  if (updates.trackingStartDate !== undefined) habit.trackingStartDate = updates.trackingStartDate || undefined;
  await saveStoredHabits(stored);
  return toHabit(habit, 0);
}
