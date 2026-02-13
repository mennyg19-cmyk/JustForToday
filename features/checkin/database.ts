/** Database operations for daily check-ins (SQLite + AsyncStorage fallback). */

import { getDatabase, isSQLiteAvailable } from '@/lib/database/db';
import type {
  DailyCheckIn,
  DailyCheckInRow,
} from '@/lib/database/schema';
import * as asyncCheckin from '@/lib/database/asyncFallback/checkin';
import { triggerSync } from '@/lib/sync';

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

export async function deleteCheckIn(date: string): Promise<void> {
  if (!(await isSQLiteAvailable())) {
    await asyncCheckin.deleteCheckInAsync(date);
    return;
  }

  const db = await getDatabase();
  await db.runAsync('DELETE FROM daily_checkins WHERE date = ?', [date]);
  triggerSync();
}

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
