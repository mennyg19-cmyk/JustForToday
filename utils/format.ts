/**
 * Format numbers for dashboard: >= 1000 shown as 1k, 1.5k, 9.5k, 10.2k (rounded to nearest hundred).
 * Under 1000 shown as-is.
 */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  const rounded = Math.round(n / 100) * 100;
  const value = rounded / 1000;
  return value % 1 === 0 ? `${value}k` : `${value.toFixed(1)}k`;
}

/**
 * Format steps left for badge: negative compact form, e.g. -9.5k. Zero stays "0".
 */
export function formatStepsLeft(stepsLeft: number): string {
  if (stepsLeft <= 0) return '0';
  return `-${formatCompact(stepsLeft)}`;
}

/**
 * Calculate a percentage score capped at a maximum value.
 */
export function scorePercent(value: number, goal: number, cap = 100): number {
  if (goal <= 0 || value < 0) return 0;
  return Math.min(cap, Math.round((value / goal) * 100));
}
