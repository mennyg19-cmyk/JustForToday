import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, Trophy } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import type { SobrietyCounter } from '../types';

interface SobrietyCardProps {
  counter: SobrietyCounter;
  timeSince: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    formattedTimer: string;
  };
  onPress: () => void;
}

const LONGEST_STREAK_MESSAGE = "You're at your best — keep going!";

export function SobrietyCard({ counter, timeSince, onPress }: SobrietyCardProps) {
  const iconColors = useIconColors();
  const isLongestStreak = timeSince.days >= counter.longestStreak && timeSince.days > 0;
  const cheeringMessage = isLongestStreak ? LONGEST_STREAK_MESSAGE : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[48%] bg-card rounded-2xl p-3 border border-border shadow-card"
      style={{ aspectRatio: 1 }}
    >
      <View className="flex-1 justify-between">
        <View className="flex-row items-start justify-between mb-0.5">
          <View className="flex-1 pr-1 min-w-0">
            <Text
              className="text-sm font-bold text-foreground"
              numberOfLines={1}
            >
              {counter.displayName}
            </Text>
            {counter.notes ? (
              <Text
                className="text-[10px] text-muted-foreground mt-0.5"
                numberOfLines={1}
              >
                {counter.notes}
              </Text>
            ) : null}
          </View>
          <Calendar size={14} color={iconColors.muted} />
        </View>

        <View className="flex-1 justify-center bg-muted rounded-xl px-2 py-3 my-2 min-h-[72px]">
          <View className="items-center">
            <Text
              className="text-2xl font-bold text-foreground text-center"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {timeSince.formattedTimer}
            </Text>
            {isLongestStreak ? (
              <Trophy className="text-primary mt-1.5" size={20} />
            ) : null}
          </View>
        </View>

        <View className="gap-1">
          {cheeringMessage ? (
            <Text
              className="text-xs text-primary font-semibold text-center"
              numberOfLines={2}
            >
              {cheeringMessage}
            </Text>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground font-semibold">
                LONGEST
              </Text>
              <Text className="text-xs font-bold text-foreground">
                {counter.longestStreak}d
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
