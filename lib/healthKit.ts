import * as AppleHealthKit from 'react-native-health';

/**
 * Initialize HealthKit permissions
 * Must be called before accessing any health data
 */
export const initHealthKit = async (): Promise<boolean> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
      console.warn('HealthKit not available: initHealthKit is missing');
      return false;
    }

    const permissions = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
        write: [],
      },
    };

    return await new Promise<boolean>((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  } catch (err) {
    console.error('HealthKit initialization failed:', err);
    return false;
  }
};

/**
 * Request HealthKit step count permission from user
 */
export const requestStepPermission = async (): Promise<boolean> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
      console.warn('HealthKit not available: initHealthKit is missing');
      return false;
    }

    const permissions = {
      permissions: {
        read: [AppleHealthKit.Constants.Permissions.StepCount],
        write: [],
      },
    };

    return await new Promise<boolean>((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  } catch (err) {
    console.error('Step permission request failed:', err);
    return false;
  }
};

/**
 * Request HealthKit permissions for steps, workouts, and active energy (for full fitness sync).
 */
export const requestFitnessPermissions = async (): Promise<boolean> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
      console.warn('HealthKit not available: initHealthKit is missing');
      return false;
    }

    const Permissions = AppleHealthKit.Constants.Permissions;
    const permissions = {
      permissions: {
        read: [
          Permissions.StepCount,
          Permissions.Workout,
          Permissions.ActiveEnergyBurned,
        ],
        write: [],
      },
    };

    return await new Promise<boolean>((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (err: string) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  } catch (err) {
    console.error('Fitness permission request failed:', err);
    return false;
  }
};

/** Workout as returned from HealthKit for display */
export interface HealthKitWorkout {
  id: string;
  activityName: string;
  calories: number;
  durationMinutes: number;
  start: string;
  end: string;
  source: 'healthkit';
}

/**
 * Fetch workouts for a specific date from HealthKit
 */
export const getWorkoutsForDate = async (date: Date): Promise<HealthKitWorkout[]> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.getAnchoredWorkouts !== 'function') {
      return [];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      ascending: false,
    };

    const result = await new Promise<{ anchor?: string; data?: any[] }>((resolve, reject) => {
      AppleHealthKit.getAnchoredWorkouts(options, (err: any, res: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res || {});
      });
    });

    const data = result?.data ?? [];
    if (!Array.isArray(data)) return [];

    return data.map((w: any) => ({
      id: w.id ?? `hk-${w.start}-${w.end}`,
      activityName: w.activityName ?? 'Workout',
      calories: typeof w.calories === 'number' ? w.calories : 0,
      durationMinutes: typeof w.duration === 'number' ? Math.round(w.duration / 60) : 0,
      start: w.start ?? '',
      end: w.end ?? '',
      source: 'healthkit' as const,
    }));
  } catch (err) {
    console.error('Failed to fetch workouts:', err);
    return [];
  }
};

/**
 * Fetch total active energy burned (kcal) for a specific date
 */
export const getActiveEnergyForDate = async (date: Date): Promise<number | null> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.getActiveEnergyBurned !== 'function') {
      return null;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      ascending: false,
    };

    const samples = await new Promise<any[]>((resolve, reject) => {
      AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(Array.isArray(results) ? results : []);
      });
    });

    const total = samples.reduce((sum, s: { value?: number }) => sum + (s?.value ?? 0), 0);
    return Math.round(total);
  } catch (err) {
    console.error('Failed to fetch active energy:', err);
    return null;
  }
};

/**
 * Fetch step count for a specific date
 * @param date - The date to fetch steps for
 * @returns Step count, or null if unavailable
 */
export const getStepsForDate = async (date: Date): Promise<number | null> => {
  try {
    if (!AppleHealthKit || typeof AppleHealthKit.getStepCount !== 'function') {
      console.warn('HealthKit not available: getStepCount is missing');
      return null;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      period: 1000, // 1 second aggregation to get total for day
      ascending: false,
    };

    const samples = await new Promise<any>((resolve, reject) => {
      AppleHealthKit.getStepCount(options, (err: string, results: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    if (Array.isArray(samples)) {
      const totalSteps = samples.reduce((sum, sample: any) => sum + (sample.value || 0), 0);
      return totalSteps;
    }

    if (typeof samples === 'number') return samples;

    if (samples && typeof samples.value === 'number') return samples.value;

    return 0;
  } catch (err) {
    console.error('Failed to fetch step count:', err);
    return null;
  }
};

/**
 * Fetch step count for today
 * @returns Today's step count, or null if unavailable
 */
export const getTodaySteps = async (): Promise<number | null> => {
  return getStepsForDate(new Date());
};

/**
 * Fetch step count for the past N days
 * @param days - Number of days to fetch
 * @returns Array of { date, steps } objects
 */
export const getStepsForPastDays = async (
  days: number
): Promise<Array<{ date: string; steps: number }>> => {
  try {
    const results: Array<{ date: string; steps: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const steps = await getStepsForDate(date);
      if (steps !== null) {
        results.push({
          date: date.toISOString().split('T')[0],
          steps,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('Failed to fetch past days steps:', err);
    return [];
  }
};

/**
 * Fetch average daily steps for the past N days
 * @param days - Number of days to calculate average
 * @returns Average steps per day, or null if unavailable
 */
export const getAverageSteps = async (days: number): Promise<number | null> => {
  try {
    const pastDaysData = await getStepsForPastDays(days);

    if (pastDaysData.length === 0) return null;

    const totalSteps = pastDaysData.reduce((sum, day) => sum + day.steps, 0);
    return Math.round(totalSteps / pastDaysData.length);
  } catch (err) {
    console.error('Failed to calculate average steps:', err);
    return null;
  }
};
