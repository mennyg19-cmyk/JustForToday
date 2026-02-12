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
  tracking_start_date: string | null; // YYYY-MM-DD; null = use created_at
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
  last_daily_renewal: string | null; // ISO timestamp of last 24h commitment
}

export interface SobrietyHistoryRow {
  counter_id: string;
  date: string; // YYYY-MM-DD format
  tracked: number; // 0 or 1 (SQLite boolean)
}

export interface InventoryEntryRow {
  id: string;
  type: 'morning' | 'nightly' | 'step10' | 'fear';
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

export interface StoicEntryRow {
  week_number: number;
  day_key: string; // 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'review'
  content: string;
  useful: number; // 0 or 1
  updated_at: string;
}

export interface FastingSessionRow {
  id: string;
  start_at: string; // ISO date string
  end_at: string | null; // null = active fast
}

// -- Check-in and contacts tables (migration 007) --

export interface DailyCheckInRow {
  date: string; // YYYY-MM-DD, PRIMARY KEY
  commitment_type: '24h' | '12h' | 'none';
  challenge: string; // "What might make today hard?"
  plan: string; // "What can you do if that comes up?"
  todo_text: string; // Private TODO generated from challenge + plan
  todo_completed: number; // 0 or 1 (SQLite boolean)
  created_at: string; // ISO timestamp
}

export interface TrustedContactRow {
  id: string;
  name: string;
  label: string; // e.g. "Sponsor", "Friend", "Family"
  phone: string;
  order_index: number;
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
  /** Start date for tracking (YYYY-MM-DD). If not set, use createdAt date. */
  trackingStartDate?: string;
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
  /** ISO timestamp of last 24h commitment renewal; used by Daily Renewal. */
  lastDailyRenewal?: string | null;
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

export type InventoryEntryType = 'morning' | 'nightly' | 'step10' | 'fear';

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
  habitsGoal: number; // how many habits must be completed to count as 100% (e.g. 6 of 8)
  stepsGoal: number;
  workoutsGoal: number;
  fastingHoursGoal: number;
  inventoriesPerDayGoal: number;
  gratitudesPerDayGoal: number;
}

export interface AppVisibility {
  habits: boolean;
  sobriety: boolean;
  daily_renewal: boolean;
  fasting: boolean;
  inventory: boolean;
  step10: boolean;
  steps: boolean;
  workouts: boolean;
  gratitude: boolean;
  stoic: boolean;
}

export type SectionId = 'health' | 'sobriety' | 'daily_practice';

export interface SectionVisibility {
  health: boolean;
  sobriety: boolean;
  daily_practice: boolean;
}

export type ModuleId = keyof AppVisibility;

export interface ModuleSettings {
  trackingStartDate?: string | null;
  /** When false, module is visible but not included in daily score (display only). Default true. */
  countInScore?: boolean;
}

export type ModuleSettingsMap = Partial<Record<ModuleId, ModuleSettings>>;

// -- Check-in domain types --

export type CommitmentType = '24h' | '12h' | 'none';

/** A single day's check-in record. Stores commitment choice, reflection, and private TODO. */
export interface DailyCheckIn {
  date: string; // YYYY-MM-DD
  commitmentType: CommitmentType;
  challenge: string;
  plan: string;
  todoText: string;
  todoCompleted: boolean;
  createdAt: string;
}

/** A trusted contact the user can call during a Hard Moment. */
export interface TrustedContact {
  id: string;
  name: string;
  label: string;
  phone: string;
}
