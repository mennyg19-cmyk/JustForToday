/**
 * DailyRenewalScreen — shows per-counter commitment timers.
 *
 * This screen and the check-in flow share the same dataset:
 *   - The check-in creates the commitment and sets `lastDailyRenewal` on each counter.
 *   - This screen reads those timers, using the committed duration (24h or 12h)
 *     stored during check-in rather than a hardcoded 24h.
 *   - Renewing here updates `lastDailyRenewal` and resets that counter's timer.
 *
 * If no check-in exists today, the screen prompts the user to do one.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RotateCcw, CheckCircle } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButtonRow, ModalButton } from '@/components/ModalContent';
import { useSobriety } from '@/features/sobriety/hooks/useSobriety';
import { useCheckIn } from '@/features/checkin/hooks/useCheckIn';
import { useIconColors } from '@/lib/iconTheme';
import { commitmentDurationMs, commitmentLabel } from '@/lib/commitment';
import type { SobrietyCounter, CommitmentType } from '@/lib/database/schema';

// Same key prefix used by CheckInFlow — single source of committed counter data
const COMMITTED_KEY_PREFIX = 'lifetrack_committed_';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Per-counter commitment info saved during check-in. */
interface CommittedCounterInfo {
  id: string;
  name: string;
  duration: CommitmentType;
}

// ---------------------------------------------------------------------------
// Timer helpers — duration is now parameterized instead of hardcoded 24h
// ---------------------------------------------------------------------------

