/**
 * Shared fasting helpers: duration formatting and hour calculations.
 */

/**
 * Hours between two ISO date strings (end - start). Uses real time diff.
 */
export function hoursBetween(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return (end - start) / (1000 * 60 * 60);
}

/**
 * Hours from startAt until now (for active fast).
 */
export function hoursSince(startAt: string): number {
  return hoursBetween(startAt, new Date().toISOString());
}

/**
 * Format hours as "Xh Ym" or "Xh" if no remainder minutes.
 * Used for display; tracks down to the minute.
 */
export function formatDurationHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Total minutes between two ISO date strings (floored).
 */
export function minutesBetween(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return Math.floor((end - start) / (1000 * 60));
}

/**
 * Total minutes from startAt until now (for active fast).
 */
export function minutesSince(startAt: string): number {
  return minutesBetween(startAt, new Date().toISOString());
}

/**
 * Format duration from total minutes as "Xh Ym" (tracked to the minute).
 */
export function formatDurationMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Total seconds between two ISO date strings (floored).
 */
export function secondsBetween(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  return Math.floor((end - start) / 1000);
}

/**
 * Total seconds from startAt until now (for live timer).
 */
export function secondsSince(startAt: string): number {
  return secondsBetween(startAt, new Date().toISOString());
}

/**
 * Format total seconds as "Xh Ym Zs" for live timer (updates every second).
 */
export function formatDurationSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Format an ISO date string for display: "Feb 3, 2025, 8:30 AM".
 */
export function formatDateTimeDisplay(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

/**
 * Format time only: "8:30 AM".
 */
export function formatTimeDisplay(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Whether an ISO date string is on the given calendar day (local date).
 */
export function isOnDate(isoDate: string, year: number, month: number, day: number): boolean {
  const d = new Date(isoDate);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}

/**
 * Today's date parts for comparison.
 */
export function getTodayParts(): { year: number; month: number; day: number } {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth(), day: t.getDate() };
}
