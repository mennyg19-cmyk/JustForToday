/**
 * Comparison and trend calculation utilities
 */

export type Trend = 'up' | 'down' | 'same';

export interface TrendResult {
  percent: number;
  trend: Trend;
}

/**
 * Calculate percentage change and trend between two values
 */
export function calculateTrend(current: number, previous: number): TrendResult {
  if (previous === 0) {
    return { percent: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'same' };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  const absPercent = Math.abs(percent);

  return {
    percent: absPercent,
    trend: percent > 0 ? 'up' : percent < 0 ? 'down' : 'same',
  };
}

/**
 * Calculate week-over-week comparison
 */
export function compareWeeks(thisWeek: number, lastWeek: number): TrendResult {
  return calculateTrend(thisWeek, lastWeek);
}

/**
 * Calculate month-over-month comparison
 */
export function compareMonths(thisMonth: number, lastMonth: number): TrendResult {
  return calculateTrend(thisMonth, lastMonth);
}
