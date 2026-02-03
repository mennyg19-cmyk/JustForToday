import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppGoals, AppVisibility } from '@/lib/database/schema';
import type { ThemeMode } from '@/lib/settings/database';

const PREFIX = 'lifetrack_';
const KEYS = {
  THEME_MODE: PREFIX + 'theme_mode',
  GOALS: PREFIX + 'goals',
  VISIBILITY: PREFIX + 'visibility',
  HABITS_ORDER: PREFIX + 'habits_order',
  SOBRIETY_ORDER: PREFIX + 'sobriety_order',
  DASHBOARD_ORDER: PREFIX + 'dashboard_order',
  COMPACT_VIEW: PREFIX + 'compact_view',
};

async function getJson<T>(key: string, defaultValue: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getThemeModeAsync(): Promise<ThemeMode> {
  return getJson<ThemeMode>(KEYS.THEME_MODE, 'system');
}

export async function saveThemeModeAsync(mode: ThemeMode): Promise<void> {
  await setJson(KEYS.THEME_MODE, mode);
}

export async function getGoalsAsync(): Promise<AppGoals> {
  return getJson<AppGoals>(KEYS.GOALS, {
    stepsGoal: 10000,
    fastingHoursGoal: 16,
    inventoriesPerDayGoal: 2,
  });
}

export async function saveGoalsAsync(goals: AppGoals): Promise<void> {
  await setJson(KEYS.GOALS, goals);
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

export async function getAppVisibilityAsync(): Promise<AppVisibility> {
  const raw = await getJson<AppVisibility>(KEYS.VISIBILITY, DEFAULT_VISIBILITY);
  return { ...DEFAULT_VISIBILITY, ...raw };
}

export async function saveAppVisibilityAsync(visibility: AppVisibility): Promise<void> {
  await setJson(KEYS.VISIBILITY, visibility);
}

export async function getHabitsOrderAsync(): Promise<string[]> {
  return getJson<string[]>(KEYS.HABITS_ORDER, []);
}

export async function saveHabitsOrderAsync(order: string[]): Promise<void> {
  await setJson(KEYS.HABITS_ORDER, order);
}

export async function getSobrietyOrderAsync(): Promise<string[]> {
  return getJson<string[]>(KEYS.SOBRIETY_ORDER, []);
}

export async function saveSobrietyOrderAsync(order: string[]): Promise<void> {
  await setJson(KEYS.SOBRIETY_ORDER, order);
}

export async function getDashboardOrderAsync(): Promise<string[]> {
  return getJson<string[]>(KEYS.DASHBOARD_ORDER, []);
}

export async function saveDashboardOrderAsync(order: string[]): Promise<void> {
  await setJson(KEYS.DASHBOARD_ORDER, order);
}

export async function getCompactViewModeAsync(): Promise<boolean> {
  return getJson<boolean>(KEYS.COMPACT_VIEW, false);
}

export async function setCompactViewModeAsync(compact: boolean): Promise<void> {
  await setJson(KEYS.COMPACT_VIEW, compact);
}
