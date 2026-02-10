/**
 * HardMomentScreen — emergency support screen for difficult moments.
 *
 * Design philosophy: reduce stimulation, narrow focus, offer containment.
 * This is NOT an advice screen. It's a quiet room.
 *
 * Layout:
 *   1. Commitment-aware grounding message (rotating, calm)
 *   2. Grounding actions (breathing, encouraging tools, writing)
 *   3. Trusted contacts (one-tap phone call)
 *
 * Accessible from anywhere in the app via a floating button in _layout.tsx.
 * No data is logged from this screen. No tracking. No friction.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { getCommitmentEncouragement, getEncouragement } from '@/lib/encouragement';
import { getCommitmentRemainingMs } from '@/lib/commitment';
import { GroundingExercise } from './components/GroundingExercise';
import { TrustedContacts } from './components/TrustedContacts';
import { getTodayKey } from '@/utils/date';

export function HardMomentScreen() {
  const [message, setMessage] = useState(() => getEncouragement('hardMoment'));
  const rotatingIdx = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        const { getCheckInForDate } = await import('@/features/checkin/database');
        const { getUserProfile } = await import('@/lib/settings/database');
        const today = getTodayKey();
        const [checkIn, profile] = await Promise.all([
          getCheckInForDate(today),
          getUserProfile(),
        ]);
        if (cancelled) return;

        const remaining = checkIn ? getCommitmentRemainingMs(checkIn) : null;
        const name = profile?.name || undefined;

        setMessage(getCommitmentEncouragement(remaining, name, rotatingIdx.current));

        intervalId = setInterval(() => {
          rotatingIdx.current += 1;
          const nowRemaining = checkIn ? getCommitmentRemainingMs(checkIn) : null;
          setMessage(getCommitmentEncouragement(nowRemaining, name, rotatingIdx.current));
        }, 8000);
      } catch {
        // Fallback to basic message already set in useState initializer
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Hard Moment" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Commitment-aware grounding message */}
        <View className="items-center py-8">
          <Text className="text-foreground text-2xl font-bold text-center leading-8">
            {message}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-border my-4" />

        {/* Grounding exercise (breathing, tools, writing) */}
        <GroundingExercise />

        {/* Divider */}
        <View className="h-px bg-border my-6" />

        {/* Trusted contacts for one-tap calling */}
        <TrustedContacts />
      </ScrollView>
    </SafeAreaView>
  );
}
