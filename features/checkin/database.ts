/**
 * Database operations for daily check-ins.
 *
 * Follows the same SQLite-with-AsyncStorage-fallback pattern as every other
 * feature in this codebase. One row per calendar day in the daily_checkins table.
 *
 * Used by: useCheckIn hook, home screen, commitment helpers.
 */

import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type {
  DailyCheckIn,
  DailyCheckInRow,
} from '@/lib/database/schema';
import * as asyncCheckin from '@/lib/database/asyncFallback/checkin';
import { triggerSync } from '@/lib/sync';

/** Convert a database row to the domain type. */
function rowToCheckIn(row: DailyCheckInRow): DailyCheckIn {
  return {
    date: row.date,
    commitmentType: row.commitment_type,
    challenge: row.challenge,
    plan: row.plan,
    todoText: row.todo_text,
    todoCompleted: row.todo_completed === 1,
    createdAt: row.created_at,
  };
}

/** Get the check-in for a specific date, or null if none exists. */
export async function getCheckInForDate(date: string): Promise<DailyCheckIn | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncCheckin.getCheckInForDateAsync(date);
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<DailyCheckInRow>(
    'SELECT * FROM daily_checkins WHERE date = ?',
    [date]
  );
  return row ? rowToCheckIn(row) : null;
}

/** Save (insert or replace) a check-in for a given day. */
export async function saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncCheckin.saveCheckInAsync(checkIn);
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_checkins
      (date, commitment_type, challenge, plan, todo_text, todo_completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      checkIn.date,
      checkIn.commitmentType,
      checkIn.challenge,
      checkIn.plan,
      checkIn.todoText,
      checkIn.todoCompleted ? 1 : 0,
      checkIn.createdAt,
    ]
  );
  triggerSync();
}

/** Toggle the TODO completed status for today's check-in. */
export async function updateTodoCompleted(date: string, completed: boolean): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncCheckin.updateTodoCompletedAsync(date, completed);
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    'UPDATE daily_checkins SET todo_completed = ? WHERE date = ?',
    [completed ? 1 : 0, date]
  );
  triggerSync();
}

/**
 * Get the most recent check-in (any date), or null if none exist.
 * Used on the home screen to show time since last commitment expired.
 */
export async function getMostRecentCheckIn(): Promise<DailyCheckIn | null> {
  if (!(await isSQLiteAvailable())) {
    return asyncCheckin.getMostRecentCheckInAsync();
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<DailyCheckInRow>(
    'SELECT * FROM daily_checkins ORDER BY date DESC LIMIT 1'
  );
  return row ? rowToCheckIn(row) : null;
}

/**
 * Delete a check-in for a specific date.
 * Used when the user wants to reset and redo their commitment.
 */
export async function deleteCheckIn(date: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncCheckin.deleteCheckInAsync(date);
    return;
  }

  const db = await getDatabase();
  await db.runAsync('DELETE FROM daily_checkins WHERE date = ?', [date]);
  triggerSync();
}

/**
 * Get all check-ins, ordered newest-first.
 * Used by the analytics page for commitment history.
 */
export async function getAllCheckIns(): Promise<DailyCheckIn[]> {
  if (!(await isSQLiteAvailable())) {
    return asyncCheckin.getAllCheckInsAsync();
  }

  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyCheckInRow>(
    'SELECT * FROM daily_checkins ORDER BY date DESC'
  );
  return rows.map(rowToCheckIn);
}
