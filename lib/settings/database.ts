import { getDatabase, isSQLiteAvailable } from '../database/db';
import type { AppGoals, AppVisibility } from '../database/schema';
import * as asyncSettings from '../database/asyncFallback/settings';

export type ThemeMode = 'light' | 'dark' | 'system';

const SETTINGS_KEYS = {
  THEME_MODE: 'theme_mode',
  GOALS: 'goals',
  VISIBILITY: 'visibility',
  HABITS_ORDER: 'habits_order',
  SOBRIETY_ORDER: 'sobriety_order',
  DASHBOARD_ORDER: 'dashboard_order',
  COMPACT_VIEW: 'compact_view',
} as const;

/**
 * Get a setting value from the database (only used when SQLite is available)
 */
async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value_json: string }>(
    'SELECT value_json FROM app_settings WHERE key = ?',
    [key]
  );

  if (!result) {
    return defaultValue;
  }

  try {
    return JSON.parse(result.value_json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Set a setting value in the database (only used when SQLite is available)
 */
async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value_json) VALUES (?, ?)',
    [key, JSON.stringify(value)]
  );
}

// Theme Mode
export async function getThemeMode(): Promise<ThemeMode> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getThemeModeAsync();
  }
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value_json: string }>(
    'SELECT value_json FROM app_settings WHERE key = ?',
    [SETTINGS_KEYS.THEME_MODE]
  );
  if (!result) return 'system';
  try {
    return JSON.parse(result.value_json) as ThemeMode;
  } catch {
    return 'system';
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveThemeModeAsync(mode);
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_settings (key, value_json) VALUES (?, ?)',
    [SETTINGS_KEYS.THEME_MODE, JSON.stringify(mode)]
  );
}

// Goals
export async function getGoals(): Promise<AppGoals> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getGoalsAsync();
  }
  return getSetting<AppGoals>(SETTINGS_KEYS.GOALS, {
    stepsGoal: 10000,
    fastingHoursGoal: 16,
    inventoriesPerDayGoal: 2,
  });
}

export async function saveGoals(goals: AppGoals): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveGoalsAsync(goals);
    return;
  }
  await setSetting(SETTINGS_KEYS.GOALS, goals);
}

const DEFAULT_VISIBILITY: AppVisibility = {
  habits: true,
  sobriety: true,
  fasting: true,
  inventory: true,
  steps: true,
  gratitude: true,
  stoic: true,
};

// Visibility (merge with defaults so new keys like stoic appear for existing users)
export async function getAppVisibility(): Promise<AppVisibility> {
  const raw = !(await isSQLiteAvailable())
    ? await asyncSettings.getAppVisibilityAsync()
    : await getSetting<AppVisibility>(SETTINGS_KEYS.VISIBILITY, DEFAULT_VISIBILITY);
  return { ...DEFAULT_VISIBILITY, ...raw };
}

export async function saveAppVisibility(visibility: AppVisibility): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveAppVisibilityAsync(visibility);
    return;
  }
  await setSetting(SETTINGS_KEYS.VISIBILITY, visibility);
}

// Orders
export async function getHabitsOrder(): Promise<string[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getHabitsOrderAsync();
  }
  return getSetting<string[]>(SETTINGS_KEYS.HABITS_ORDER, []);
}

export async function saveHabitsOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveHabitsOrderAsync(order);
    return;
  }
  await setSetting(SETTINGS_KEYS.HABITS_ORDER, order);
}

export async function getSobrietyOrder(): Promise<string[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getSobrietyOrderAsync();
  }
  return getSetting<string[]>(SETTINGS_KEYS.SOBRIETY_ORDER, []);
}

export async function saveSobrietyOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveSobrietyOrderAsync(order);
    return;
  }
  await setSetting(SETTINGS_KEYS.SOBRIETY_ORDER, order);
}

export async function getDashboardOrder(): Promise<string[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getDashboardOrderAsync();
  }
  return getSetting<string[]>(SETTINGS_KEYS.DASHBOARD_ORDER, []);
}

export async function saveDashboardOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveDashboardOrderAsync(order);
    return;
  }
  await setSetting(SETTINGS_KEYS.DASHBOARD_ORDER, order);
}

// Compact View
export async function getCompactViewMode(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getCompactViewModeAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.COMPACT_VIEW, false);
}

export async function setCompactViewMode(compact: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setCompactViewModeAsync(compact);
    return;
  }
  await setSetting(SETTINGS_KEYS.COMPACT_VIEW, compact);
}
