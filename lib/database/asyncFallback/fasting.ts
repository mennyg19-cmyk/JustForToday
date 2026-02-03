import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FastingSession } from '@/lib/database/schema';

const FASTING_KEY = 'lifetrack_fasting_sessions';

export async function getFastingSessionsAsync(): Promise<FastingSession[]> {
  const raw = await AsyncStorage.getItem(FASTING_KEY);
  const data = raw ? JSON.parse(raw) : [];
  return data;
}

export async function createFastingSessionAsync(startAt: string): Promise<FastingSession> {
  const sessions = await getFastingSessionsAsync();
  const newSession: FastingSession = {
    id: Date.now().toString(),
    startAt,
    endAt: null,
  };
  sessions.unshift(newSession);
  await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(sessions));
  return newSession;
}

export async function createFastingSessionWithTimesAsync(
  startAt: string,
  endAt: string
): Promise<FastingSession> {
  const sessions = await getFastingSessionsAsync();
  const newSession: FastingSession = {
    id: Date.now().toString(),
    startAt,
    endAt,
  };
  sessions.unshift(newSession);
  await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(sessions));
  return newSession;
}

export async function endFastingSessionAsync(
  sessionId: string,
  endAt: string
): Promise<FastingSession> {
  const sessions = await getFastingSessionsAsync();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index === -1) throw new Error('Fasting session not found');
  const updated: FastingSession = { ...sessions[index], endAt };
  sessions[index] = updated;
  await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(sessions));
  return updated;
}

export async function updateFastingSessionAsync(
  sessionId: string,
  updates: { startAt?: string; endAt?: string | null }
): Promise<FastingSession> {
  const sessions = await getFastingSessionsAsync();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index === -1) throw new Error('Fasting session not found');
  const updated: FastingSession = {
    ...sessions[index],
    ...(updates.startAt != null && { startAt: updates.startAt }),
    ...(updates.endAt !== undefined && { endAt: updates.endAt }),
  };
  sessions[index] = updated;
  await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(sessions));
  return updated;
}

export async function deleteFastingSessionAsync(sessionId: string): Promise<void> {
  const sessions = await getFastingSessionsAsync();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  await AsyncStorage.setItem(FASTING_KEY, JSON.stringify(filtered));
}
