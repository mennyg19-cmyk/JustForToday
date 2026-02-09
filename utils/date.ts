/**
 * Date formatting and manipulation utilities
 */

/**
 * Format a date as YYYY-MM-DD for database keys
 */
export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date key (YYYY-MM-DD) back to a Date object
 */
export function parseDateKey(dateKey: string): Date {
  return new Date(dateKey + 'T00:00:00');
}

/**
 * Get today's date key
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Format date for display (e.g., "Jan 15, 2024")
 */
export function formatDateDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for short display (e.g., "Jan 15")
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with weekday for display (e.g., "Mon, Jan 6")
 */
export function formatDateWithWeekday(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const short = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${weekday}, ${short}`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get start of week (Sunday) for a given date
 */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get end of week (Saturday) for a given date
 */
export function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

/**
 * Get start of month for a given date
 */
export function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month for a given date
 */
export function getMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get days in a month
 */
export function getDaysInMonth(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Get starting day of week for a month (0 = Sunday, 6 = Saturday)
 */
export function getMonthStartDay(date: Date = new Date()): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

/**
 * Get date keys (YYYY-MM-DD) for the last N days including today
 */
export function getDateKeysForLastDays(days: number): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < days; i++) {
    keys.push(formatDateKey(d));
    d.setDate(d.getDate() - 1);
  }
  return keys;
}
