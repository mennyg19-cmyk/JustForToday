import React, { memo, useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalLabel, ModalSection, ModalButtonRow, ModalButton } from '@/components/ModalContent';
import { CalendarGrid } from '@/components/CalendarGrid';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateKey, isToday } from '@/utils/date';
import type { Habit } from '../types';

interface HabitCalendarProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
  onToggleDate: (habitId: string, date: string) => void;
  onSaveEdit?: (habitId: string, updates: { name?: string; trackingStartDate?: string }) => Promise<void>;
}

export const HabitCalendar = memo(function HabitCalendar({
  habit,
  visible,
  onClose,
  onToggleDate,
  onSaveEdit,
}: HabitCalendarProps) {
  const iconColors = useIconColors();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTrackingStart, setEditTrackingStart] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  useEffect(() => {
    if (habit) {
      setEditName(habit.name);
      setEditTrackingStart(habit.trackingStartDate ?? formatDateKey(new Date(habit.createdAt)));
      setPickerDate(new Date((habit.trackingStartDate ?? habit.createdAt) + 'T00:00:00'));
      setEditMode(false);
      setShowDatePicker(false);
    }
  }, [habit]);

  if (!habit) return null;

  const creationDateKey = formatDateKey(new Date(habit.createdAt));

  const handleToggleDate = useCallback(
    (date: Date) => {
      const dateKey = formatDateKey(date);
      onToggleDate(habit.id, dateKey);
    },
    [habit.id, onToggleDate]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!onSaveEdit) return;
    await onSaveEdit(habit.id, {
      name: editName.trim() || habit.name,
      trackingStartDate: editTrackingStart || creationDateKey,
    });
    setEditMode(false);
  }, [habit.id, habit.name, editName, editTrackingStart, creationDateKey, onSaveEdit]);

  const handleDateConfirm = useCallback(() => {
    setEditTrackingStart(formatDateKey(pickerDate));
    setShowDatePicker(false);
  }, [pickerDate]);

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="rounded-t-3xl p-6"
      noScroll
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <ModalTitle className="mb-1">{habit.name}</ModalTitle>
          <Text className="text-sm text-muted-foreground">
            Tap days to mark complete/incomplete
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setEditMode((e) => !e)}
            className="px-3 py-2 rounded-lg bg-muted"
          >
            <Text className="text-foreground font-semibold text-sm">{editMode ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color={iconColors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: 24 }}>
        {editMode ? (
          showDatePicker ? (
            <View className="mb-4">
              <ModalLabel className="mb-2">Start tracking date</ModalLabel>
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
                <ModalButton variant="secondary" onPress={() => setShowDatePicker(false)}>
                  Back
                </ModalButton>
                <ModalButton variant="primary" onPress={handleDateConfirm}>
                  Done
                </ModalButton>
              </ModalButtonRow>
            </View>
          ) : (
            <View className="mb-4">
              <ModalSection>
                <ModalLabel>Name</ModalLabel>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Habit name"
                  placeholderTextColor={iconColors.muted}
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                />
              </ModalSection>
              <ModalSection>
                <ModalLabel>Start tracking date</ModalLabel>
                <Text className="text-muted-foreground text-sm mb-2">
                  Defaults to when the habit was created. Change to ignore earlier history for this habit.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="rounded-xl px-4 py-3 bg-muted border border-border"
                >
                  <Text className="text-foreground">
                    {editTrackingStart
                      ? new Date(editTrackingStart + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Tap to pick date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditTrackingStart(creationDateKey)}
                  className="mt-2 py-2"
                >
                  <Text className="text-primary font-medium text-sm">Reset to creation date</Text>
                </TouchableOpacity>
              </ModalSection>
              <ModalButtonRow>
                <ModalButton variant="secondary" onPress={() => setEditMode(false)}>
                  Cancel
                </ModalButton>
                <ModalButton variant="primary" onPress={handleSaveEdit}>
                  Save
                </ModalButton>
              </ModalButtonRow>
            </View>
          )
        ) : (
          <>
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
                  style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#B48C3C' }}
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
          </>
        )}
      </ScrollView>
    </ModalSurface>
  );
});
