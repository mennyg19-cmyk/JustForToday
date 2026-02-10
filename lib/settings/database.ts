import { getDatabase, isSQLiteAvailable } from '../database/db';
import type {
  AppGoals,
  AppVisibility,
  SectionVisibility,
  SectionId,
  ModuleSettingsMap,
  ModuleId,
} from '../database/schema';
import { DEFAULT_DASHBOARD_ORDER, DEFAULT_SECTION_ORDER } from '../modules';
import * as asyncSettings from '../database/asyncFallback/settings';
import { DEFAULT_GOALS } from '@/lib/constants';

const APP_FIRST_OPEN_DATE_KEY = 'app_first_open_date';

export type ThemeMode = 'light' | 'dark' | 'system';

const SETTINGS_KEYS = {
  THEME_MODE: 'theme_mode',
  GOALS: 'goals',
  VISIBILITY: 'visibility',
  SECTION_VISIBILITY: 'section_visibility',
  MODULE_SETTINGS: 'module_settings',
  HABITS_ORDER: 'habits_order',
  SOBRIETY_ORDER: 'sobriety_order',
  DASHBOARD_ORDER: 'dashboard_order',
  DASHBOARD_SECTION_ORDER: 'dashboard_section_order',
  DASHBOARD_GROUPED: 'dashboard_grouped',
  COMPACT_VIEW: 'compact_view',
  STOIC_WEEK_MODE: 'stoic_week_mode',
  STOIC_START_DATE: 'stoic_start_date',
  PROFILE: 'user_profile',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  HABITS_SHOW_METRICS: 'habits_show_metrics',
  CLOUD_SYNC_ENABLED: 'cloud_sync_enabled',
  SAF_FOLDER_URI: 'saf_folder_uri',
  COMMITMENT_PROMPT_DISMISSED_DATE: 'commitment_prompt_dismissed_date',
  PRIVACY_LOCK_ENABLED: 'privacy_lock_enabled',
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

// Goals (merge with defaults so new keys appear for existing users)
export async function getGoals(): Promise<AppGoals> {
  const raw = !(await isSQLiteAvailable())
    ? await asyncSettings.getGoalsAsync()
    : await getSetting<Partial<AppGoals>>(SETTINGS_KEYS.GOALS, {});
  return { ...DEFAULT_GOALS, ...raw };
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
  daily_renewal: true,
  fasting: true,
  inventory: true,
  step10: true,
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

export async function getAppVisibility(): Promise<AppVisibility> {
  const raw = !(await isSQLiteAvailable())
    ? await asyncSettings.getAppVisibilityAsync()
    : await getSetting<Partial<AppVisibility>>(SETTINGS_KEYS.VISIBILITY, {});
  return { ...DEFAULT_VISIBILITY, ...raw };
}

export async function saveAppVisibility(visibility: AppVisibility): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveAppVisibilityAsync(visibility);
    return;
  }
  await setSetting(SETTINGS_KEYS.VISIBILITY, visibility);
}

export async function getSectionVisibility(): Promise<SectionVisibility> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getSectionVisibilityAsync();
  }
  const raw = await getSetting<Partial<SectionVisibility>>(
    SETTINGS_KEYS.SECTION_VISIBILITY,
    {}
  );
  return { ...DEFAULT_SECTION_VISIBILITY, ...raw };
}

export async function saveSectionVisibility(
  sectionVisibility: SectionVisibility
): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveSectionVisibilityAsync(sectionVisibility);
    return;
  }
  await setSetting(SETTINGS_KEYS.SECTION_VISIBILITY, sectionVisibility);
}

export async function getModuleSettings(): Promise<ModuleSettingsMap> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getModuleSettingsAsync();
  }
  return getSetting<ModuleSettingsMap>(SETTINGS_KEYS.MODULE_SETTINGS, {});
}

export async function saveModuleSettings(settings: ModuleSettingsMap): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveModuleSettingsAsync(settings);
    return;
  }
  await setSetting(SETTINGS_KEYS.MODULE_SETTINGS, settings);
}

export async function setModuleTrackingStartDate(
  moduleId: ModuleId,
  dateKey: string | null
): Promise<void> {
  const current = await getModuleSettings();
  const next: ModuleSettingsMap = {
    ...current,
    [moduleId]: {
      ...current[moduleId],
      trackingStartDate: dateKey ?? undefined,
    },
  };
  await saveModuleSettings(next);
}

