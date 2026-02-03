import AsyncStorage from '@react-native-async-storage/async-storage';

const STEPS_KEY = 'lifetrack_steps_data';

export interface StepsRecord {
  date: string;
  steps_count: number;
  source: 'healthkit' | 'manual';
}

async function getAll(): Promise<StepsRecord[]> {
  const raw = await AsyncStorage.getItem(STEPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveAll(records: StepsRecord[]): Promise<void> {
  await AsyncStorage.setItem(STEPS_KEY, JSON.stringify(records));
}

export async function getStepsForDateAsync(dateKey: string): Promise<number> {
  const records = await getAll();
  const row = records.find((r) => r.date === dateKey);
  return row?.steps_count ?? 0;
}

export async function setStepsForDateAsync(
  dateKey: string,
  stepsCount: number,
  source: 'healthkit' | 'manual'
): Promise<void> {
  const records = await getAll();
  const index = records.findIndex((r) => r.date === dateKey);
  const row: StepsRecord = { date: dateKey, steps_count: stepsCount, source };
  if (index >= 0) {
    records[index] = row;
  } else {
    records.push(row);
    records.sort((a, b) => b.date.localeCompare(a.date));
  }
  await saveAll(records);
}

export interface StepsDayRecord {
  date: string;
  steps_count: number;
}

export async function getStepsForDatesAsync(dateKeys: string[]): Promise<StepsDayRecord[]> {
  if (dateKeys.length === 0) return [];
  const records = await getAll();
  const byDate = new Map(records.map((r) => [r.date, r.steps_count]));
  return dateKeys.map((date) => ({
    date,
    steps_count: byDate.get(date) ?? 0,
  }));
}
