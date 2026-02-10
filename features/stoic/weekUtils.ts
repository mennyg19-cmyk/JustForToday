import {
  getStoicWeekMode,
  getStoicStartDate,
} from '@/lib/settings/database';
import { getWeekStart } from '@/utils/date';

/** Week number 1–52 by calendar year (Week 1 = week containing Jan 1, Sun–Sat). */
export function getCalendarWeekNumber(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const week1Sunday = getWeekStart(jan1);
  const todaySunday = getWeekStart(date);
  const diffMs = todaySunday.getTime() - week1Sunday.getTime();
  const week = 1 + Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(52, week));
}

/** Week number 1–52 from a personal start date (Week 1 = week containing start date). */
export function getPersonalWeekNumber(date: Date, startDateKey: string): number {
  const start = new Date(startDateKey + 'T00:00:00');
  const week1Sunday = getWeekStart(start);
  const todaySunday = getWeekStart(date);
  const diffMs = todaySunday.getTime() - week1Sunday.getTime();
  const week = 1 + Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(52, week));
}

/** Current Stoic week number (1–52) based on user settings. */
export async function getStoicCurrentWeekNumber(): Promise<number> {
  const mode = await getStoicWeekMode();
  const today = new Date();
  if (mode === 'calendar') {
    return getCalendarWeekNumber(today);
  }
  const startDate = await getStoicStartDate();
  if (!startDate) {
    return getCalendarWeekNumber(today);
  }
  return getPersonalWeekNumber(today, startDate);
}