export async function setModuleCountInScore(
  moduleId: ModuleId,
  countInScore: boolean
): Promise<void> {
  const current = await getModuleSettings();
  const next: ModuleSettingsMap = {
    ...current,
    [moduleId]: {
      ...current[moduleId],
      countInScore,
    },
  };
  await saveModuleSettings(next);
}

/** Returns the date key when the app was first opened (YYYY-MM-DD), or null if never set. */
export async function getAppFirstOpenDate(): Promise<string | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getAppFirstOpenDateAsync();
  }
  const raw = await getSetting<string | null>(APP_FIRST_OPEN_DATE_KEY, null);
  return raw;
}

/** Set the first-open date (used on first launch to initialize all module tracking start dates). */
export async function setAppFirstOpenDate(dateKey: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setAppFirstOpenDateAsync(dateKey);
    return;
  }
  await setSetting(APP_FIRST_OPEN_DATE_KEY, dateKey);
}

/**
 * Call on app start: if first open, set first-open date, all module tracking
 * start dates, and all display defaults so the dashboard launches correctly.
 */
export async function ensureFirstLaunchInitialized(): Promise<void> {
  const { getTodayKey } = await import('@/utils/date');
  const today = getTodayKey();
  const firstOpen = await getAppFirstOpenDate();
  if (firstOpen != null) return;

  // Mark first open
  await setAppFirstOpenDate(today);

  // Module tracking start dates
  const settings: ModuleSettingsMap = {};
  for (const id of DEFAULT_DASHBOARD_ORDER) {
    settings[id] = { trackingStartDate: today };
  }
  await saveModuleSettings(settings);

  // Persist display defaults so the dashboard doesn't rely on runtime fallbacks
  await Promise.all([
    saveThemeMode('system'),
    setCompactViewMode(false),
    saveDashboardGrouped(false),
    saveDashboardOrder([...DEFAULT_DASHBOARD_ORDER]),
    saveDashboardSectionOrder([...DEFAULT_SECTION_ORDER]),
  ]);
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
  const order = await getSetting<string[]>(SETTINGS_KEYS.DASHBOARD_ORDER, []);
  return order.length > 0 ? order : [...DEFAULT_DASHBOARD_ORDER];
}

export async function saveDashboardOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveDashboardOrderAsync(order);
    return;
  }
  await setSetting(SETTINGS_KEYS.DASHBOARD_ORDER, order);
}

/** Order of dashboard sections. Uses the canonical default from lib/modules. */
export async function getDashboardSectionOrder(): Promise<string[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getDashboardSectionOrderAsync();
  }
  const raw = await getSetting<string[]>(SETTINGS_KEYS.DASHBOARD_SECTION_ORDER, []);
  if (raw.length !== 3) return [...DEFAULT_SECTION_ORDER];
  const valid = raw.filter((id) => DEFAULT_SECTION_ORDER.includes(id as SectionId));
  return valid.length === 3 ? valid : [...DEFAULT_SECTION_ORDER];
}

export async function saveDashboardSectionOrder(order: string[]): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveDashboardSectionOrderAsync(order);
    return;
  }
  await setSetting(SETTINGS_KEYS.DASHBOARD_SECTION_ORDER, order);
}

/** Whether dashboard shows sections (Health, Sobriety, Daily Practice). Default false. */
export async function getDashboardGrouped(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getDashboardGroupedAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.DASHBOARD_GROUPED, false);
}

export async function saveDashboardGrouped(grouped: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveDashboardGroupedAsync(grouped);
    return;
  }
  await setSetting(SETTINGS_KEYS.DASHBOARD_GROUPED, grouped);
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

// Stoic: week by calendar year vs from start date
export type StoicWeekMode = 'calendar' | 'personal';

export async function getStoicWeekMode(): Promise<StoicWeekMode> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getStoicWeekModeAsync();
  }
  return getSetting<StoicWeekMode>(SETTINGS_KEYS.STOIC_WEEK_MODE, 'calendar');
}

export async function setStoicWeekMode(mode: StoicWeekMode): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setStoicWeekModeAsync(mode);
    return;
  }
  await setSetting(SETTINGS_KEYS.STOIC_WEEK_MODE, mode);
}

export async function getStoicStartDate(): Promise<string | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getStoicStartDateAsync();
  }
  return getSetting<string | null>(SETTINGS_KEYS.STOIC_START_DATE, null);
}

export async function setStoicStartDate(dateKey: string | null): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setStoicStartDateAsync(dateKey);
    return;
  }
  await setSetting(SETTINGS_KEYS.STOIC_START_DATE, dateKey);
}

