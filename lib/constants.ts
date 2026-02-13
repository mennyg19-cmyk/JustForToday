import type { AppVisibility, SectionVisibility } from './database/schema';

/**
 * App-wide default goal values.
 * Imported by lib/settings and features/settings — kept in lib/ to
 * avoid features → lib → features circular dependency.
 */
export const DEFAULT_GOALS = {
  habitsGoal: 0,
  stepsGoal: 10000,
  workoutsGoal: 1,
  fastingHoursGoal: 16,
  inventoriesPerDayGoal: 2,
  gratitudesPerDayGoal: 1,
} as const;

export const DEFAULT_VISIBILITY: AppVisibility = {
  habits: true,
  sobriety: true,
  daily_renewal: true,
  fasting: true,
  step11: true,
  step10: true,
  steps: true,
  workouts: true,
  gratitude: true,
  stoic: true,
};

export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  health: true,
  sobriety: true,
  daily_practice: true,
};
