import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type { SobrietyCounter } from '@/lib/database/schema';
import { getSobrietyOrder, saveSobrietyOrder } from '@/lib/settings';
import { triggerSync } from '@/lib/sync';
import * as asyncSobriety from '@/lib/database/asyncFallback/sobriety';

function calculateLongestStreak(
  history: Record<string, boolean>,
  startDate: string
): number {
  const start = new Date(startDate);
  const today = new Date();
  let longestStreak = 0;
  let currentStreak = 0;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const dateKey = `${y}-${mo}-${da}`;
    const isSober = history[dateKey] !== false;
    if (isSober) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  return longestStreak;
}

function rowToCounter(
  row: {
    id: string;
    display_name: string;
    actual_name: string | null;
    start_date: string;
    current_streak_start: string;
    longest_streak: number;
    notes: string | null;
    order_index: number;
    last_daily_renewal: string | null;
  },
  history: Record<string, boolean>
): SobrietyCounter {
  return {
    id: row.id,
    displayName: row.display_name,
    actualName: row.actual_name ?? undefined,
    startDate: row.start_date,
    currentStreakStart: row.current_streak_start,
    longestStreak: row.longest_streak,
    notes: row.notes ?? undefined,
    allHistory: history,
    lastDailyRenewal: row.last_daily_renewal ?? undefined,
  };
}

export async function getSobrietyCounters(): Promise<SobrietyCounter[]> {
  if (!(await isSQLiteAvailable())) {
    const order = await getSobrietyOrder();
    const list = await asyncSobriety.getSobrietyCountersAsync();
    if (order.length > 0) {
      const orderMap = new Map(order.map((id, i) => [id, i]));
      list.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }
    return list;
  }

  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    display_name: string;
    actual_name: string | null;
    start_date: string;
    current_streak_start: string;
    longest_streak: number;
    notes: string | null;
    order_index: number;
    last_daily_renewal: string | null;
  }>('SELECT * FROM sobriety_counters ORDER BY order_index ASC');

  // Only load history for existing counters
  const counterIds = rows.map((r) => r.id);
  const historyRows = counterIds.length > 0
    ? await db.getAllAsync<{
        counter_id: string;
        date: string;
        tracked: number;
      }>(`SELECT * FROM sobriety_history WHERE counter_id IN (${counterIds.map(() => '?').join(',')})`, counterIds)
    : [];

  const historyByCounter: Record<string, Record<string, boolean>> = {};
  for (const h of historyRows) {
    if (!historyByCounter[h.counter_id]) historyByCounter[h.counter_id] = {};
    historyByCounter[h.counter_id][h.date] = h.tracked === 1;
  }

  return rows.map((row) =>
    rowToCounter(row, historyByCounter[row.id] ?? {})
  );
}

export async function createSobrietyCounter(
  displayName: string,
  actualName?: string,
  notes?: string,
  startDateISO?: string
): Promise<SobrietyCounter> {
  if (!(await isSQLiteAvailable())) {
    return asyncSobriety.createSobrietyCounterAsync(
      displayName,
      actualName,
      notes,
      startDateISO
    );
  }

  const db = await getDatabase();
  const id = Date.now().toString();
  const startISO = startDateISO ?? new Date().toISOString();
  const maxOrder = await db.getFirstAsync<{ max_order: number }>(
    'SELECT MAX(order_index) as max_order FROM sobriety_counters'
  );
  const orderIndex = (maxOrder?.max_order ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO sobriety_counters (id, display_name, actual_name, start_date, current_streak_start, longest_streak, notes, order_index)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [id, displayName, actualName ?? null, startISO, startISO, notes ?? null, orderIndex]
  );
  triggerSync();

  const list = await getSobrietyCounters();
  const created = list.find((c) => c.id === id);
  if (!created) throw new Error('Failed to create counter');
  return created;
}

