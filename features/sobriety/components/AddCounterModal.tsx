/**
 * AddCounterModal — add a new sobriety counter.
 *
 * Renders as a bottom sheet to avoid keyboard occlusion issues.
 * Fields: display name, optional actual name, start date/time, motivation.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { useIconColors } from '@/lib/iconTheme';

interface AddCounterModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    displayName: string,
    actualName?: string,
    notes?: string,
    startDateISO?: string
  ) => Promise<void>;
}

function toStartISO(date: Date, hour: string, minute: string): string {
  const d = new Date(date);
  d.setHours(parseInt(hour, 10) || 0, parseInt(minute, 10) || 0, 0, 0);
  return d.toISOString();
}

/** Simple month calendar grid for picking a date. */
function MiniCalendar({
  selected,
  onSelect,
  iconColors,
}: {
  selected: Date;
  onSelect: (d: Date) => void;
  iconColors: ReturnType<typeof useIconColors>;
}) {
  const [viewMonth, setViewMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const prevMonth = useCallback(() => {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  }, []);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <TouchableOpacity onPress={prevMonth} className="px-3 py-1">
          <Text className="text-foreground text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="text-foreground font-semibold text-sm">{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} className="px-3 py-1">
          <Text className="text-foreground text-lg">›</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row flex-wrap">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <View key={i} className="w-[14.28%] items-center py-1">
            <Text className="text-muted-foreground text-xs font-semibold">{d}</Text>
          </View>
        ))}
        {days.map((day, i) => {
          if (day == null) {
            return <View key={`empty-${i}`} className="w-[14.28%] aspect-square" />;
          }
          const d = new Date(year, month, day);
          const isSelected =
            selected.getDate() === day &&
            selected.getMonth() === month &&
            selected.getFullYear() === year;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => onSelect(d)}
              className="w-[14.28%] aspect-square p-0.5"
            >
              <View
                className={`flex-1 rounded-lg items-center justify-center ${
                  isSelected ? 'bg-primary' : ''
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function AddCounterModal({
  visible,
  onClose,
  onSubmit,
}: AddCounterModalProps) {
  const iconColors = useIconColors();
  const now = new Date();
  const [displayName, setDisplayName] = useState('');
  const [actualName, setActualName] = useState('');
  const [notes, setNotes] = useState('');
  const [pickerDate, setPickerDate] = useState(now);
  const [pickerHour, setPickerHour] = useState(now.getHours().toString().padStart(2, '0'));
  const [pickerMinute, setPickerMinute] = useState(now.getMinutes().toString().padStart(2, '0'));
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      const n = new Date();
      setDisplayName('');
      setActualName('');
      setNotes('');
      setPickerDate(n);
      setPickerHour(n.getHours().toString().padStart(2, '0'));
      setPickerMinute(n.getMinutes().toString().padStart(2, '0'));
      setShowDatePicker(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!displayName.trim()) return;
    try {
      setSubmitting(true);
      const startISO = toStartISO(pickerDate, pickerHour, pickerMinute);
      await onSubmit(
        displayName.trim(),
        actualName.trim() || undefined,
        notes.trim() || undefined,
        startISO
      );
      onClose();
    } catch (err) {
      console.error('Failed to add counter:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startLabel =
    `${pickerDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ` +
    `${pickerHour.padStart(2, '0')}:${pickerMinute.padStart(2, '0')}`;

  const inputClass = 'bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-sm';

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="p-0 rounded-t-3xl"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          style={{ maxHeight: '100%' }}
        >
          {/* Handle bar */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <Text className="text-xl font-bold text-foreground mb-6">
            Add Sobriety Counter
          </Text>

          {/* Display Name */}
          <View className="mb-4">
            <Text className="text-muted-foreground text-xs font-semibold mb-1.5">
              Display Name *
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g., Alcohol"
              placeholderTextColor={iconColors.muted}
              className={inputClass}
              autoFocus
            />
          </View>

          {/* Actual Name */}
          <View className="mb-4">
            <Text className="text-muted-foreground text-xs font-semibold mb-1.5">
              Real Name (optional, private)
            </Text>
            <TextInput
              value={actualName}
              onChangeText={setActualName}
              placeholder="e.g., Alcohol addiction"
              placeholderTextColor={iconColors.muted}
              className={inputClass}
            />
          </View>

          {/* Start Date/Time */}
          <View className="mb-4">
            <Text className="text-muted-foreground text-xs font-semibold mb-1.5">
              Sobriety start date
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(!showDatePicker)}
              className="bg-background border border-border rounded-lg px-3 py-2.5 flex-row items-center justify-between"
            >
              <Text className="text-foreground text-sm">{startLabel}</Text>
              <Text className="text-muted-foreground text-sm">
                {showDatePicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View className="mt-2 border border-border rounded-lg p-3 bg-card">
                <MiniCalendar
                  selected={pickerDate}
                  onSelect={(d) => setPickerDate(d)}
                  iconColors={iconColors}
                />
                <View className="mt-3 pt-3 border-t border-border">
                  <Text className="text-muted-foreground text-xs mb-2">Time</Text>
                  <View className="flex-row gap-2 items-center">
                    <TextInput
                      value={pickerHour}
                      onChangeText={(v) =>
                        setPickerHour(v.replace(/\D/g, '').slice(0, 2))
                      }
                      placeholder="00"
                      placeholderTextColor={iconColors.muted}
                      keyboardType="number-pad"
                      maxLength={2}
                      className={`${inputClass} flex-1 text-center font-bold`}
                    />
                    <Text className="text-xl font-bold text-primary">:</Text>
                    <TextInput
                      value={pickerMinute}
                      onChangeText={(v) =>
                        setPickerMinute(v.replace(/\D/g, '').slice(0, 2))
                      }
                      placeholder="00"
                      placeholderTextColor={iconColors.muted}
                      keyboardType="number-pad"
                      maxLength={2}
                      className={`${inputClass} flex-1 text-center font-bold`}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Motivation */}
          <View className="mb-6">
            <Text className="text-muted-foreground text-xs font-semibold mb-1.5">
              Motivation (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Why this matters to you..."
              placeholderTextColor={iconColors.muted}
              multiline
              numberOfLines={2}
              className={`${inputClass} min-h-[60px]`}
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              activeOpacity={0.7}
              className="flex-1 bg-muted py-3.5 rounded-xl items-center"
            >
              <Text className="text-muted-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !displayName.trim()}
              activeOpacity={0.7}
              style={{ opacity: submitting || !displayName.trim() ? 0.5 : 1 }}
              className="flex-1 bg-primary py-3.5 rounded-xl items-center flex-row justify-center gap-2"
            >
              {submitting && <ActivityIndicator size="small" color={iconColors.primaryForeground} />}
              <Text className="text-primary-foreground font-semibold">
                {submitting ? 'Adding...' : 'Add Counter'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ModalSurface>
  );
}