// -- User Profile --

/** Profile data for personalized greetings and encouragement. */
export interface UserProfile {
  name: string;
  birthday: string; // YYYY-MM-DD or empty
}

const DEFAULT_PROFILE: UserProfile = { name: '', birthday: '' };

export async function getUserProfile(): Promise<UserProfile> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getUserProfileAsync();
  }
  const raw = await getSetting<Partial<UserProfile>>(SETTINGS_KEYS.PROFILE, {});
  return { ...DEFAULT_PROFILE, ...raw };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.saveUserProfileAsync(profile);
    return;
  }
  await setSetting(SETTINGS_KEYS.PROFILE, profile);
}

// -- Onboarding --

export async function getOnboardingCompleted(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getOnboardingCompletedAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.ONBOARDING_COMPLETED, false);
}

export async function setOnboardingCompleted(): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setOnboardingCompletedAsync();
    return;
  }
  await setSetting(SETTINGS_KEYS.ONBOARDING_COMPLETED, true);
}

// -- Habits Metrics --

/** Whether to show streak/week/month metrics on habit cards. Default: true. */
export async function getHabitsShowMetrics(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getHabitsShowMetricsAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.HABITS_SHOW_METRICS, true);
}

export async function setHabitsShowMetrics(show: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setHabitsShowMetricsAsync(show);
    return;
  }
  await setSetting(SETTINGS_KEYS.HABITS_SHOW_METRICS, show);
}

// -- Cloud Sync --

/** Whether cloud sync is enabled. Default: false (local-only). */
export async function getCloudSyncEnabled(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getCloudSyncEnabledAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.CLOUD_SYNC_ENABLED, false);
}

export async function setCloudSyncEnabled(enabled: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setCloudSyncEnabledAsync(enabled);
    return;
  }
  await setSetting(SETTINGS_KEYS.CLOUD_SYNC_ENABLED, enabled);
}

/** Android SAF: persisted folder URI the user chose for cloud sync. */
export async function getSafFolderUri(): Promise<string | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getSafFolderUriAsync();
  }
  return getSetting<string | null>(SETTINGS_KEYS.SAF_FOLDER_URI, null);
}

export async function setSafFolderUri(uri: string | null): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setSafFolderUriAsync(uri);
    return;
  }
  await setSetting(SETTINGS_KEYS.SAF_FOLDER_URI, uri);
}

// -- Daily Commitment Prompt --

/** Get the date (YYYY-MM-DD) when the commitment prompt was last dismissed. */
export async function getCommitmentPromptDismissedDate(): Promise<string | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getCommitmentPromptDismissedDateAsync();
  }
  return getSetting<string | null>(SETTINGS_KEYS.COMMITMENT_PROMPT_DISMISSED_DATE, null);
}

/** Mark the commitment prompt as dismissed for a given date (YYYY-MM-DD). */
export async function setCommitmentPromptDismissedDate(date: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setCommitmentPromptDismissedDateAsync(date);
    return;
  }
  await setSetting(SETTINGS_KEYS.COMMITMENT_PROMPT_DISMISSED_DATE, date);
}

// -- Privacy Lock --

/** Whether the privacy lock (biometric/passcode) is enabled. Default: false. */
export async function getPrivacyLockEnabled(): Promise<boolean> {
  if (!(await isSQLiteAvailable())) {
    return asyncSettings.getPrivacyLockEnabledAsync();
  }
  return getSetting<boolean>(SETTINGS_KEYS.PRIVACY_LOCK_ENABLED, false);
}

export async function setPrivacyLockEnabled(enabled: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSettings.setPrivacyLockEnabledAsync(enabled);
    return;
  }
  await setSetting(SETTINGS_KEYS.PRIVACY_LOCK_ENABLED, enabled);
}

/**
 * Reset all display/appearance settings to their defaults:
 *   Theme: system
 *   Compact cards: off
 *   Group by section: off
 *   Dashboard order: canonical MODULES order
 *   Section order: Sobriety → Daily Practice → Health
 *
 * Does NOT touch user data (habits, check-ins, etc.) or profile.
 */
export async function resetDisplayDefaults(): Promise<void> {
  await Promise.all([
    saveThemeMode('system'),
    setCompactViewMode(false),
    saveDashboardGrouped(false),
    saveDashboardOrder([...DEFAULT_DASHBOARD_ORDER]),
    saveDashboardSectionOrder([...DEFAULT_SECTION_ORDER]),
  ]);
}
