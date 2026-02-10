import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { StoicEntryRow } from '@/lib/database/schema';
import { triggerSync } from '@/lib/sync';
import {
  getStoicCurrentWeekNumber,
  getCalendarWeekNumber,
  getPersonalWeekNumber,
} from './weekUtils';
import { getStoicWeekMode, getStoicStartDate } from '@/lib/settings/database';

export type StoicDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'review';

/** Maps JS Date.getDay() (0=Sun .. 6=Sat) to Stoic day key. */
function getTodayDayKey(): StoicDayKey {
  const d = new Date().getDay();
  if (d === 0) return 'review';
  const keys: StoicDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[d - 1];
}

/** Maps a date (YYYY-MM-DD) to Stoic day key. */
function getDayKeyForDate(dateKey: string): StoicDayKey {
  const d = new Date(dateKey + 'T00:00:00').getDay();
  if (d === 0) return 'review';
  const keys: StoicDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return keys[d - 1];
}

/** True if the user has saved a reflection for today (current week + today's day). */
export async function getStoicTodayReflectionDone(): Promise<boolean> {
  const weekNumber = await getStoicCurrentWeekNumber();
  const dayKey = getTodayDayKey();
  const entries = await getStoicEntriesForWeek(weekNumber);
  const todayEntry = entries.find((e) => e.dayKey === dayKey);
  return (todayEntry?.content?.trim() ?? '').length > 0;
}

export interface StoicEntry {
  weekNumber: number;
  dayKey: StoicDayKey;
  content: string;
  useful: boolean;
  updatedAt: string;
}

const ALL_DAY_KEYS: StoicDayKey[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'review',
];

function rowToEntry(row: StoicEntryRow): StoicEntry {
  return {
    weekNumber: row.week_number,
    dayKey: row.day_key as StoicDayKey,
    content: row.content,
    useful: row.useful !== 0,
    updatedAt: row.updated_at,
  };
}

/** Returns all 7 slots (mon–sat + review) for the week; missing entries have empty content and useful false. */
export async function getStoicEntriesForWeek(weekNumber: number): Promise<StoicEntry[]> {
  let entries: StoicEntry[];
  if (!(await isSQLiteAvailable())) {
    entries = await getStoicEntriesForWeekAsync(weekNumber);
  } else {
    const db = await getDatabase();
    const rows = await db.getAllAsync<StoicEntryRow>(
      'SELECT week_number, day_key, content, useful, updated_at FROM stoic_entries WHERE week_number = ?',
      [weekNumber]
    );
    entries = rows.map(rowToEntry);
  }
  const byDay = new Map(entries.map((e) => [e.dayKey, e]));
  return ALL_DAY_KEYS.map((dayKey) => byDay.get(dayKey) ?? {
    weekNumber,
    dayKey,
    content: '',
    useful: false,
    updatedAt: '',
  });
}

