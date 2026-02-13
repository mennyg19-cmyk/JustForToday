/**
 * ConfirmationStep — Step 3 of the check-in flow.
 *
 * Shows an encouragement message, a summary of the commitment and
 * challenge/plan reminders, and a "Done" button to finish the flow.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { CommitmentType } from '@/lib/database/schema';
import type { ChallengePair } from '../types';
import { getEncouragement } from '@/lib/encouragement';
import { commitmentLabel } from '@/lib/commitment';

export function ConfirmationStep({
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
