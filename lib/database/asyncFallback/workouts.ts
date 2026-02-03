import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Workout } from '@/lib/database/schema';

const WORKOUTS_KEY = 'lifetrack_workouts';

async function getAll(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export async function getWorkoutsForDateAsync(dateKey: string): Promise<Workout[]> {
  const all = await getAll();
  return all.filter((w) => w.date === dateKey).sort((a, b) => b.id.localeCompare(a.id));
}

export async function addWorkoutAsync(workout: Workout): Promise<void> {
  const all = await getAll();
  all.unshift(workout);
  await saveAll(all);
}

export async function deleteWorkoutAsync(id: string): Promise<void> {
  const all = await getAll();
  await saveAll(all.filter((w) => w.id !== id));
}
