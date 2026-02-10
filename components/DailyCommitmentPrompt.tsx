/**
 * DailyCommitmentPrompt — modal shown on first app open of the day
 * when the user hasn't checked in yet.
 *
 * Shows a friendly greeting based on time of day, indicates whether
 * there's an active commitment to renew or a fresh one to start,
 * and lets the user commit or skip.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun, Sunrise, Moon, RotateCcw, ArrowRight } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { useIconColors } from '@/lib/iconTheme';
import type { DailyCheckIn } from '@/lib/commitment';
import { isCommitmentActive, commitmentLabel } from '@/lib/commitment';

interface DailyCommitmentPromptProps {
  visible: boolean;
  /** Most recent check-in (any date) — used to detect an active timer. */
  lastCheckIn: DailyCheckIn | null;
  /** User's first name for a personal greeting. */
  userName?: string;
  onGoToCheckIn: () => void;
  onDismiss: () => void;
}

/** Returns a greeting and icon based on the current hour. */
function getTimeOfDayGreeting(name?: string) {
  const hour = new Date().getHours();
  const who = name ? `, ${name}` : '';

  if (hour < 12) {
    return { greeting: `Good morning${who}`, Icon: Sunrise };
  }
  if (hour < 17) {
    return { greeting: `Good afternoon${who}`, Icon: Sun };
  }
  return { greeting: `Good evening${who}`, Icon: Moon };
}

export function DailyCommitmentPrompt({
  visible,
  lastCheckIn,
  userName,
  onGoToCheckIn,
  onDismiss,
}: DailyCommitmentPromptProps) {
  const iconColors = useIconColors();

  const hasActiveCommitment = lastCheckIn != null && isCommitmentActive(lastCheckIn);
  const { greeting, Icon: GreetingIcon } = getTimeOfDayGreeting(userName);

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onDismiss}
      contentClassName="p-6"
      noScroll
    >
      <View className="items-center gap-4">
        {/* Greeting icon */}
        <View className="bg-primary/10 rounded-full p-4">
          <GreetingIcon size={32} color={iconColors.primary} />
        </View>

        {/* Greeting text */}
        <Text className="text-xl font-bold text-modal-content-foreground text-center">
          {greeting}
        </Text>

        {/* Status message */}
        <Text className="text-sm text-muted-foreground text-center leading-5 px-2">
          {hasActiveCommitment
            ? `Your ${commitmentLabel(lastCheckIn!.commitmentType).toLowerCase()} is still active. Ready to renew for today?`
            : "A new day, a fresh start. Whenever you're ready, you can set your commitment for today."}
        </Text>

        {/* Primary action */}
        <TouchableOpacity
          onPress={onGoToCheckIn}
          activeOpacity={0.8}
          className="bg-primary rounded-2xl py-4 px-8 flex-row items-center gap-2 w-full justify-center"
        >
          {hasActiveCommitment ? (
            <RotateCcw size={18} color={iconColors.primaryForeground} />
          ) : (
            <ArrowRight size={18} color={iconColors.primaryForeground} />
          )}
          <Text className="text-primary-foreground font-bold text-base">
            {hasActiveCommitment ? 'Renew Commitment' : 'Make My Commitment'}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          className="py-2"
        >
          <Text className="text-muted-foreground text-sm">Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ModalSurface>
  );
}
