import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { FastingSession } from '@/lib/database/schema';
import { triggerSync } from '@/lib/sync';
import { getTodayKey } from '@/utils/date';
import * as asyncFasting from '@/lib/database/asyncFallback/fasting';

function rowToSession(row: { id: string; start_at: string; end_at: string | null }): FastingSession {
  return {
    id: row.id,
    startAt: row.start_at,
    endAt: row.end_at,
  };
}

export async function getFastingSessions(): Promise<FastingSession[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncFasting.getFastingSessionsAsync();
  }
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT id, start_at, end_at FROM fasting_sessions ORDER BY start_at DESC'
  );
  return rows.map(rowToSession);
}

export async function getActiveFastingSession(): Promise<FastingSession | null> {
  const sessions = await getFastingSessions();
  return sessions.find((s) => s.endAt === null) ?? null;
}

export async function startFastingSession(): Promise<FastingSession> {
  const now = new Date().toISOString();
  if (!(await isSQLiteAvailable())) {
    return asyncFasting.createFastingSessionAsync(now);
  }
  const db = await getDatabase();
  const id = Date.now().toString();
  await db.runAsync(
    'INSERT INTO fasting_sessions (id, start_at, end_at) VALUES (?, ?, NULL)',
    [id, now]
  );
  triggerSync();
  const list = await getFastingSessions();
  const created = list.find((s) => s.id === id);
  if (!created) throw new Error('Failed to create fasting session');
  return created;
}

/** Add a past session with explicit start and end (both required). */
export async function createFastingSessionWithTimes(
  startAt: string,
  endAt: string
): Promise<FastingSession> {
  if (!(await isSQLiteAvailable())) {
    return asyncFasting.createFastingSessionWithTimesAsync(startAt, endAt);
  }
  const db = await getDatabase();
  const id = Date.now().toString();
  await db.runAsync(
    'INSERT INTO fasting_sessions (id, start_at, end_at) VALUES (?, ?, ?)',
    [id, startAt, endAt]
  );
  triggerSync();
  const list = await getFastingSessions();
  const created = list.find((s) => s.id === id);
  if (!created) throw new Error('Failed to create fasting session');
  return created;
}

export async function updateFastingSession(
  sessionId: string,
  updates: { startAt?: string; endAt?: string | null }
): Promise<FastingSession> {
  if (!(await isSQLiteAvailable())) {
    return asyncFasting.updateFastingSessionAsync(sessionId, updates);
  }
  const db = await getDatabase();
  const session = (await getFastingSessions()).find((s) => s.id === sessionId);
  if (!session) throw new Error('Fasting session not found');
  const startAt = updates.startAt ?? session.startAt;
  const endAt = updates.endAt !== undefined ? updates.endAt : session.endAt;
  await db.runAsync(
    'UPDATE fasting_sessions SET start_at = ?, end_at = ? WHERE id = ?',
    [startAt, endAt, sessionId]
  );
  triggerSync();
  const list = await getFastingSessions();
  const updated = list.find((s) => s.id === sessionId);
  if (!updated) throw new Error('Fasting session not found');
  return updated;
}

export async function deleteFastingSession(sessionId: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncFasting.deleteFastingSessionAsync(sessionId);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fasting_sessions WHERE id = ?', [sessionId]);
  triggerSync();
}

export async function endFastingSession(sessionId: string): Promise<FastingSession> {
  const now = new Date().toISOString();
  if (!(await isSQLiteAvailable())) {
    return asyncFasting.endFastingSessionAsync(sessionId, now);
  }
  const db = await getDatabase();
  await db.runAsync('UPDATE fasting_sessions SET end_at = ? WHERE id = ?', [now, sessionId]);
  triggerSync();
  const list = await getFastingSessions();
  const updated = list.find((s) => s.id === sessionId);
  if (!updated) throw new Error('Fasting session not found');
  return updated;
}

/** Hours of overlap between [sStart, sEnd] and the given date (midnight to midnight in local time). */
function fastingHoursOverlapForDate(
  sStart: number,
  sEnd: number,
  dateKey: string
): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dayStart = new Date(y, m - 1, d).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const overlapStart = Math.max(sStart, dayStart);
  const overlapEnd = Math.min(sEnd, dayEnd);
  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / (1000 * 60 * 60);
}

/** Hours fasted on a specific date (sessions overlapping that day). */
export async function getFastingHoursForDate(dateKey: string): Promise<number> {
  const sessions = await getFastingSessions();
  const now = Date.now();
  let total = 0;
  for (const s of sessions) {
    const start = new Date(s.startAt).getTime();
    const end = s.endAt ? new Date(s.endAt).getTime() : now;
    total += fastingHoursOverlapForDate(start, end, dateKey);
  }
  return Math.round(total * 10) / 10;
}

/** Hours fasted today. */
export async function getFastingHoursToday(): Promise<number> {
  return getFastingHoursForDate(getTodayKey());
}

/** Hours fasted per date for the given date keys. */
export async function getFastingHoursForDates(dateKeys: string[]): Promise<number[]> {
  const sessions = await getFastingSessions();
  const now = Date.now();
  const byDate = new Map<string, number>();
  for (const key of dateKeys) byDate.set(key, 0);
  for (const s of sessions) {
    const start = new Date(s.startAt).getTime();
    const end = s.endAt ? new Date(s.endAt).getTime() : now;
    for (const dateKey of dateKeys) {
      const hours = fastingHoursOverlapForDate(start, end, dateKey);
      if (hours > 0) byDate.set(dateKey, (byDate.get(dateKey) ?? 0) + hours);
    }
  }
  return dateKeys.map((key) => Math.round((byDate.get(key) ?? 0) * 10) / 10);
}
