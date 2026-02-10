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