function getCountdown(renewalIso: string, nowMs: number, durationMs: number): string {
  const endMs = new Date(renewalIso).getTime() + durationMs;
  const remainingMs = endMs - nowMs;
  if (remainingMs <= 0) return 'Renew';
  const totalSec = Math.floor(remainingMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** Progress 0–1 (1 = full duration left, 0 = run out). */
function getProgress(renewalIso: string, nowMs: number, durationMs: number): number {
  const endMs = new Date(renewalIso).getTime() + durationMs;
  const remainingMs = endMs - nowMs;
  if (remainingMs <= 0) return 0;
  return Math.min(1, remainingMs / durationMs);
}

/** "until tomorrow at 10:45am" from a given duration. */
function getExpiryLabel(nowMs: number, durationMs: number): string {
  const expiry = new Date(nowMs + durationMs);
  const nowDate = new Date(nowMs);
  const isToday = expiry.getDate() === nowDate.getDate() &&
    expiry.getMonth() === nowDate.getMonth() &&
    expiry.getFullYear() === nowDate.getFullYear();
  const h = expiry.getHours();
  const m = expiry.getMinutes();
  const am = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 || 12;
  const timeStr = `${h12}:${m.toString().padStart(2, '0')}${am}`;
  return isToday ? `until today at ${timeStr}` : `until tomorrow at ${timeStr}`;
}

// ---------------------------------------------------------------------------
// Timer ring component (unchanged)
// ---------------------------------------------------------------------------

function RenewalTimerRing({
  countdown,
  progress,
  size = 72,
  strokeWidth = 6,
  trackColor,
  fillColor,
  textColor,
}: {
  countdown: string;
  progress: number;
  size?: number;
  strokeWidth?: number;
  trackColor: string;
  fillColor: string;
  textColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <View style={{ width: size, height: size, position: 'absolute' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={fillColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <Text
        style={{
          fontSize:
            size >= 120
              ? countdown === 'Renew'
                ? 20
                : 28
              : size >= 70
                ? countdown === 'Renew'
                  ? 14
                  : 18
                : countdown === 'Renew'
                  ? 12
                  : 11,
          fontWeight: '700',
          color: textColor,
        }}
        numberOfLines={1}
      >
        {countdown}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function DailyRenewalScreen() {
  const router = useRouter();
  const backToAnalytics = useBackToAnalytics();
  const { counters, loading, error, refresh, renewDailyCommitment, currentTime } = useSobriety();
  const { todayCheckIn, hasCheckedIn, refresh: refreshCheckIn } = useCheckIn();
  const iconColors = useIconColors();
  const [selectedCounter, setSelectedCounter] = useState<SobrietyCounter | null>(null);
  const [renewing, setRenewing] = useState(false);

  // Per-counter commitment details from today's check-in (shared dataset)
  const [committedDetails, setCommittedDetails] = useState<CommittedCounterInfo[]>([]);

  const nowMs = currentTime.getTime();
  const todayKey = new Date().toISOString().slice(0, 10);

  // Load committed counter details from AsyncStorage (written by CheckInFlow)
  const loadCommittedDetails = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(COMMITTED_KEY_PREFIX + todayKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Handle both old format (string[]) and new format (object[])
        const details: CommittedCounterInfo[] = parsed.map((item: any) =>
          typeof item === 'string'
            ? { id: '', name: item, duration: '24h' as CommitmentType }
            : item
        );
        setCommittedDetails(details);
      } else {
        setCommittedDetails([]);
      }
    } catch {
      setCommittedDetails([]);
    }
  }, [todayKey]);

  // Refresh on mount and on focus
  useEffect(() => { loadCommittedDetails(); }, [loadCommittedDetails]);
  useFocusEffect(useCallback(() => {
    loadCommittedDetails();
    refreshCheckIn();
  }, [loadCommittedDetails, refreshCheckIn]));

  /** Look up the commitment duration for a specific counter. */
  const getDurationForCounter = useCallback((counterId: string): number => {
    const detail = committedDetails.find((d) => d.id === counterId);
    if (detail) {
      return commitmentDurationMs(detail.duration) ?? TWENTY_FOUR_HOURS_MS;
    }
    // Fallback: use overall check-in commitment type, or default 24h
    if (todayCheckIn && todayCheckIn.commitmentType !== 'none') {
      return commitmentDurationMs(todayCheckIn.commitmentType) ?? TWENTY_FOUR_HOURS_MS;
    }
    return TWENTY_FOUR_HOURS_MS;
  }, [committedDetails, todayCheckIn]);

  /** Whether a counter was part of today's check-in commitment. */
  const isCommittedToday = useCallback((counterId: string): boolean => {
    return committedDetails.some((d) => d.id === counterId);
  }, [committedDetails]);

  const counterWithCountdown = useMemo(
    () =>
      counters.map((c) => {
        const durationMs = getDurationForCounter(c.id);
        const countdown = c.lastDailyRenewal
          ? getCountdown(c.lastDailyRenewal, nowMs, durationMs)
          : 'Renew';
        const progress = c.lastDailyRenewal
          ? getProgress(c.lastDailyRenewal, nowMs, durationMs)
          : 0;
        const committed = isCommittedToday(c.id);
        return { counter: c, countdown, progress, committed, durationMs };
      }),
    [counters, nowMs, getDurationForCounter, isCommittedToday]
  );

  const onConfirmRenew = useCallback(async () => {
    if (!selectedCounter) return;
    setRenewing(true);
    try {
      await renewDailyCommitment(selectedCounter.id);
      setSelectedCounter(null);
    } finally {
      setRenewing(false);
    }
  }, [selectedCounter, renewDailyCommitment]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Daily Renewal" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  // Duration label for the selected counter's modal
  const selectedDurationMs = selectedCounter ? getDurationForCounter(selectedCounter.id) : TWENTY_FOUR_HOURS_MS;
  const selectedDurationLabel = selectedDurationMs === TWENTY_FOUR_HOURS_MS ? '24-hour' : '12-hour';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Daily Renewal" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        {/* ---- Check-in status banner ---- */}
        {hasCheckedIn && todayCheckIn ? (
          <View className="bg-card rounded-xl p-4 border border-border mb-4 flex-row items-center gap-3">
            <CheckCircle size={20} color={iconColors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-sm">
                {todayCheckIn.commitmentType !== 'none'
                  ? commitmentLabel(todayCheckIn.commitmentType)
                  : 'Checked in — no timed commitment'}
              </Text>
              {committedDetails.length > 0 && (
                <Text className="text-muted-foreground text-xs mt-0.5">
                  {committedDetails.map((d) => d.name).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/check-in')}
            activeOpacity={0.8}
            className="bg-primary/10 rounded-xl p-4 border border-primary/30 mb-4"
          >
            <Text className="text-primary font-semibold text-sm text-center">
              No commitment yet today — tap to check in
            </Text>
          </TouchableOpacity>
        )}

        <Text className="text-muted-foreground text-sm mb-4">
          One day at a time. Tap a card to renew your commitment for that counter.
        </Text>

        {counters.length === 0 ? (
          <View className="items-center py-12">
            <RotateCcw size={48} className="text-muted-foreground mb-4" />
            <Text className="text-lg font-bold text-foreground text-center mb-2">
              No addictions added yet
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              Add sobriety counters in the Sobriety section first. Each counter gets its own renewal timer here.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/sobriety')}
              className="bg-primary px-6 py-3 rounded-xl"
            >
              <Text className="text-primary-foreground font-semibold">Go to Sobriety</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {counterWithCountdown.map(({ counter, countdown, progress, committed, durationMs }) => {
              const durationLabel = durationMs === TWENTY_FOUR_HOURS_MS ? '24h' : '12h';
              return (
                <TouchableOpacity
                  key={counter.id}
                  onPress={() => setSelectedCounter(counter)}
                  activeOpacity={0.8}
                  className="w-[48%] bg-card rounded-2xl p-3 border border-border shadow-card mb-4"
                  style={{ aspectRatio: 1 }}
                >
                  <View className="flex-1 justify-between">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 pr-1">
                        <Text
                          className="text-sm font-bold text-foreground"
                          numberOfLines={2}
                        >
                          {counter.displayName}
                        </Text>
                        {counter.actualName ? (
                          <Text
                            className="text-[11px] text-muted-foreground mt-1"
                            numberOfLines={1}
                          >
                            {counter.actualName}
                          </Text>
                        ) : null}
                      </View>
                      <RotateCcw size={14} color={iconColors.muted} />
                    </View>

                    <View className="items-center justify-center bg-muted rounded-xl py-3 mb-2 min-h-[88px]">
                      <RenewalTimerRing
                        countdown={countdown}
                        progress={progress}
                        size={76}
                        strokeWidth={6}
                        trackColor={iconColors.muted}
                        fillColor={countdown === 'Renew' ? iconColors.accent : iconColors.primary}
                        textColor={countdown === 'Renew' ? iconColors.accent : iconColors.foreground}
                      />
                    </View>

                    <Text className="text-xs text-muted-foreground">
                      {committed
                        ? `Committed ${durationLabel}`
                        : `Tap to renew ${durationLabel}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ModalSurface
        visible={!!selectedCounter}
        onRequestClose={() => !renewing && setSelectedCounter(null)}
        contentClassName="p-6"
      >
        {selectedCounter && (() => {
          const countdown = selectedCounter.lastDailyRenewal
            ? getCountdown(selectedCounter.lastDailyRenewal, nowMs, selectedDurationMs)
            : 'Renew';
          const progress = selectedCounter.lastDailyRenewal
            ? getProgress(selectedCounter.lastDailyRenewal, nowMs, selectedDurationMs)
            : 0;
          return (
            <>
              <Text className="text-lg font-bold text-modal-content-foreground mb-1">
                Renew your {selectedDurationLabel} commitment?
              </Text>
              <Text className="text-modal-content-foreground/80 mb-2">
                Are you sure? Renewing means you're committing not to use{' '}
                <Text className="font-semibold text-modal-content-foreground">
                  {getExpiryLabel(nowMs, selectedDurationMs)}
                </Text>
                . After that, you're free to choose. One day at a time — you've got this.
              </Text>
              <View className="items-center justify-center my-6">
                <RenewalTimerRing
                  countdown={countdown}
                  progress={progress}
                  size={160}
                  strokeWidth={10}
                  trackColor={iconColors.muted}
                  fillColor={iconColors.primary}
                  textColor={iconColors.foreground}
                />
              </View>
              <Text className="text-center text-sm text-modal-content-foreground/70 mb-4">
                "{selectedCounter.displayName}" — tap Renew to commit from now.
              </Text>
              <ModalButtonRow>
                <ModalButton
                  variant="secondary"
                  onPress={() => setSelectedCounter(null)}
                  disabled={renewing}
                >
                  Cancel
                </ModalButton>
                <ModalButton
                  variant="primary"
                  onPress={onConfirmRenew}
                  loading={renewing}
                >
                  Renew
                </ModalButton>
              </ModalButtonRow>
            </>
          );
        })()}
      </ModalSurface>
    </SafeAreaView>
  );
}
