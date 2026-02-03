/**
 * Database schema definitions
 * TypeScript types matching SQLite table structures
 */

export interface HabitRow {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  type: 'build' | 'break';
  created_at: string;
  order_index: number;
}

export interface HabitHistoryRow {
  habit_id: string;
  date: string; // YYYY-MM-DD format
  completed: number; // 0 or 1 (SQLite boolean)
}

export interface SobrietyCounterRow {
  id: string;
  display_name: string;
  actual_name: string | null;
  start_date: string; // ISO date string
  current_streak_start: string; // ISO date string
  longest_streak: number;
  notes: string | null;
  order_index: number;
}

export interface SobrietyHistoryRow {
  counter_id: string;
  date: string; // YYYY-MM-DD format
  tracked: number; // 0 or 1 (SQLite boolean)
}

export interface InventoryEntryRow {
  id: string;
  type: 'morning' | 'nightly' | 'step10';
  who: string;
  what_happened: string;
  affects_json: string; // JSON array of strings
  defects_json: string; // JSON array of strings
  assets_json: string; // JSON array of strings
  seventh_step_prayer: string;
  prayed: number; // 0 or 1
  amends_needed: number; // 0 or 1
  amends_to: string;
  help_who: string;
  share_with: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StepsDataRow {
  date: string; // YYYY-MM-DD format
  steps_count: number;
  source: 'healthkit' | 'manual';
}

export interface WorkoutRow {
  id: string;
  date: string; // YYYY-MM-DD format
  activity_name: string;
  duration_minutes: number;
  calories_burned: number;
  source: 'healthkit' | 'manual';
}

export interface GratitudeEntryRow {
  id: string;
  text: string;
  created_at: string;
}

export interface AppSettingRow {
  key: string;
  value_json: string; // JSON value
}

export interface FastingSessionRow {
  id: string;
  start_at: string; // ISO date string
  end_at: string | null; // null = active fast
}

// Domain types (what features use)
export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  type: 'build' | 'break';
  completedToday: boolean;
  currentStreak: number;
  highScore: number;
  thisWeekCount: number;
  lastWeekCount: number;
  thisMonthCount: number;
  lastMonthCount: number;
  history: Record<string, boolean>; // date -> completed
  createdAt: string;
}

export interface SobrietyCounter {
  id: string;
  displayName: string;
  actualName?: string;
  startDate: string;
  currentStreakStart: string;
  allHistory: Record<string, boolean>; // date -> tracked
  longestStreak: number;
  notes?: string;
}

export interface Step10InventoryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  who: string;
  whatHappened: string;
  affects: string[];
  defects: string[];
  assets: string[];
  seventhStepPrayer: string;
  prayed: boolean;
  amendsNeeded: boolean;
  amendsTo: string;
  helpWho: string;
  shareWith: string;
  notes?: string;
}

export type InventoryEntryType = 'morning' | 'nightly' | 'step10';

export interface InventoryEntry extends Step10InventoryEntry {
  type: InventoryEntryType;
}

export interface GratitudeEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface FastingSession {
  id: string;
  startAt: string; // ISO
  endAt: string | null; // null = currently fasting
}

export interface Workout {
  id: string;
  date: string;
  activityName: string;
  durationMinutes: number;
  caloriesBurned: number;
  source: 'healthkit' | 'manual';
}

export interface AppGoals {
  stepsGoal: number;
  fastingHoursGoal: number;
  inventoriesPerDayGoal: number;
}

export interface AppVisibility {
  habits: boolean;
  sobriety: boolean;
  fasting: boolean;
  inventory: boolean;
  steps: boolean;
  gratitude: boolean;
  stoic: boolean;
}
