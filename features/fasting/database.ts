import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { FastingSession } from '@/lib/database/schema';
import { triggerSync } from '@/lib/sync';
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

/** Hours fasted today: completed sessions that ended today + active session if it started today. */
export async function getFastingHoursToday(): Promise<number> {
  const sessions = await getFastingSessions();
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  let total = 0;
  for (const s of sessions) {
    if (s.endAt) {
      const end = new Date(s.endAt);
      if (end.getFullYear() === y && end.getMonth() === m && end.getDate() === d) {
        total += (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / (1000 * 60 * 60);
      }
    } else {
      const start = new Date(s.startAt);
      if (start.getFullYear() === y && start.getMonth() === m && start.getDate() === d) {
        total += (Date.now() - new Date(s.startAt).getTime()) / (1000 * 60 * 60);
      }
    }
  }
  return total;
}
