/**
 * ReflectionStep — Step 2 of the check-in flow.
 *
 * The user enters one or more challenge/plan pairs describing what might
 * make today hard and what they can do about it.
 */

import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import type { ChallengePair } from '../types';
import { useIconColors } from '@/lib/iconTheme';

export function ReflectionStep({
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
