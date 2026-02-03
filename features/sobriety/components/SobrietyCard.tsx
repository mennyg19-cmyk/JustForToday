import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, Trophy } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import type { SobrietyCounter } from '../types';

interface SobrietyCardProps {
  counter: SobrietyCounter;
  timeSince: { days: number; hours: number; minutes: number; seconds: number };
  onPress: () => void;
}

export function SobrietyCard({ counter, timeSince, onPress }: SobrietyCardProps) {
  const iconColors = useIconColors();
  const isLongestStreak = timeSince.days >= counter.longestStreak && timeSince.days > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[48%] bg-card rounded-2xl p-3 border border-border shadow-card"
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
            {counter.notes ? (
              <Text
                className="text-[11px] text-muted-foreground mt-1"
                numberOfLines={1}
              >
                {counter.notes}
              </Text>
            ) : null}
          </View>
          <Calendar size={14} color={iconColors.muted} />
        </View>

        <View className="flex-row items-center justify-between bg-muted rounded-lg px-2 py-1.5 mb-2">
          <View className="flex-row items-center gap-1">
            <Text className="text-lg font-bold text-foreground">
              {timeSince.days}
            </Text>
            <Text className="text-xs text-muted-foreground">days</Text>
          </View>
          {isLongestStreak ? (
            <Trophy className="text-primary" size={14} />
          ) : null}
        </View>

        <View className="gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground font-semibold">
              TIME
            </Text>
            <Text className="text-xs font-semibold text-foreground">
              {timeSince.hours.toString().padStart(2, '0')}:
              {timeSince.minutes.toString().padStart(2, '0')}:
              {timeSince.seconds.toString().padStart(2, '0')}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground font-semibold">
              LONGEST
            </Text>
            <Text className="text-xs font-bold text-foreground">
              {counter.longestStreak}d
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
