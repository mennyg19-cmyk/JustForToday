import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle } from '@/components/ModalContent';
import { CalendarGrid } from '@/components/CalendarGrid';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateKey, isToday } from '@/utils/date';
import type { Habit } from '../types';

interface HabitCalendarProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
  onToggleDate: (habitId: string, date: string) => void;
}

export const HabitCalendar = memo(function HabitCalendar({
  habit,
  visible,
  onClose,
  onToggleDate,
}: HabitCalendarProps) {
  const iconColors = useIconColors();
  const [calendarMonth, setCalendarMonth] = React.useState(new Date());

  if (!habit) return null;

  const handleToggleDate = useCallback(
    (date: Date) => {
      const dateKey = formatDateKey(date);
      onToggleDate(habit.id, dateKey);
    },
    [habit.id, onToggleDate]
  );

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="rounded-t-3xl p-6 max-h-[80%]"
    >
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1">
          <ModalTitle className="mb-1">{habit.name}</ModalTitle>
          <Text className="text-sm text-muted-foreground">
            Tap days to mark complete/incomplete
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} className="p-2">
          <X size={24} color={iconColors.foreground} />
        </TouchableOpacity>
      </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <CalendarGrid
              monthDate={calendarMonth}
              onChangeMonth={setCalendarMonth}
              renderDay={(date) => {
                const dateKey = formatDateKey(date);
                const isCompleted = habit.history[dateKey] || false;
                const isTodayDate = isToday(date);

                return (
                  <TouchableOpacity
                    onPress={() => handleToggleDate(date)}
                    className="w-[14.28%] aspect-square items-center justify-center"
                  >
                    <View
                      className={`w-8 h-8 rounded-lg items-center justify-center ${
                        isCompleted
                          ? 'bg-primary border-2 border-primary'
                          : isTodayDate
                            ? 'border-2 border-primary'
                            : 'bg-muted'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          isCompleted ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <View className="flex-row items-center justify-center gap-4 mt-4">
              <View className="flex-row items-center gap-2">
                <View
                  style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#8B5CF6' }}
                />
                <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
                  Completed
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View style={{ width: 24, height: 24, borderRadius: 6 }} className="bg-muted" />
                <Text className="text-muted-foreground" style={{ fontSize: 14 }}>
                  Not Done
                </Text>
              </View>
            </View>
          </ScrollView>
    </ModalSurface>
  );
});
