import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface WeekSelectorProps {
  weekNumber: number;
  onWeekChange: (delta: number) => void;
}

export function WeekSelector({ weekNumber, onWeekChange }: WeekSelectorProps) {
  const iconColors = useIconColors();
  const canPrev = weekNumber > 1;
  const canNext = weekNumber < 52;

  return (
    <View className="flex-row items-center justify-between mb-4">
      <TouchableOpacity
        onPress={() => canPrev && onWeekChange(-1)}
        disabled={!canPrev}
        className="p-2 rounded-lg bg-card border border-border"
      >
        <ChevronLeft size={24} color={canPrev ? iconColors.primary : iconColors.muted} />
      </TouchableOpacity>
      <Text className="text-lg font-semibold text-foreground">Week {weekNumber} of 52</Text>
      <TouchableOpacity
        onPress={() => canNext && onWeekChange(1)}
        disabled={!canNext}
        className="p-2 rounded-lg bg-card border border-border"
      >
        <ChevronRight size={24} color={canNext ? iconColors.primary : iconColors.muted} />
      </TouchableOpacity>
    </View>
  );
}
