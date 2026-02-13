/**
 * AlreadyCheckedInView — shown when the user has already checked in today.
 *
 * Displays the current commitment with a live countdown timer and an
 * option to reset and start a new check-in.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import type { DailyCheckIn } from '@/lib/database/schema';
import { getCommitmentRemainingMs, commitmentLabel } from '@/lib/commitment';

export function AlreadyCheckedInView({
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
