import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { CalendarGrid } from '@/components/CalendarGrid';
import { CARD_MB as cardClass } from '@/components/cardStyles';
import { formatDateKey, formatDateDisplay, parseDateKey } from '@/utils/date';
import type { StoicWeekMode } from '@/lib/settings/database';

interface ScheduleSettingsProps {
  weekMode: StoicWeekMode;
  startDate: string | null;
  onModeChange: (mode: StoicWeekMode) => void;
  onStartDateConfirm: (dateKey: string) => void;
}

export function ScheduleSettings({
  weekMode,
  startDate,
  onModeChange,
  onStartDateConfirm,
}: ScheduleSettingsProps) {
  const iconColors = useIconColors();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const handleOpenPicker = () => {
    setPickerDate(startDate ? parseDateKey(startDate) : new Date());
    setShowDatePicker(true);
  };

  const handleConfirm = () => {
    const key = formatDateKey(pickerDate);
    onStartDateConfirm(key);
    setShowDatePicker(false);
  };

  return (
    <>
      <View className={`${cardClass} mb-4`}>
        <Text className="text-base font-semibold text-foreground mb-2">Stoic schedule</Text>
        <Text className="text-sm text-muted-foreground mb-3">
          Week 1 can follow the calendar year or your personal start date.
        </Text>
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            onPress={() => onModeChange('calendar')}
            className={`flex-1 py-2.5 rounded-xl border-2 ${
              weekMode === 'calendar' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                weekMode === 'calendar' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              Weeks of the year
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onModeChange('personal')}
            className={`flex-1 py-2.5 rounded-xl border-2 ${
              weekMode === 'personal' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                weekMode === 'personal' ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              From start date
            </Text>
          </TouchableOpacity>
        </View>
        {weekMode === 'personal' && (
          <TouchableOpacity
            onPress={handleOpenPicker}
            className="flex-row items-center gap-2 py-2 rounded-xl bg-muted/30 border border-border"
          >
            <Calendar size={20} color={iconColors.primary} />
            <Text className="text-sm text-foreground flex-1">
              {startDate ? formatDateDisplay(startDate) : 'Pick start date'}
            </Text>
            <ChevronRight size={18} color={iconColors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ModalSurface visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
        <View className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Handbook start date</Text>
          <CalendarGrid
            monthDate={pickerDate}
            onChangeMonth={setPickerDate}
            renderDay={(date) => {
              const isSelected =
                pickerDate.getDate() === date.getDate() &&
                pickerDate.getMonth() === date.getMonth() &&
                pickerDate.getFullYear() === date.getFullYear();
              return (
                <TouchableOpacity
                  onPress={() => setPickerDate(date)}
                  className="w-[14.28%] aspect-square p-1"
                >
                  <View
                    className={`flex-1 rounded-lg items-center justify-center ${
                      isSelected ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <ModalButtonRow>
            <ModalButton onPress={() => setShowDatePicker(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onPress={handleConfirm}>Done</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </>
  );
}
