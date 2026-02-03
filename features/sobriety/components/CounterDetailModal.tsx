import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { CalendarGrid } from '@/components/CalendarGrid';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalBox,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateKey } from '@/utils/date';
import type { SobrietyCounter } from '../types';

interface CounterDetailModalProps {
  counter: SobrietyCounter | null;
  visible: boolean;
  onClose: () => void;
  onToggleDay: (counterId: string, dateKey: string) => Promise<void>;
  onResetToNow: (counterId: string) => Promise<void>;
  onSaveEdit: (
    counterId: string,
    updates: Partial<
      Pick<SobrietyCounter, 'displayName' | 'actualName' | 'currentStreakStart' | 'notes'>
    >
  ) => Promise<void>;
}

export function CounterDetailModal({
  counter,
  visible,
  onClose,
  onToggleDay,
  onResetToNow,
  onSaveEdit,
}: CounterDetailModalProps) {
  const iconColors = useIconColors();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editMode, setEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editActualName, setEditActualName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerHour, setPickerHour] = useState('10');
  const [pickerMinute, setPickerMinute] = useState('00');

  useEffect(() => {
    if (counter) {
      setEditDisplayName(counter.displayName);
      setEditActualName(counter.actualName ?? '');
      setEditStartDate(counter.currentStreakStart);
      setEditNotes(counter.notes ?? '');
      const d = new Date(counter.currentStreakStart);
      setPickerDate(d);
      setPickerHour(d.getHours().toString().padStart(2, '0'));
      setPickerMinute(d.getMinutes().toString().padStart(2, '0'));
      setCalendarMonth(new Date());
      setEditMode(false);
      setShowDatePicker(false);
    }
  }, [counter]);

  const handleToggleDay = useCallback(
    (date: Date) => {
      if (!counter) return;
      const dateKey = formatDateKey(date);
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      if (date > now) return;
      onToggleDay(counter.id, dateKey);
    },
    [counter, onToggleDay]
  );

  const handleDateConfirm = useCallback(() => {
    const d = new Date(pickerDate);
    d.setHours(parseInt(pickerHour, 10), parseInt(pickerMinute, 10), 0, 0);
    setEditStartDate(d.toISOString());
    setShowDatePicker(false);
  }, [pickerDate, pickerHour, pickerMinute]);

  const handleSaveEdit = useCallback(async () => {
    if (!counter) return;
    await onSaveEdit(counter.id, {
      displayName: editDisplayName.trim() || counter.displayName,
      actualName: editActualName.trim() || counter.actualName,
      currentStreakStart: editStartDate || counter.currentStreakStart,
      notes: editNotes.trim() || counter.notes,
    });
    setEditMode(false);
  }, [counter, editDisplayName, editActualName, editStartDate, editNotes, onSaveEdit]);

  if (!counter) return null;

  const todayKey = formatDateKey(new Date());

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="rounded-t-3xl p-6 max-h-[80%]"
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <ModalTitle className="mb-1">{counter.displayName}</ModalTitle>
          {counter.actualName ? (
            <Text className="text-sm text-muted-foreground" numberOfLines={1}>
              {counter.actualName}
            </Text>
          ) : null}
          <Text className="text-sm text-muted-foreground">
            Tap days to mark as relapse/sober
          </Text>
          {counter.notes ? (
            <Text className="text-sm italic mt-2 text-primary">
              "{counter.notes}"
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => onResetToNow(counter.id)}
            className="px-3 py-2 rounded-lg bg-destructive"
          >
            <Text className="text-destructive-foreground text-xs font-bold">
              Reset Now
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEditMode((e) => !e);
              if (editMode) setShowDatePicker(false);
            }}
            className="p-2"
          >
            <Text className="text-muted-foreground font-semibold text-sm">
              {editMode ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X size={24} color={iconColors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {editMode ? (
          showDatePicker ? (
            <View>
              <View className="flex-row items-center gap-2 mb-4">
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="p-2 -ml-2"
                >
                  <ChevronLeft className="text-primary" size={20} />
                </TouchableOpacity>
                <ModalLabel className="mb-0">Date & Time</ModalLabel>
              </View>
              <ModalBox className="mb-4">
                <CalendarGrid
                  monthDate={pickerDate}
                  onChangeMonth={setPickerDate}
                  renderDay={(date) => {
                    const isSelected =
                      pickerDate.getDate() === date.getDate() &&
                      pickerDate.getMonth() === date.getMonth() &&
                      pickerDate.getFullYear() === date.getFullYear();
                    const isFuture = date > new Date();
                    return (
                      <TouchableOpacity
                        onPress={() => !isFuture && setPickerDate(date)}
                        disabled={isFuture}
                        className="w-[14.28%] aspect-square p-1"
                      >
                        <View
                          className={`flex-1 rounded-lg items-center justify-center ${
                            isSelected
                              ? 'bg-primary'
                              : isFuture
                                ? 'bg-muted/30'
                                : 'bg-muted'
                          }`}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              isSelected
                                ? 'text-primary-foreground'
                                : 'text-foreground'
                            }`}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                <View className="mt-4 pt-4 border-t border-modal-border">
                  <ModalLabel className="mb-2">Time</ModalLabel>
                  <View className="flex-row gap-2 items-center">
                    <ModalInput
                      value={pickerHour}
                      onChangeText={(v) =>
                        setPickerHour(v.padStart(2, '0').slice(0, 2))
                      }
                      placeholder="00"
                      keyboardType="numeric"
                      maxLength={2}
                      className="flex-1 text-center font-bold"
                    />
                    <Text className="text-xl font-bold text-primary">:</Text>
                    <ModalInput
                      value={pickerMinute}
                      onChangeText={(v) =>
                        setPickerMinute(v.padStart(2, '0').slice(0, 2))
                      }
                      placeholder="00"
                      keyboardType="numeric"
                      maxLength={2}
                      className="flex-1 text-center font-bold"
                    />
                  </View>
                </View>
              </ModalBox>
              <ModalButtonRow>
                <ModalButton
                  onPress={() => setShowDatePicker(false)}
                  variant="secondary"
                >
                  Back
                </ModalButton>
                <ModalButton onPress={handleDateConfirm} variant="primary">
                  Done
                </ModalButton>
              </ModalButtonRow>
            </View>
          ) : (
            <View>
              <ModalSection>
                <ModalLabel>Display Name</ModalLabel>
                <ModalInput
                  value={editDisplayName}
                  onChangeText={setEditDisplayName}
                  placeholder="Display name"
                />
              </ModalSection>
              <ModalSection>
                <ModalLabel>Real Addiction Name</ModalLabel>
                <ModalInput
                  value={editActualName}
                  onChangeText={setEditActualName}
                  placeholder="Real addiction name"
                />
              </ModalSection>
              <ModalSection>
                <ModalLabel>Start Date & Time</ModalLabel>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="rounded-xl px-4 py-3 bg-input border-2 border-modal-border"
                >
                  <Text className="text-input-foreground">
                    {editStartDate
                      ? `${new Date(editStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })} ${new Date(editStartDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Tap to select date & time'}
                  </Text>
                </TouchableOpacity>
              </ModalSection>
              <ModalSection last>
                <ModalLabel>Notes</ModalLabel>
                <ModalInput
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Notes"
                  multiline
                  numberOfLines={2}
                />
              </ModalSection>
              <ModalButtonRow>
                <ModalButton
                  onPress={() => setEditMode(false)}
                  variant="secondary"
                >
                  Cancel
                </ModalButton>
                <ModalButton onPress={handleSaveEdit} variant="primary">
                  Save
                </ModalButton>
              </ModalButtonRow>
            </View>
          )
        ) : (
          <View>
            <CalendarGrid
              monthDate={calendarMonth}
              onChangeMonth={setCalendarMonth}
              renderDay={(date) => {
                const dateKey = formatDateKey(date);
                const now = new Date();
                now.setHours(23, 59, 59, 999);
                const isFuture = date > now;
                const value = counter.allHistory[dateKey];
                const isRelapse = value === false;
                const isSober =
                  value === true || (!isFuture && value !== false);
                const isToday = dateKey === todayKey;

                return (
                  <TouchableOpacity
                    onPress={() => !isFuture && handleToggleDay(date)}
                    disabled={isFuture}
                    className="w-[14.28%] aspect-square p-1"
                  >
                    <View
                      className={`flex-1 rounded-lg items-center justify-center ${
                        isRelapse
                          ? 'bg-destructive'
                          : isSober
                            ? 'bg-primary'
                            : isToday
                              ? 'border-2 border-primary'
                              : 'bg-muted'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          isRelapse
                            ? 'text-destructive-foreground'
                            : isSober
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            <View className="gap-2 mt-4">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded bg-primary" />
                <Text className="text-sm text-muted-foreground">
                  Sober Day
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded bg-destructive" />
                <Text className="text-sm text-muted-foreground">
                  Relapse or New Streak
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ModalSurface>
  );
}
