import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AppGoals,
  AppVisibility,
  SectionVisibility,
  ModuleSettingsMap,
} from '@/lib/database/schema';
import type { ThemeMode } from '@/lib/settings/database';
import { DEFAULT_DASHBOARD_ORDER } from '@/lib/modules';

const PREFIX = 'lifetrack_';
const KEYS = {
  THEME_MODE: PREFIX + 'theme_mode',
  GOALS: PREFIX + 'goals',
  VISIBILITY: PREFIX + 'visibility',
  SECTION_VISIBILITY: PREFIX + 'section_visibility',
  MODULE_SETTINGS: PREFIX + 'module_settings',
  APP_FIRST_OPEN_DATE: PREFIX + 'app_first_open_date',
  HABITS_ORDER: PREFIX + 'habits_order',
  SOBRIETY_ORDER: PREFIX + 'sobriety_order',
  DASHBOARD_ORDER: PREFIX + 'dashboard_order',
  DASHBOARD_SECTION_ORDER: PREFIX + 'dashboard_section_order',
  DASHBOARD_GROUPED: PREFIX + 'dashboard_grouped',
  COMPACT_VIEW: PREFIX + 'compact_view',
  STOIC_WEEK_MODE: PREFIX + 'stoic_week_mode',
  STOIC_START_DATE: PREFIX + 'stoic_start_date',
  PROFILE: PREFIX + 'user_profile',
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
  return getJson<ThemeMode>(KEYS.THEME_MODE, 'dark');
}

export async function saveThemeModeAsync(mode: ThemeMode): Promise<void> {
  await setJson(KEYS.THEME_MODE, mode);
}

const DEFAULT_GOALS: AppGoals = {
  habitsGoal: 0,
  stepsGoal: 10000,
  workoutsGoal: 1,
  fastingHoursGoal: 16,
  inventoriesPerDayGoal: 2,
  gratitudesPerDayGoal: 1,
};

export async function getGoalsAsync(): Promise<AppGoals> {
  const raw = await getJson<Partial<AppGoals>>(KEYS.GOALS, {});
  return { ...DEFAULT_GOALS, ...raw };
}

export async function saveGoalsAsync(goals: AppGoals): Promise<void> {
  await setJson(KEYS.GOALS, goals);
}

const DEFAULT_VISIBILITY: AppVisibility = {
  habits: true,
  sobriety: true,
  daily_renewal: true,
  fasting: true,
  inventory: true,
  steps: true,
  workouts: true,
  gratitude: true,
  stoic: true,
};

const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  health: true,
  sobriety: true,
  daily_practice: true,
};

export async function getAppVisibilityAsync(): Promise<AppVisibility> {
  const raw = await getJson<Partial<AppVisibility>>(KEYS.VISIBILITY, {});
  return { ...DEFAULT_VISIBILITY, ...raw };
}

export async function saveAppVisibilityAsync(visibility: AppVisibility): Promise<void> {
  await setJson(KEYS.VISIBILITY, visibility);
}

export async function getSectionVisibilityAsync(): Promise<SectionVisibility> {
  const raw = await getJson<Partial<SectionVisibility>>(KEYS.SECTION_VISIBILITY, {});
  return { ...DEFAULT_SECTION_VISIBILITY, ...raw };
}

export async function saveSectionVisibilityAsync(
  sectionVisibility: SectionVisibility
): Promise<void> {
  await setJson(KEYS.SECTION_VISIBILITY, sectionVisibility);
}

export async function getModuleSettingsAsync(): Promise<ModuleSettingsMap> {
  return getJson<ModuleSettingsMap>(KEYS.MODULE_SETTINGS, {});
}

export async function saveModuleSettingsAsync(
  settings: ModuleSettingsMap
): Promise<void> {
  await setJson(KEYS.MODULE_SETTINGS, settings);
}

export async function getAppFirstOpenDateAsync(): Promise<string | null> {
  return getJson<string | null>(KEYS.APP_FIRST_OPEN_DATE, null);
}

export async function setAppFirstOpenDateAsync(dateKey: string): Promise<void> {
  await setJson(KEYS.APP_FIRST_OPEN_DATE, dateKey);
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
  const order = await getJson<string[]>(KEYS.DASHBOARD_ORDER, []);
  return order.length > 0 ? order : [...DEFAULT_DASHBOARD_ORDER];
}

export async function saveDashboardOrderAsync(order: string[]): Promise<void> {
  await setJson(KEYS.DASHBOARD_ORDER, order);
}

const DEFAULT_SECTION_ORDER = ['sobriety', 'daily_practice', 'health'];

export async function getDashboardSectionOrderAsync(): Promise<string[]> {
  const raw = await getJson<string[]>(KEYS.DASHBOARD_SECTION_ORDER, []);
  if (raw.length !== 3) return DEFAULT_SECTION_ORDER;
  const valid = raw.filter((id) => DEFAULT_SECTION_ORDER.includes(id));
  return valid.length === 3 ? valid : DEFAULT_SECTION_ORDER;
}

export async function saveDashboardSectionOrderAsync(order: string[]): Promise<void> {
  await setJson(KEYS.DASHBOARD_SECTION_ORDER, order);
}

export async function getDashboardGroupedAsync(): Promise<boolean> {
  return getJson<boolean>(KEYS.DASHBOARD_GROUPED, false);
}

export async function saveDashboardGroupedAsync(grouped: boolean): Promise<void> {
  await setJson(KEYS.DASHBOARD_GROUPED, grouped);
}

export async function getCompactViewModeAsync(): Promise<boolean> {
  return getJson<boolean>(KEYS.COMPACT_VIEW, true);
}

export async function setCompactViewModeAsync(compact: boolean): Promise<void> {
  await setJson(KEYS.COMPACT_VIEW, compact);
}

export type StoicWeekMode = 'calendar' | 'personal';

export async function getStoicWeekModeAsync(): Promise<StoicWeekMode> {
  return getJson<StoicWeekMode>(KEYS.STOIC_WEEK_MODE, 'calendar');
}

export async function setStoicWeekModeAsync(mode: StoicWeekMode): Promise<void> {
  await setJson(KEYS.STOIC_WEEK_MODE, mode);
}

export async function getStoicStartDateAsync(): Promise<string | null> {
  return getJson<string | null>(KEYS.STOIC_START_DATE, null);
}

export async function setStoicStartDateAsync(dateKey: string | null): Promise<void> {
  await setJson(KEYS.STOIC_START_DATE, dateKey);
}

// -- User Profile --

interface UserProfile {
  name: string;
  birthday: string;
}

const DEFAULT_PROFILE: UserProfile = { name: '', birthday: '' };

export async function getUserProfileAsync(): Promise<UserProfile> {
  const raw = await getJson<Partial<UserProfile>>(KEYS.PROFILE, {});
  return { ...DEFAULT_PROFILE, ...raw };
}

export async function saveUserProfileAsync(profile: UserProfile): Promise<void> {
  await setJson(KEYS.PROFILE, profile);
}
