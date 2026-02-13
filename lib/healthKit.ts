/**
 * HealthKit integration via @kingstinct/react-native-healthkit.
 *
 * Supports the new React Native architecture (Nitro modules).
 * All functions are no-ops on non-iOS platforms or in Expo Go
 * (where Nitro modules are unavailable).
 */

import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

const isIOS = Platform.OS === 'ios';

// Lazy-load HealthKit — the native module crashes in Expo Go, so we
// resolve it once and cache the result. All functions below check this
// before calling into the native API.
let _hk: typeof import('@kingstinct/react-native-healthkit') | null = null;
let _hkResolved = false;

function getHK(): typeof import('@kingstinct/react-native-healthkit') | null {
  if (_hkResolved) return _hk;
  _hkResolved = true;
  try {
    _hk = require('@kingstinct/react-native-healthkit');
  } catch {
    logger.warn('HealthKit native module unavailable (Expo Go?)');
    _hk = null;
  }
  return _hk;
}

// HealthKit type identifiers
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount' as const;
const ACTIVE_ENERGY = 'HKQuantityTypeIdentifierActiveEnergyBurned' as const;
const WORKOUT_TYPE = 'HKWorkoutTypeIdentifier' as const;

/**
 * Request HealthKit permissions for steps, workouts, and active energy.
 * Returns true if authorization was requested (not necessarily granted —
 * iOS doesn't tell you the specific result).
 */
export const requestFitnessPermissions = async (): Promise<boolean> => {
  if (!isIOS) return false;
  const hk = getHK();
  if (!hk) return false;
  try {
    const available = hk.isHealthDataAvailable();
    if (!available) {
      throw new Error('HealthKit is not available on this device.');
    }
    const result = await hk.requestAuthorization({
      toRead: [STEP_COUNT, ACTIVE_ENERGY, WORKOUT_TYPE],
    });
    return result;
  } catch (err) {
    logger.error('Fitness permission request failed:', err);
    throw err;
  }
};

/** Diagnostic info for debugging HealthKit issues */
export function getHealthKitDiagnostics(): string {
  const parts: string[] = [];
  parts.push(`Platform: ${Platform.OS}`);
  const hk = getHK();
  if (isIOS && hk) {
    try {
      parts.push(`HealthKit available: ${hk.isHealthDataAvailable()}`);
    } catch {
      parts.push('HealthKit available: ERROR');
    }
  } else if (isIOS) {
    parts.push('HealthKit available: native module not loaded');
  }
  parts.push(`Library: @kingstinct/react-native-healthkit`);
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Data queries
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Workout as returned for display */
export interface HealthKitWorkout {
  id: string;
  activityName: string;
  calories: number;
  durationMinutes: number;
  start: string;
  end: string;
  source: 'healthkit';
}

export const getStepsForDate = async (date: Date): Promise<number | null> => {
  if (!isIOS) return null;
  const hk = getHK();
  if (!hk) return null;
  try {
    const result = await hk.queryStatisticsForQuantity(
      STEP_COUNT,
      ['cumulativeSum'],
      { filter: { date: { startDate: startOfDay(date), endDate: endOfDay(date) } }, unit: 'count' },
    );
    return result.sumQuantity?.quantity ?? null;
  } catch (err) {
    logger.error('Failed to fetch step count:', err);
    return null;
  }
};

export const getWorkoutsForDate = async (date: Date): Promise<HealthKitWorkout[]> => {
  if (!isIOS) return [];
  const hk = getHK();
  if (!hk) return [];
  try {
    const workouts = await hk.queryWorkoutSamples({
      filter: { date: { startDate: startOfDay(date), endDate: endOfDay(date) } },
      limit: 100,
    });
    return workouts.map((w: any) => ({
      id: w.uuid ?? `hk-${w.startDate}`,
      activityName: String(w.workoutActivityType ?? 'Workout').replace('HKWorkoutActivityType', ''),
      calories: 0,
      durationMinutes: Math.round((w.duration?.quantity ?? 0) / 60),
      start: w.startDate instanceof Date ? w.startDate.toISOString() : String(w.startDate),
      end: w.endDate instanceof Date ? w.endDate.toISOString() : String(w.endDate),
      source: 'healthkit' as const,
    }));
  } catch (err) {
    logger.error('Failed to fetch workouts:', err);
    return [];
  }
};

export const getActiveEnergyForDate = async (date: Date): Promise<number | null> => {
  if (!isIOS) return null;
  const hk = getHK();
  if (!hk) return null;
  try {
    const result = await hk.queryStatisticsForQuantity(
      ACTIVE_ENERGY,
      ['cumulativeSum'],
      { filter: { date: { startDate: startOfDay(date), endDate: endOfDay(date) } }, unit: 'kcal' },
    );
    const qty = result.sumQuantity?.quantity;
    return qty != null ? Math.round(qty) : null;
  } catch (err) {
    logger.error('Failed to fetch active energy:', err);
    return null;
  }
};