export async function toggleSobrietyDay(
  counterId: string,
  dateKey: string
): Promise<SobrietyCounter> {
  if (!(await isSQLiteAvailable())) {
    return asyncSobriety.toggleSobrietyDayAsync(counterId, dateKey);
  }

  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ tracked: number }>(
    'SELECT tracked FROM sobriety_history WHERE counter_id = ? AND date = ?',
    [counterId, dateKey]
  );
  const newTracked = existing ? (existing.tracked === 0 ? 1 : 0) : 1;

  if (existing) {
    await db.runAsync(
      'UPDATE sobriety_history SET tracked = ? WHERE counter_id = ? AND date = ?',
      [newTracked, counterId, dateKey]
    );
  } else {
    await db.runAsync(
      'INSERT INTO sobriety_history (counter_id, date, tracked) VALUES (?, ?, ?)',
      [counterId, dateKey, newTracked]
    );
  }

  const counters = await getSobrietyCounters();
  const counter = counters.find((c) => c.id === counterId);
  if (!counter) throw new Error('Counter not found');
  const newLongest = calculateLongestStreak(
    counter.allHistory,
    counter.startDate
  );
  await db.runAsync(
    'UPDATE sobriety_counters SET longest_streak = ? WHERE id = ?',
    [newLongest, counterId]
  );
  triggerSync();
  const updated = await getSobrietyCounters();
  const out = updated.find((c) => c.id === counterId);
  if (!out) throw new Error('Counter not found');
  return { ...out, longestStreak: newLongest };
}

export async function updateSobrietyCounter(
  counterId: string,
  updates: Partial<{
    displayName: string;
    actualName: string;
    currentStreakStart: string;
    notes: string;
    longestStreak: number;
  }>
): Promise<SobrietyCounter> {
  if (!(await isSQLiteAvailable())) {
    return asyncSobriety.updateSobrietyCounterAsync(counterId, updates);
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    display_name: string;
    actual_name: string | null;
    current_streak_start: string;
    notes: string | null;
    longest_streak: number;
  }>('SELECT display_name, actual_name, current_streak_start, notes, longest_streak FROM sobriety_counters WHERE id = ?', [
    counterId,
  ]);
  if (!row) throw new Error('Counter not found');

  const displayName = updates.displayName ?? row.display_name;
  const actualName = updates.actualName !== undefined ? updates.actualName : row.actual_name;
  const currentStreakStart = updates.currentStreakStart ?? row.current_streak_start;
  const notes = updates.notes !== undefined ? updates.notes : row.notes;
  const longestStreak = updates.longestStreak ?? row.longest_streak;

  await db.runAsync(
    `UPDATE sobriety_counters SET display_name = ?, actual_name = ?, current_streak_start = ?, notes = ?, longest_streak = ? WHERE id = ?`,
    [displayName, actualName ?? null, currentStreakStart, notes ?? null, longestStreak, counterId]
  );
  triggerSync();

  const list = await getSobrietyCounters();
  const out = list.find((c) => c.id === counterId);
  if (!out) throw new Error('Counter not found');
  return out;
}

export async function deleteSobrietyCounter(counterId: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncSobriety.deleteSobrietyCounterAsync(counterId);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sobriety_history WHERE counter_id = ?', [counterId]);
  await db.runAsync('DELETE FROM sobriety_counters WHERE id = ?', [counterId]);
  triggerSync();
}

export async function saveSobrietyCountersOrder(order: string[]): Promise<void> {
  await saveSobrietyOrder(order);
  if (await isSQLiteAvailable()) {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < order.length; i++) {
        await db.runAsync(
          'UPDATE sobriety_counters SET order_index = ? WHERE id = ?',
          [i, order[i]]
        );
      }
    });
    triggerSync();
  }
}

/** Set last 24h commitment renewal timestamp for Daily Renewal. */
export async function setLastDailyRenewal(
  counterId: string,
  isoTimestamp: string
): Promise<SobrietyCounter> {
  if (!(await isSQLiteAvailable())) {
    return asyncSobriety.setLastDailyRenewalAsync(counterId, isoTimestamp);
  }
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sobriety_counters SET last_daily_renewal = ? WHERE id = ?',
    [isoTimestamp, counterId]
  );
  triggerSync();
  const list = await getSobrietyCounters();
  const out = list.find((c) => c.id === counterId);
  if (!out) throw new Error('Counter not found');
  return out;
}
