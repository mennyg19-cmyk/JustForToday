/**
 * CheckInFlow — the daily check-in screen.
 *
 * Walks the user through:
 *   Step 1: Commitment choice (informed by sobriety counters)
 *     - 0 counters → prompt to add addictions first
 *     - 1 counter  → simple 24h → 12h → none cascade
 *     - 2+ counters → checklist: pick which to commit 24h, rest offered 12h
 *   Step 2: Reflection — multiple challenge/plan pairs (+ button to add more)
 *   Step 3: Confirmation with encouragement
 *
 * Design: calm, spacious, no pressure. Declining is never failure.
 *
 * Draft persistence: challenge/plan text saved to AsyncStorage in case
 * the user leaves mid-flow. On re-entry the flow starts from step 1
 * with those fields pre-filled.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, X, Check, CheckCircle, ChevronLeft } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCheckIn } from './hooks/useCheckIn';
import { useSobriety } from '@/features/sobriety/hooks/useSobriety';
import { getEncouragement } from '@/lib/encouragement';
import type { CommitmentType, SobrietyCounter, DailyCheckIn } from '@/lib/database/schema';
import { commitmentLabel, commitmentDurationMs, getCommitmentRemainingMs } from '@/lib/commitment';
import { useIconColors } from '@/lib/iconTheme';
import { getTodayKey } from '@/utils/date';
import { logger } from '@/lib/logger';

import type { ChallengePair } from './types';
import { COMMITTED_KEY_PREFIX, DRAFT_KEY_PAIRS } from './types';
export type { CommittedCounterInfo } from './types';

type FlowStep = 'commitment' | 'reflection' | 'done';

export function CheckInFlow() {
  const router = useRouter();
  const {
    submitCheckIn,
    hasCheckedIn,
    todayCheckIn,
    resetCheckIn,
    loading: checkInLoading,
    refresh: refreshCheckIn,
  } = useCheckIn();
  const { counters, renewDailyCommitment, refresh: refreshCounters } = useSobriety();
  const iconColors = useIconColors();

  // -- Flow state --
  const [step, setStep] = useState<FlowStep>('commitment');
  const [chosenCommitment, setChosenCommitment] = useState<CommitmentType>('none');
  // For multi-counter mode: which counters get 24h, which get 12h
  const [committed24h, setCommitted24h] = useState<Set<string>>(new Set());
  const [committed12h, setCommitted12h] = useState<Set<string>>(new Set());
  // Challenge/plan pairs — starts with one empty pair
  const [pairs, setPairs] = useState<ChallengePair[]>([{ challenge: '', plan: '' }]);
  const [saving, setSaving] = useState(false);

  // Reset all flow state to initial values
  const resetFlowState = useCallback(() => {
    setStep('commitment');
    setSaving(false);
    setChosenCommitment('none');
    setCommitted24h(new Set());
    setCommitted12h(new Set());
  }, []);

  // Refresh check-in state and counters every time this screen gains focus —
  // handles coming back after a reset or after adding a new addiction.
  useFocusEffect(
    useCallback(() => {
      refreshCheckIn();
      refreshCounters();
    }, [refreshCheckIn, refreshCounters])
  );

  // When we learn there's no check-in (either on first load or after a reset),
  // make sure the flow starts from the beginning.
  useEffect(() => {
    if (!checkInLoading && !hasCheckedIn) {
      resetFlowState();
    }
  }, [checkInLoading, hasCheckedIn, resetFlowState]);

  // Load draft text on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY_PAIRS);
        if (raw) {
          const parsed = JSON.parse(raw) as ChallengePair[];
          if (Array.isArray(parsed) && parsed.length > 0) setPairs(parsed);
        }
      } catch {
        // best-effort
      }
    })();
  }, []);

  // Persist draft pairs whenever they change
  useEffect(() => {
    AsyncStorage.setItem(DRAFT_KEY_PAIRS, JSON.stringify(pairs)).catch(() => {});
  }, [pairs]);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.multiRemove([
      DRAFT_KEY_PAIRS,
      // Also clean up old draft keys from previous version
      'lifetrack_checkin_draft_challenge',
      'lifetrack_checkin_draft_plan',
    ]).catch(() => {});
  }, []);

  // -- Pair management --
  const updatePair = useCallback((index: number, field: keyof ChallengePair, value: string) => {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }, []);

  const addPair = useCallback(() => {
    setPairs((prev) => [...prev, { challenge: '', plan: '' }]);
  }, []);

  const removePair = useCallback((index: number) => {
    setPairs((prev) => {
      if (prev.length <= 1) return prev; // always keep at least one
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // -- Commitment handlers --
  /**
   * Single-counter (or simple) flow: accept a commitment type directly.
   */
  const handleSimpleAccept = useCallback((type: CommitmentType) => {
    setChosenCommitment(type);
    if (type === 'none') {
      setStep('done');
    } else {
      setStep('reflection');
    }
  }, []);

  /**
   * Multi-counter flow: user finished the checklist.
   * Anything checked = 24h. The rest will be offered 12h next.
   */
  const handleMultiCommitDone = useCallback(
    (checked24h: Set<string>, checked12h: Set<string>) => {
      setCommitted24h(checked24h);
      setCommitted12h(checked12h);
      // Determine the "overall" commitment type for the check-in record:
      // If any counter got 24h, the check-in is 24h; else if any got 12h, 12h; else none.
      if (checked24h.size > 0) {
        setChosenCommitment('24h');
      } else if (checked12h.size > 0) {
        setChosenCommitment('12h');
      } else {
        setChosenCommitment('none');
      }
      if (checked24h.size > 0 || checked12h.size > 0) {
        setStep('reflection');
      } else {
        setStep('done');
      }
    },
    []
  );

  /** Save the check-in and navigate home. */
  const handleFinish = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await submitCheckIn(chosenCommitment, pairs);

      // Save committed counter details — shared by both the home-screen card
      // and the Daily Renewal screen so they read from the same dataset.
      const committedInfo: CommittedCounterInfo[] = [];
      if (counters.length > 0) {
        for (const c of counters) {
          const is24h = committed24h.has(c.id);
          const is12h = committed12h.has(c.id);
          const isSingle = counters.length <= 1 && chosenCommitment !== 'none';

          if (is24h || is12h || isSingle) {
            const duration: CommitmentType = is24h ? '24h' : is12h ? '12h' : chosenCommitment;
            committedInfo.push({ id: c.id, name: c.displayName, duration });
            try {
              await renewDailyCommitment(c.id);
            } catch (e) {
              logger.warn('renewDailyCommitment failed for', c.id, e);
            }
          }
        }
      }
      if (committedInfo.length > 0) {
        await AsyncStorage.setItem(
          COMMITTED_KEY_PREFIX + getTodayKey(),
          JSON.stringify(committedInfo)
        ).catch(() => {});
      }

      await clearDraft();
      router.replace('/');
    } catch (err) {
      logger.error('Failed to save check-in:', err);
      setSaving(false);
      Alert.alert('Could not save', 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    }
  }, [saving, submitCheckIn, chosenCommitment, pairs, counters, committed24h, committed12h, renewDailyCommitment, clearDraft, router]);

  /** Reset the check-in from the "already checked in" view and start over. */
  const handleResetAndRestart = useCallback(async () => {
    await resetCheckIn();
    resetFlowState();
  }, [resetCheckIn, resetFlowState]);

  /** Cancel — exit the flow and go back to the dashboard. */
  const handleCancel = useCallback(() => {
    router.replace('/');
  }, [router]);

  /** Back — go to the previous step in the flow. */
  const handleBack = useCallback(() => {
    if (step === 'done') {
      // Go back to reflection if we went through it, otherwise commitment
      if (chosenCommitment !== 'none') {
        setStep('reflection');
      } else {
        setStep('commitment');
      }
    } else if (step === 'reflection') {
      setStep('commitment');
    }
  }, [step, chosenCommitment]);

  // Loading — wait for check-in data before rendering
  if (checkInLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Check In" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Already checked in today — show current commitment with option to reset
  if (hasCheckedIn && todayCheckIn) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Check In" rightSlot={<ThemeToggle />} />
        <AlreadyCheckedInView
          checkIn={todayCheckIn}
          onReset={handleResetAndRestart}
          onGoHome={() => router.replace('/')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Check In" rightSlot={<ThemeToggle />} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Navigation bar — Cancel and Back */}
          <FlowNavBar
            showBack={step !== 'commitment'}
            onBack={handleBack}
            onCancel={handleCancel}
            iconColors={iconColors}
          />

          {step === 'commitment' && (
            counters.length === 0 ? (
              <NoCountersStep
                onGoToSobriety={() => router.push('/sobriety?from=checkin')}
              />
            ) : counters.length === 1 ? (
              <SingleCommitmentStep
                counter={counters[0]}
                onAccept={handleSimpleAccept}
              />
            ) : (
              <MultiCommitmentStep
                counters={counters}
                onDone={handleMultiCommitDone}
                iconColors={iconColors}
              />
            )
          )}

          {step === 'reflection' && (
            <ReflectionStep
              pairs={pairs}
              onUpdatePair={updatePair}
              onAddPair={addPair}
              onRemovePair={removePair}
              onContinue={() => setStep('done')}
              iconColors={iconColors}
            />
          )}

          {step === 'done' && (
            <ConfirmationStep
              commitmentType={chosenCommitment}
              pairs={pairs}
              saving={saving}
              onFinish={handleFinish}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Flow navigation bar — Cancel + Back
// ---------------------------------------------------------------------------

function FlowNavBar({
  showBack,
  onBack,
  onCancel,
  iconColors,
}: {
  showBack: boolean;
  onBack: () => void;
  onCancel: () => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  return (
    <View className="flex-row items-center justify-between mb-2">
      {showBack ? (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 py-2 pr-4"
        >
          <ChevronLeft size={18} color={iconColors.muted} />
          <Text className="text-muted-foreground text-sm font-medium">Back</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
      <TouchableOpacity
        onPress={onCancel}
        activeOpacity={0.7}
        className="py-2 pl-4"
      >
        <Text className="text-muted-foreground text-sm">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Already checked in — show current commitment, option to reset
// ---------------------------------------------------------------------------

function AlreadyCheckedInView({
  checkIn,
  onReset,
  onGoHome,
}: {
  checkIn: DailyCheckIn;
  onReset: () => void;
  onGoHome: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const hasTimedCommitment = checkIn.commitmentType !== 'none';

  // Live countdown
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    getCommitmentRemainingMs(checkIn)
  );

  useEffect(() => {
    if (!hasTimedCommitment) return;
    const tick = () => setRemainingMs(getCommitmentRemainingMs(checkIn));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [checkIn, hasTimedCommitment]);

  const active = remainingMs != null && remainingMs > 0;

  const formatCountdown = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
    >
      <View className="gap-6 mt-8 items-center">
        <CheckCircle size={48} className="text-primary" />
        <Text className="text-foreground text-xl font-bold text-center">
          You've already checked in today
        </Text>

        {hasTimedCommitment && (
          <View className="bg-card rounded-xl p-5 w-full border border-border items-center gap-2">
            <Text className="text-muted-foreground text-sm">
              {commitmentLabel(checkIn.commitmentType)}
            </Text>
            {active && remainingMs != null ? (
              <>
                <Text className="text-foreground font-bold text-3xl tracking-wider">
                  {formatCountdown(remainingMs)}
                </Text>
                <Text className="text-muted-foreground text-xs">remaining</Text>
              </>
            ) : (
              <Text className="text-muted-foreground text-sm">
                Commitment complete — well done.
              </Text>
            )}
          </View>
        )}

        {!hasTimedCommitment && (
          <Text className="text-muted-foreground text-center text-sm">
            You checked in without a timed commitment. That's still showing up.
          </Text>
        )}

        {/* Go back to dashboard */}
        <TouchableOpacity
          onPress={onGoHome}
          activeOpacity={0.7}
          className="bg-primary py-4 rounded-xl items-center w-full"
        >
          <Text className="text-primary-foreground font-bold text-base">
            Back to Dashboard
          </Text>
        </TouchableOpacity>

        {/* Reset option */}
        {!confirmReset ? (
          <TouchableOpacity
            onPress={() => setConfirmReset(true)}
            activeOpacity={0.7}
            className="py-2"
          >
            <Text className="text-muted-foreground text-sm">
              Reset and start over
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center gap-4">
            <Text className="text-foreground text-sm">Start a new check-in?</Text>
            <TouchableOpacity
              onPress={() => {
                setConfirmReset(false);
                onReset();
              }}
              activeOpacity={0.7}
              className="bg-destructive/20 rounded-lg px-4 py-2"
            >
              <Text className="text-destructive text-sm font-semibold">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmReset(false)}
              activeOpacity={0.7}
              className="bg-muted rounded-lg px-4 py-2"
            >
              <Text className="text-muted-foreground text-sm font-semibold">No</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// No counters — redirect to sobriety
// ---------------------------------------------------------------------------

function NoCountersStep({
  onGoToSobriety,
}: {
  onGoToSobriety: () => void;
}) {
  return (
    <View className="gap-6 mt-8 items-center">
      <Text className="text-foreground text-xl font-bold text-center">
        No addictions set up yet
      </Text>
      <Text className="text-muted-foreground text-center text-sm leading-5 px-4">
        To make a daily commitment, first add what you're working on in the Sobriety section.
      </Text>
      <TouchableOpacity
        onPress={onGoToSobriety}
        activeOpacity={0.7}
        className="bg-primary py-4 px-8 rounded-xl items-center"
      >
        <Text className="text-primary-foreground font-bold text-base">
          Go to Sobriety
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 1a: Single counter — simple 24h → 12h → none cascade
// ---------------------------------------------------------------------------

/**
 * Format the time when a commitment expires (e.g. "tomorrow at 2:30 PM").
 */
function formatExpiryTime(type: CommitmentType): string {
  const durationMs = commitmentDurationMs(type);
  if (durationMs == null) return '';
  const expiry = new Date(Date.now() + durationMs);
  const now = new Date();
  const isToday = expiry.getDate() === now.getDate() &&
    expiry.getMonth() === now.getMonth() &&
    expiry.getFullYear() === now.getFullYear();
  const time = expiry.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return isToday ? `today at ${time}` : `tomorrow at ${time}`;
}

function SingleCommitmentStep({
  counter,
  onAccept,
}: {
  counter: SobrietyCounter;
  onAccept: (type: CommitmentType) => void;
}) {
  const [offer, setOffer] = useState<'24h' | '12h' | 'resolved'>('24h');

  const handleDecline = useCallback(() => {
    if (offer === '24h') {
      setOffer('12h');
    } else {
      setOffer('resolved');
      onAccept('none');
    }
  }, [offer, onAccept]);

  if (offer === '24h') {
    return (
      <View className="gap-6 mt-8">
        <Text className="text-foreground text-xl font-bold text-center">
          Would you like to make a{'\n'}24-hour commitment?
        </Text>
        <Text className="text-muted-foreground text-center text-sm leading-5">
          Stay free from {counter.displayName}. Just for today.
        </Text>
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-muted-foreground text-sm text-center leading-5">
            This is entirely optional. You're committing not to use until{' '}
            {formatExpiryTime('24h')}. After that, you're free to choose again.{'\n\n'}
            One day at a time — you've got this.
          </Text>
        </View>
        <View className="gap-3 mt-2">
          <TouchableOpacity
            onPress={() => onAccept('24h')}
            activeOpacity={0.7}
            className="bg-primary py-4 rounded-xl items-center"
          >
            <Text className="text-primary-foreground font-bold text-base">
              Yes, 24 hours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDecline}
            activeOpacity={0.7}
            className="bg-muted py-4 rounded-xl items-center"
          >
            <Text className="text-muted-foreground font-semibold text-base">
              Not today
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (offer === '12h') {
    return (
      <View className="gap-6 mt-8">
        {/* Internal back to 24h offer */}
        <TouchableOpacity
          onPress={() => setOffer('24h')}
          activeOpacity={0.7}
          className="flex-row items-center gap-1 self-start"
        >
          <ChevronLeft size={16} className="text-muted-foreground" />
          <Text className="text-muted-foreground text-sm font-medium">Back to 24h</Text>
        </TouchableOpacity>

        <Text className="text-foreground text-xl font-bold text-center">
          How about 12 hours?
        </Text>
        <Text className="text-muted-foreground text-center text-sm leading-5">
          Half the day. That still counts.
        </Text>
        <View className="bg-card rounded-xl p-4 border border-border">
          <Text className="text-muted-foreground text-sm text-center leading-5">
            This is optional. You're committing until{' '}
            {formatExpiryTime('12h')}. After that, you choose again.{'\n\n'}
            Every hour counts.
          </Text>
        </View>
        <View className="gap-3 mt-2">
          <TouchableOpacity
            onPress={() => onAccept('12h')}
            activeOpacity={0.7}
            className="bg-primary py-4 rounded-xl items-center"
          >
            <Text className="text-primary-foreground font-bold text-base">
              Yes, 12 hours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDecline}
            activeOpacity={0.7}
            className="bg-muted py-4 rounded-xl items-center"
          >
            <Text className="text-muted-foreground font-semibold text-base">
              No, just checking in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step 1b: Multiple counters — checklist with 24h + 12h fallback
// ---------------------------------------------------------------------------

function MultiCommitmentStep({
  counters,
  onDone,
  iconColors,
}: {
  counters: SobrietyCounter[];
  onDone: (committed24h: Set<string>, committed12h: Set<string>) => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  const [phase, setPhase] = useState<'pick24h' | 'pick12h'>('pick24h');
  const [checked24h, setChecked24h] = useState<Set<string>>(new Set());
  const [checked12h, setChecked12h] = useState<Set<string>>(new Set());

  const toggle24h = useCallback((id: string) => {
    setChecked24h((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggle12h = useCallback((id: string) => {
    setChecked12h((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // After picking 24h, show the unchecked ones for 12h
  const uncheckedCounters = counters.filter((c) => !checked24h.has(c.id));

  if (phase === 'pick24h') {
    return (
      <View className="gap-6 mt-8">
        <Text className="text-foreground text-xl font-bold text-center">
          24-hour commitment
        </Text>
        <Text className="text-muted-foreground text-center text-sm leading-5">
          Which of these are you committing to stay free from today?
        </Text>

        <View className="gap-2 mt-2">
          {counters.map((c) => {
            const isChecked = checked24h.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => toggle24h(c.id)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                  isChecked ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                    isChecked ? 'bg-primary border-primary' : 'border-border'
                  }`}
                >
                  {isChecked && <Check size={14} color={iconColors.primaryForeground} strokeWidth={3} />}
                </View>
                <Text className="text-foreground font-medium text-base flex-1">
                  {c.displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => {
            if (uncheckedCounters.length > 0) {
              setPhase('pick12h');
            } else {
              // All checked for 24h
              onDone(checked24h, new Set());
            }
          }}
          activeOpacity={0.7}
          className="bg-primary py-4 rounded-xl items-center mt-2"
        >
          <Text className="text-primary-foreground font-bold text-base">
            {checked24h.size === 0 ? 'Skip' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Phase: pick12h — offer 12h for the ones not checked for 24h
  return (
    <View className="gap-6 mt-8">
      {/* Internal back to 24h phase */}
      <TouchableOpacity
        onPress={() => setPhase('pick24h')}
        activeOpacity={0.7}
        className="flex-row items-center gap-1 self-start"
      >
        <ChevronLeft size={16} color={iconColors.muted} />
        <Text className="text-muted-foreground text-sm font-medium">Back to 24h</Text>
      </TouchableOpacity>

      <Text className="text-foreground text-xl font-bold text-center">
        How about 12 hours?
      </Text>
      <Text className="text-muted-foreground text-center text-sm leading-5">
        Would you commit to 12 hours for any of these?
      </Text>

      <View className="gap-2 mt-2">
        {uncheckedCounters.map((c) => {
          const isChecked = checked12h.has(c.id);
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => toggle12h(c.id)}
              activeOpacity={0.7}
              className={`flex-row items-center gap-3 p-4 rounded-xl border ${
                isChecked ? 'bg-primary/10 border-primary' : 'bg-card border-border'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                  isChecked ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {isChecked && <Check size={14} color={iconColors.primaryForeground} strokeWidth={3} />}
              </View>
              <Text className="text-foreground font-medium text-base flex-1">
                {c.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => onDone(checked24h, checked12h)}
        activeOpacity={0.7}
        className="bg-primary py-4 rounded-xl items-center mt-2"
      >
        <Text className="text-primary-foreground font-bold text-base">
          {checked24h.size === 0 && checked12h.size === 0 ? 'Just checking in' : 'Continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Reflection — multiple challenge/plan pairs
// ---------------------------------------------------------------------------

function ReflectionStep({
  pairs,
  onUpdatePair,
  onAddPair,
  onRemovePair,
  onContinue,
  iconColors,
}: {
  pairs: ChallengePair[];
  onUpdatePair: (index: number, field: keyof ChallengePair, value: string) => void;
  onAddPair: () => void;
  onRemovePair: (index: number) => void;
  onContinue: () => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  return (
    <View className="gap-6 mt-8">
      {pairs.map((pair, index) => (
        <View key={index} className="gap-3">
          {/* Header with remove button for extra pairs */}
          {pairs.length > 1 && (
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground text-xs font-semibold">
                Challenge {index + 1}
              </Text>
              <TouchableOpacity
                onPress={() => onRemovePair(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={iconColors.muted} />
              </TouchableOpacity>
            </View>
          )}

          <View className="gap-2">
            <Text className="text-foreground text-lg font-bold">
              {index === 0
                ? 'What might make this hard today?'
                : 'Anything else?'}
            </Text>
            <TextInput
              value={pair.challenge}
              onChangeText={(t) => onUpdatePair(index, 'challenge', t)}
              placeholder="e.g. a stressful meeting, loneliness, boredom..."
              placeholderTextColor={iconColors.muted}
              multiline
              className="bg-input text-input-foreground rounded-xl p-4 min-h-[80px] text-base"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground text-lg font-bold">
              What can you do if that comes up?
            </Text>
            <TextInput
              value={pair.plan}
              onChangeText={(t) => onUpdatePair(index, 'plan', t)}
              placeholder="e.g. call my sponsor, take a walk, breathe..."
              placeholderTextColor={iconColors.muted}
              multiline
              className="bg-input text-input-foreground rounded-xl p-4 min-h-[80px] text-base"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Divider between pairs */}
          {index < pairs.length - 1 && (
            <View className="border-b border-border my-1" />
          )}
        </View>
      ))}

      {/* Add another challenge button */}
      <TouchableOpacity
        onPress={onAddPair}
        activeOpacity={0.7}
        className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border"
      >
        <Plus size={18} color={iconColors.muted} />
        <Text className="text-muted-foreground font-medium text-sm">
          Add another challenge
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onContinue}
        activeOpacity={0.7}
        className="bg-primary py-4 rounded-xl items-center mt-2"
      >
        <Text className="text-primary-foreground font-bold text-base">
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Confirmation
// ---------------------------------------------------------------------------

function ConfirmationStep({
  commitmentType,
  pairs,
  saving,
  onFinish,
}: {
  commitmentType: CommitmentType;
  pairs: ChallengePair[];
  saving: boolean;
  onFinish: () => void;
}) {
  const encouragement = commitmentType === 'none'
    ? getEncouragement('noCommitment')
    : getEncouragement('afterCheckIn');

  const todoPreviews = pairs
    .map(({ challenge, plan }) => {
      const c = challenge.trim();
      const p = plan.trim();
      if (!c && !p) return null;
      if (c && p) return `If "${c}" comes up — ${p}`;
      if (c) return `Watch for: ${c}`;
      return p;
    })
    .filter(Boolean);

  return (
    <View className="gap-6 mt-8 items-center">
      {/* Encouragement message */}
      <Text className="text-foreground text-xl font-bold text-center">
        {encouragement}
      </Text>

      {/* Show what they committed to */}
      {commitmentType !== 'none' && (
        <View className="bg-card rounded-xl p-4 w-full border border-border">
          <Text className="text-muted-foreground text-sm mb-1">
            Your commitment
          </Text>
          <Text className="text-foreground font-semibold text-base">
            {commitmentLabel(commitmentType)}
          </Text>
        </View>
      )}

      {/* Show private TODO previews */}
      {todoPreviews.length > 0 && (
        <View className="bg-card rounded-xl p-4 w-full border border-border gap-2">
          <Text className="text-muted-foreground text-sm">
            {todoPreviews.length === 1 ? "Today's reminder" : "Today's reminders"}
          </Text>
          {todoPreviews.map((text, i) => (
            <Text key={i} className="text-foreground text-base">
              {todoPreviews.length > 1 ? `${i + 1}. ${text}` : text}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={onFinish}
        disabled={saving}
        activeOpacity={0.7}
        style={{ opacity: saving ? 0.6 : 1 }}
        className="bg-primary py-4 rounded-xl items-center w-full mt-2"
      >
        <Text className="text-primary-foreground font-bold text-base">
          {saving ? 'Saving...' : 'Done'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
