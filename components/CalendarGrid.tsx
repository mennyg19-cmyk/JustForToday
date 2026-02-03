import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCalendarTheme } from '@/lib/calendarTheme';
import { useIconColors } from '@/lib/iconTheme';
import { getDaysInMonth, getMonthStartDay } from '@/utils/date';

interface CalendarGridProps {
  monthDate: Date;
  onChangeMonth: (newMonth: Date) => void;
  renderDay: (date: Date) => React.ReactNode;
}

export const CalendarGrid = React.memo(function CalendarGrid({
  monthDate,
  onChangeMonth,
  renderDay,
}: CalendarGridProps) {
  const daysInMonth = useMemo(() => getDaysInMonth(monthDate), [monthDate]);
  const startingDayOfWeek = useMemo(() => getMonthStartDay(monthDate), [monthDate]);
  const monthName = useMemo(
    () => monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [monthDate]
  );
  const calendarTheme = useCalendarTheme();
  const iconColors = useIconColors();

  const cells: React.ReactNode[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(<View key={`empty-${i}`} className="w-[14.28%] aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    cells.push(
      <React.Fragment key={`day-${day}`}>
        {renderDay(date)}
      </React.Fragment>
    );
  }

  const handlePrevMonth = React.useCallback(() => {
    const newMonth = new Date(monthDate);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onChangeMonth(newMonth);
  }, [monthDate, onChangeMonth]);

  const handleNextMonth = React.useCallback(() => {
    const newMonth = new Date(monthDate);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onChangeMonth(newMonth);
  }, [monthDate, onChangeMonth]);

  return (
    <View>
      {/* Month Navigation */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity onPress={handlePrevMonth} className="p-2">
          <ChevronLeft size={24} color={iconColors.muted} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">{monthName}</Text>
        <TouchableOpacity onPress={handleNextMonth} className="p-2">
          <ChevronRight size={24} color={iconColors.muted} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View className="flex-row mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <View key={i} className="w-[14.28%] items-center">
            <Text className="text-xs font-bold" style={{ color: calendarTheme.weekday }}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="flex-row flex-wrap">{cells}</View>
    </View>
  );
});
