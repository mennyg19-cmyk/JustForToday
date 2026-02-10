import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Flame, Trophy, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { compareWeeks, compareMonths } from '@/utils/comparison';
import type { Habit } from '../types';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onPress: (habit: Habit) => void;
  compact?: boolean;
  /** When false, hide streaks and week/month metrics. Default true. */
  showMetrics?: boolean;
}

export const HabitCard = memo(function HabitCard({
  habit,
  onToggle,
  onPress,
  compact = false,
  showMetrics = true,
}: HabitCardProps) {
  const iconColors = useIconColors();
  const weekComp = compareWeeks(habit.thisWeekCount, habit.lastWeekCount);
  const monthComp = compareMonths(habit.thisMonthCount, habit.lastMonthCount);
  const isHighScore = habit.currentStreak === habit.highScore && habit.currentStreak > 0;

  const handleToggle = (e: any) => {
    e.stopPropagation();
    onToggle(habit.id);
  };

  const cardContent = (
    <>
      {/* Header: Name + Checkbox + Type Badge */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-1">
          <Text
            className={`font-bold text-card-foreground ${showMetrics ? 'text-sm' : 'text-base'}`}
            numberOfLines={2}
          >
            {habit.name}
          </Text>
          {/* Type badge */}
          {habit.type === 'break' ? (
            <View className={`bg-destructive/20 rounded mt-1 self-start ${showMetrics ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
              <Text className={`text-destructive font-bold ${showMetrics ? 'text-[9px]' : 'text-xs'}`}>BREAK</Text>
            </View>
          ) : (
            <View className={`bg-primary/20 rounded mt-1 self-start ${showMetrics ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
              <Text className={`text-primary font-bold ${showMetrics ? 'text-[9px]' : 'text-xs'}`}>BUILD</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            habit.completedToday
              ? 'bg-primary border-primary'
              : 'border-muted-foreground'
          }`}
        >
          {habit.completedToday && <Check className="text-primary-foreground" size={14} />}
        </TouchableOpacity>
      </View>

      {showMetrics && (
        <>
          {/* Streak */}
          <View className="flex-row items-center justify-between bg-muted rounded-lg px-2 py-1.5 mb-2">
            <View className="flex-row items-center gap-1">
              <Flame size={14} color={iconColors.primary} />
              <Text className="text-lg font-bold text-foreground">{habit.currentStreak}</Text>
              <Text className="text-xs text-muted-foreground">/ {habit.highScore}</Text>
            </View>
            {isHighScore && habit.currentStreak > 0 && (
              <Trophy size={14} color={iconColors.primary} />
            )}
          </View>

          {/* Week & Month */}
          <View className="gap-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground font-semibold">WK</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-foreground">{habit.thisWeekCount}</Text>
                <Text className="text-xs text-muted-foreground">vs {habit.lastWeekCount}</Text>
                {weekComp.trend === 'up' ? (
                  <TrendingUp size={12} color={iconColors.success} />
                ) : weekComp.trend === 'down' ? (
                  <TrendingDown size={12} color={iconColors.destructive} />
                ) : null}
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground font-semibold">MO</Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-foreground">{habit.thisMonthCount}</Text>
                <Text className="text-xs text-muted-foreground">vs {habit.lastMonthCount}</Text>
                {monthComp.trend === 'up' ? (
                  <TrendingUp size={12} color={iconColors.success} />
                ) : monthComp.trend === 'down' ? (
                  <TrendingDown size={12} color={iconColors.destructive} />
                ) : null}
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => onPress(habit)}
        className="w-[48%] bg-card rounded-2xl p-3 border border-border mb-4"
        style={showMetrics ? { aspectRatio: 1 } : undefined}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(habit)}
      className="bg-card rounded-2xl p-3 border border-border mb-4"
    >
      {cardContent}
    </TouchableOpacity>
  );
});
