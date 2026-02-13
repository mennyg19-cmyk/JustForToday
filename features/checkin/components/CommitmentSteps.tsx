/**
 * Commitment step sub-components for the check-in flow.
 *
 * - NoCountersStep: prompts user to add addictions first
 * - SingleCommitmentStep: 24h → 12h → none cascade for a single counter
 * - MultiCommitmentStep: checklist for picking 24h / 12h per counter
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';
import type { CommitmentType, SobrietyCounter } from '@/lib/database/schema';
import { commitmentDurationMs } from '@/lib/commitment';
import { useIconColors } from '@/lib/iconTheme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format the time when a commitment expires (e.g. "tomorrow at 2:30 PM").
 */
export function formatExpiryTime(type: CommitmentType): string {
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

// ---------------------------------------------------------------------------
// No counters — redirect to sobriety
// ---------------------------------------------------------------------------

export function NoCountersStep({
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

export function SingleCommitmentStep({
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

export function MultiCommitmentStep({
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
