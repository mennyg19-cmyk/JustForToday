import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { ModalLabel, ModalInput, ModalBox } from '@/components/ModalContent';
import { CalendarGrid } from '@/components/CalendarGrid';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateTimeDisplay } from '../utils';

interface DateTimePickerBlockProps {
  label: string;
  value: string; // ISO
  onChange: (iso: string) => void;
  maximumDate?: Date; // e.g. today for "end" to avoid future
  minimumDate?: Date;
}

export function DateTimePickerBlock({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DateTimePickerBlockProps) {
  const iconColors = useIconColors();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(() =>
    value ? new Date(value) : new Date()
  );
  const [pickerHour, setPickerHour] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getHours().toString().padStart(2, '0');
  });
  const [pickerMinute, setPickerMinute] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMinutes().toString().padStart(2, '0');
  });

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setPickerDate(d);
      setPickerHour(d.getHours().toString().padStart(2, '0'));
      setPickerMinute(d.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  const handleConfirm = () => {
    const d = new Date(pickerDate);
    d.setHours(parseInt(pickerHour, 10), parseInt(pickerMinute, 10), 0, 0);
    onChange(d.toISOString());
    setShowPicker(false);
  };

  const isFuture = (date: Date) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return date > now;
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-2 mb-2">
        {showPicker && (
          <TouchableOpacity onPress={() => setShowPicker(false)} className="p-2 -ml-2">
            <ChevronLeft size={20} color={iconColors.primary} />
          </TouchableOpacity>
        )}
        <ModalLabel className="mb-0">{label}</ModalLabel>
      </View>
      {showPicker ? (
        <ModalBox className="mb-2">
          <CalendarGrid
            monthDate={pickerDate}
            onChangeMonth={setPickerDate}
            renderDay={(date) => {
              const isSelected =
                pickerDate.getDate() === date.getDate() &&
                pickerDate.getMonth() === date.getMonth() &&
                pickerDate.getFullYear() === date.getFullYear();
              const disabled =
                (maximumDate && date > maximumDate) ||
                (minimumDate && date < minimumDate);
              return (
                <TouchableOpacity
                  onPress={() => !disabled && setPickerDate(date)}
                  disabled={disabled}
                  className="w-[14.28%] aspect-square p-1"
                >
                  <View
                    className={`flex-1 rounded-lg items-center justify-center ${
                      isSelected ? 'bg-primary' : disabled ? 'bg-muted/30' : 'bg-muted'
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
          <View className="mt-4 pt-4 border-t border-border">
            <ModalLabel className="mb-2">Time</ModalLabel>
            <View className="flex-row gap-2 items-center">
              <ModalInput
                value={pickerHour}
                onChangeText={(v) => setPickerHour(v.replace(/\D/g, '').padStart(2, '0').slice(0, 2))}
                placeholder="00"
                keyboardType="numeric"
                maxLength={2}
                className="flex-1 text-center font-bold"
              />
              <Text className="text-xl font-bold text-primary">:</Text>
              <ModalInput
                value={pickerMinute}
                onChangeText={(v) => setPickerMinute(v.replace(/\D/g, '').padStart(2, '0').slice(0, 2))}
                placeholder="00"
                keyboardType="numeric"
                maxLength={2}
                className="flex-1 text-center font-bold"
              />
            </View>
          </View>
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              className="flex-1 py-3 rounded-xl bg-muted items-center"
            >
              <Text className="text-foreground font-semibold">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-primary items-center"
            >
              <Text className="text-primary-foreground font-semibold">Done</Text>
            </TouchableOpacity>
          </View>
        </ModalBox>
      ) : (
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          className="rounded-xl px-4 py-3 bg-input border-2 border-border"
        >
          <Text className="text-foreground">
            {value ? formatDateTimeDisplay(value) : 'Tap to select date & time'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