export async function setStoicEntry(
  weekNumber: number,
  dayKey: StoicDayKey,
  content: string,
  useful: boolean = false
): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await setStoicEntryAsync(weekNumber, dayKey, content, useful);
    triggerSync();
    return;
  }
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO stoic_entries (week_number, day_key, content, useful, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(week_number, day_key) DO UPDATE SET
       content = excluded.content,
       useful = excluded.useful,
       updated_at = excluded.updated_at`,
    [weekNumber, dayKey, content, useful ? 1 : 0, now]
  );
  triggerSync();
}

const DAY_ORDER: StoicDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'review'];

/** All entries across all weeks, newest first (by week desc, then day). For history view. */
export async function getStoicEntriesHistory(): Promise<StoicEntry[]> {
  if (!(await isSQLiteAvailable())) {
    return getStoicEntriesHistoryAsync();
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<StoicEntryRow>(
    `SELECT week_number, day_key, content, useful, updated_at
     FROM stoic_entries
     ORDER BY week_number DESC, CASE day_key
       WHEN 'mon' THEN 1 WHEN 'tue' THEN 2 WHEN 'wed' THEN 3 WHEN 'thu' THEN 4
       WHEN 'fri' THEN 5 WHEN 'sat' THEN 6 WHEN 'review' THEN 7 ELSE 8 END`
  );
  return rows.map(rowToEntry);
}

/** For each dateKey, true if that day's Stoic reflection was done (week + day has non-empty content). */
export async function getStoicReflectionDoneForDates(
  dateKeys: string[]
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  if (dateKeys.length === 0) return result;
  const [mode, startDate] = await Promise.all([getStoicWeekMode(), getStoicStartDate()]);
  const weekAndDayByDate = new Map<
    string,
    { weekNumber: number; dayKey: StoicDayKey }
  >();
  const weeksNeeded = new Set<number>();
  for (const dateKey of dateKeys) {
    const date = new Date(dateKey + 'T00:00:00');
    const weekNumber =
      mode === 'calendar'
        ? getCalendarWeekNumber(date)
        : startDate
          ? getPersonalWeekNumber(date, startDate)
          : getCalendarWeekNumber(date);
    const dayKey = getDayKeyForDate(dateKey);
    weekAndDayByDate.set(dateKey, { weekNumber, dayKey });
    weeksNeeded.add(weekNumber);
  }
  const entriesByWeek = new Map<number, StoicEntry[]>();
  for (const w of weeksNeeded) {
    entriesByWeek.set(w, await getStoicEntriesForWeek(w));
  }
  for (const dateKey of dateKeys) {
    const { weekNumber, dayKey } = weekAndDayByDate.get(dateKey)!;
    const entries = entriesByWeek.get(weekNumber) ?? [];
    const entry = entries.find((e) => e.dayKey === dayKey);
    const done = (entry?.content?.trim() ?? '').length > 0;
    result.set(dateKey, done);
  }
  return result;
}

async function getStoicEntriesHistoryAsync(): Promise<StoicEntry[]> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
    (m) => m.default
  );
  const raw = await AsyncStorage.getItem(STOIC_STORAGE_KEY);
  const all: Record<string, { content: string; useful: boolean; updatedAt: string }> = raw
    ? JSON.parse(raw)
    : {};
  const entries: StoicEntry[] = [];
  for (let week = 52; week >= 1; week--) {
    for (const dayKey of DAY_ORDER) {
      const key = `${week}_${dayKey}`;
      const v = all[key];
      if (v && (v.content.trim() || v.useful)) {
        entries.push({
          weekNumber: week,
          dayKey,
          content: v.content,
          useful: v.useful,
          updatedAt: v.updatedAt,
        });
      }
    }
  }
  return entries;
}

// —— AsyncStorage fallback (Expo Go) ——
const STOIC_STORAGE_KEY = 'lifetrack_stoic_entries';

async function getStoicEntriesForWeekAsync(weekNumber: number): Promise<StoicEntry[]> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
    (m) => m.default
  );
  const raw = await AsyncStorage.getItem(STOIC_STORAGE_KEY);
  const all: Record<string, { content: string; useful: boolean; updatedAt: string }> = raw
    ? JSON.parse(raw)
    : {};
  return ALL_DAY_KEYS.map((dayKey) => {
    const key = `${weekNumber}_${dayKey}`;
    const v = all[key];
    return {
      weekNumber,
      dayKey,
      content: v?.content ?? '',
      useful: v?.useful ?? false,
      updatedAt: v?.updatedAt ?? '',
    };
  });
}

async function setStoicEntryAsync(
  weekNumber: number,
  dayKey: StoicDayKey,
  content: string,
  useful: boolean
): Promise<void> {
  const AsyncStorage = await import('@react-native-async-storage/async-storage').then(
    (m) => m.default
  );
  const raw = await AsyncStorage.getItem(STOIC_STORAGE_KEY);
  const all: Record<string, { content: string; useful: boolean; updatedAt: string }> = raw
    ? JSON.parse(raw)
    : {};
  const key = `${weekNumber}_${dayKey}`;
  all[key] = { content, useful, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STOIC_STORAGE_KEY, JSON.stringify(all));
}
