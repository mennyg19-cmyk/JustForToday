import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SobrietyCounter } from '@/lib/database/schema';

const SOBRIETY_KEY = 'lifetrack_sobriety';

function calculateLongestStreak(
  history: Record<string, boolean>,
  startDate: string
): number {
  const start = new Date(startDate);
  const today = new Date();
  let longestStreak = 0;
  let currentStreak = 0;

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
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

export async function getSobrietyCountersAsync(): Promise<SobrietyCounter[]> {
  const raw = await AsyncStorage.getItem(SOBRIETY_KEY);
  const data = raw ? JSON.parse(raw) : [];
  const migrated = data.map((c: any) => ({
    ...c,
    currentStreakStart: c.currentStreakStart ?? c.startDate,
    allHistory: c.allHistory ?? c.history ?? {},
    lastDailyRenewal: c.lastDailyRenewal ?? undefined,
  }));
  return migrated;
}

export async function saveSobrietyCountersAsync(
  counters: SobrietyCounter[]
): Promise<void> {
  await AsyncStorage.setItem(SOBRIETY_KEY, JSON.stringify(counters));
}

export async function createSobrietyCounterAsync(
  displayName: string,
  actualName?: string,
  notes?: string,
  startDateISO?: string
): Promise<SobrietyCounter> {
  const counters = await getSobrietyCountersAsync();
  const startISO = startDateISO ?? new Date().toISOString();
  const newCounter: SobrietyCounter = {
    id: Date.now().toString(),
    displayName,
    actualName,
    startDate: startISO,
    currentStreakStart: startISO,
    allHistory: {},
    longestStreak: 0,
    notes,
  };
  counters.push(newCounter);
  await saveSobrietyCountersAsync(counters);
  return newCounter;
}

export async function toggleSobrietyDayAsync(
  counterId: string,
  dateKey: string
): Promise<SobrietyCounter> {
  const counters = await getSobrietyCountersAsync();
  const counter = counters.find((c) => c.id === counterId);
  if (!counter) throw new Error('Counter not found');

  const prev = counter.allHistory[dateKey];
  counter.allHistory[dateKey] = prev === true ? false : true;
  counter.longestStreak = calculateLongestStreak(
    counter.allHistory,
    counter.startDate
  );
  await saveSobrietyCountersAsync(counters);
  return counter;
}

export async function updateSobrietyCounterAsync(
  counterId: string,
  updates: Partial<Pick<SobrietyCounter, 'displayName' | 'actualName' | 'currentStreakStart' | 'notes'>>
): Promise<SobrietyCounter> {
  const counters = await getSobrietyCountersAsync();
  const idx = counters.findIndex((c) => c.id === counterId);
  if (idx === -1) throw new Error('Counter not found');
  counters[idx] = { ...counters[idx], ...updates };
  await saveSobrietyCountersAsync(counters);
  return counters[idx];
}

export async function deleteSobrietyCounterAsync(counterId: string): Promise<void> {
  const counters = await getSobrietyCountersAsync();
  const filtered = counters.filter((c) => c.id !== counterId);
  await saveSobrietyCountersAsync(filtered);
}

export async function setLastDailyRenewalAsync(
  counterId: string,
  isoTimestamp: string
): Promise<SobrietyCounter> {
  const counters = await getSobrietyCountersAsync();
  const counter = counters.find((c) => c.id === counterId);
  if (!counter) throw new Error('Counter not found');
  counter.lastDailyRenewal = isoTimestamp;
  await saveSobrietyCountersAsync(counters);
  return counter;
}
