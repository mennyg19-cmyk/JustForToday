/**
 * CheckedInCard — shown on the dashboard when the user has already checked in today.
 *
 * Displays live commitment countdown, encouragement messages,
 * per-challenge TODO checkboxes, and a reset option.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle, Check } from 'lucide-react-native';
import type { DailyCheckIn } from '@/lib/database/schema';
import { commitmentLabel, getCommitmentRemainingMs, commitmentDurationMs } from '@/lib/commitment';
import { useIconColors } from '@/lib/iconTheme';

/** Rotating encouragement messages for an active countdown. */
const COUNTDOWN_MESSAGES = [
  'You are doing this.',
  'One moment at a time.',
  'You chose this. You can do it.',
  'Stay with it.',
  'This hour is yours.',
  'Keep going — you are stronger than you think.',
  'Right now, you are succeeding.',
];

function getCountdownMessage(): string {
  const idx = Math.floor(Date.now() / 60000) % COUNTDOWN_MESSAGES.length;
  return COUNTDOWN_MESSAGES[idx];
}

const TODOS_KEY_PREFIX = 'lifetrack_todos_';
const COMMITTED_KEY_PREFIX = 'lifetrack_committed_';

interface CheckedInCardProps {
  todayCheckIn: DailyCheckIn;
  onReset: () => void;
  encouragement: string;
  isDark: boolean;
}

export function CheckedInCard({ todayCheckIn, onReset, encouragement, isDark }: CheckedInCardProps) {
  const hasTimedCommitment = todayCheckIn.commitmentType !== 'none';

  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    getCommitmentRemainingMs(todayCheckIn)
  );
  const [countdownMsg, setCountdownMsg] = useState(getCountdownMessage);
  const [confirmReset, setConfirmReset] = useState(false);

  const todoLines = todayCheckIn.todoText
    ? todayCheckIn.todoText.split('\n').filter(Boolean)
    : [];
  const [todosCompleted, setTodosCompleted] = useState<boolean[]>(() =>
    todoLines.map(() => todayCheckIn.todoCompleted)
  );
  const [committedNames, setCommittedNames] = useState<string[]>([]);

  useEffect(() => {
    const dateKey = todayCheckIn.date;
    AsyncStorage.getItem(TODOS_KEY_PREFIX + dateKey).then((raw) => {
      if (raw) {
        try {
          const arr = JSON.parse(raw) as boolean[];
          setTodosCompleted(todoLines.map((_, i) => arr[i] ?? false));
        } catch {
          setTodosCompleted(todoLines.map(() => todayCheckIn.todoCompleted));
        }
      }
    }).catch(() => {});

    AsyncStorage.getItem(COMMITTED_KEY_PREFIX + dateKey).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const names = parsed.map((item: { name?: string } | string) =>
            typeof item === 'string' ? item : item.name
          );
          setCommittedNames(names);
        } catch { /* best-effort */ }
      }
    }).catch(() => {});
  }, [todayCheckIn.date]);

  const toggleTodoItem = useCallback(async (index: number) => {
    const next = [...todosCompleted];
    next[index] = !next[index];
    setTodosCompleted(next);
    await AsyncStorage.setItem(
      TODOS_KEY_PREFIX + todayCheckIn.date,
      JSON.stringify(next)
    ).catch(() => {});
  }, [todosCompleted, todayCheckIn.date]);

  useEffect(() => {
    if (!hasTimedCommitment) return;
    const tick = () => {
      setRemainingMs(getCommitmentRemainingMs(todayCheckIn));
      setCountdownMsg(getCountdownMessage());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [todayCheckIn, hasTimedCommitment]);

  const commitmentActive = remainingMs != null && remainingMs > 0;

  const formatCountdown = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const cardBg = isDark ? 'rgba(50,42,28,1)' : 'rgba(245,238,220,1)';
  const accentBorder = isDark ? 'rgba(160,125,60,0.4)' : 'rgba(212,178,106,0.5)';
  const accentText = isDark ? '#F0E6C8' : '#64511A';

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: accentBorder }}>
      <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }} className="gap-3">
        <Text style={{ color: accentText }} className="text-sm italic text-center">
          {commitmentActive ? countdownMsg : encouragement}
        </Text>

        <View className="flex-row items-center justify-center gap-2">
          <CheckCircle size={18} color={accentText} />
          <Text className="text-foreground font-bold text-base">
            {hasTimedCommitment
              ? commitmentLabel(todayCheckIn.commitmentType)
              : 'Checked in for today'}
          </Text>
        </View>

        {committedNames.length > 0 && (
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">{committedNames.join(' · ')}</Text>
          </View>
        )}

        {hasTimedCommitment && commitmentActive && remainingMs != null && (
          <View className="items-center py-3">
            <Text style={{ color: accentText }} className="font-bold text-4xl tracking-wider">
              {formatCountdown(remainingMs)}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">remaining</Text>
          </View>
        )}

        {hasTimedCommitment && !commitmentActive && (
          <View className="items-center py-2">
            <Text className="text-muted-foreground text-sm">Commitment complete — well done.</Text>
          </View>
        )}
      </View>

      <View className="bg-card px-5 pb-4 pt-3 gap-3">
        {todoLines.length > 0 && (
          <View className="gap-2">
            {todoLines.map((line, i) => {
              const done = todosCompleted[i] ?? false;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleTodoItem(i)}
                  activeOpacity={0.7}
                  className="flex-row items-start gap-3 bg-muted rounded-xl p-3"
                >
                  <View
                    className={`w-5 h-5 rounded border mt-0.5 items-center justify-center ${
                      done ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {done && <Check size={12} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text className={`flex-1 text-sm ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {line}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!confirmReset ? (
          <TouchableOpacity onPress={() => setConfirmReset(true)} activeOpacity={0.7} className="self-center py-1">
            <Text className="text-muted-foreground text-xs">Reset and start over</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center justify-center gap-4 py-1">
            <Text className="text-sm text-foreground">Start a new check-in?</Text>
            <TouchableOpacity
              onPress={() => { setConfirmReset(false); onReset(); }}
              activeOpacity={0.7}
              className="bg-destructive/20 rounded-lg px-3 py-1.5"
            >
              <Text className="text-destructive text-sm font-semibold">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmReset(false)}
              activeOpacity={0.7}
              className="bg-muted rounded-lg px-3 py-1.5"
            >
              <Text className="text-muted-foreground text-sm font-semibold">No</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// LastCommitmentInfo — shows how long ago the last commitment expired
// ---------------------------------------------------------------------------

function formatTimeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function LastCommitmentInfo({ lastCheckIn }: { lastCheckIn: DailyCheckIn | null }) {
  if (!lastCheckIn) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (lastCheckIn.date === today) return null;

  if (lastCheckIn.commitmentType === 'none') {
    return (
      <Text className="text-muted-foreground text-xs text-center">
        Last check-in was on {new Date(lastCheckIn.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </Text>
    );
  }

  const durationMs = commitmentDurationMs(lastCheckIn.commitmentType);
  if (durationMs == null) return null;

  const startMs = new Date(lastCheckIn.createdAt).getTime();
  const expiredAtMs = startMs + durationMs;
  const agoMs = Date.now() - expiredAtMs;

  if (agoMs <= 0) return null;

  return (
    <Text className="text-muted-foreground text-xs text-center">
      Last {commitmentLabel(lastCheckIn.commitmentType).toLowerCase()} expired {formatTimeAgo(agoMs)}
    </Text>
  );
}
