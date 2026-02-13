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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { LoadingView } from '@/components/common/LoadingView';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCheckIn } from './hooks/useCheckIn';
import { useSobriety } from '@/features/sobriety/hooks/useSobriety';
import type { CommitmentType } from '@/lib/database/schema';
import { useIconColors } from '@/lib/iconTheme';
import { getTodayKey } from '@/utils/date';
import { logger } from '@/lib/logger';

import type { ChallengePair, CommittedCounterInfo } from './types';
import { COMMITTED_KEY_PREFIX, DRAFT_KEY_PAIRS } from './types';
export type { CommittedCounterInfo } from './types';

// Sub-components extracted into ./components/
import { NoCountersStep, SingleCommitmentStep, MultiCommitmentStep } from './components/CommitmentSteps';
import { ReflectionStep } from './components/ReflectionStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import { AlreadyCheckedInView } from './components/AlreadyCheckedInView';

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
        <LoadingView />
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
