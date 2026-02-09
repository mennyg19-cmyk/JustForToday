/**
 * AsyncStorage fallback for daily check-in data (used in Expo Go where SQLite is unavailable).
 * Mirrors the daily_checkins SQLite table with JSON serialization.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyCheckIn, CommitmentType } from '@/lib/database/schema';

const PREFIX = 'lifetrack_';
const KEY = PREFIX + 'daily_checkins';

/** Load all stored check-ins, keyed by date (YYYY-MM-DD). */
async function loadAll(): Promise<Record<string, DailyCheckIn>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, DailyCheckIn>;
  } catch {
    return {};
  }
}

async function saveAll(data: Record<string, DailyCheckIn>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function getCheckInForDateAsync(date: string): Promise<DailyCheckIn | null> {
  const all = await loadAll();
  return all[date] ?? null;
}

export async function saveCheckInAsync(checkIn: DailyCheckIn): Promise<void> {
  const all = await loadAll();
  all[checkIn.date] = checkIn;
  await saveAll(all);
}

export async function updateTodoCompletedAsync(date: string, completed: boolean): Promise<void> {
  const all = await loadAll();
  if (all[date]) {
    all[date].todoCompleted = completed;
    await saveAll(all);
  }
}

/** Delete a check-in for a given date. */
export async function deleteCheckInAsync(date: string): Promise<void> {
  const all = await loadAll();
  delete all[date];
  await saveAll(all);
}

/** Get the most recent check-in by date, or null if none. */
export async function getMostRecentCheckInAsync(): Promise<DailyCheckIn | null> {
  const all = await loadAll();
  const dates = Object.keys(all).sort().reverse();
  return dates.length > 0 ? all[dates[0]] : null;
}

/** Get all check-ins, sorted newest first. */
export async function getAllCheckInsAsync(): Promise<DailyCheckIn[]> {
  const all = await loadAll();
  return Object.keys(all)
    .sort()
    .reverse()
    .map((date) => all[date]);
}
