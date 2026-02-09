import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';

interface AddWorkoutModalProps {
  visible: boolean;
  /** When adding for a past day */
  dateLabel?: string;
  onClose: () => void;
  onSave: (activityName: string, durationMinutes: number, caloriesBurned: number) => Promise<void>;
}

const ACTIVITY_OPTIONS = [
  'Running',
  'Walking',
  'Cycling',
  'Swimming',
  'Strength',
  'Yoga',
  'HIIT',
  'Other',
];

export function AddWorkoutModal({
  visible,
  dateLabel,
  onClose,
  onSave,
}: AddWorkoutModalProps) {
  const [activityName, setActivityName] = useState('');
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const mins = parseInt(duration.replace(/\D/g, ''), 10);
    const cals = parseInt(calories.replace(/\D/g, ''), 10);
    const name = activityName.trim() || 'Workout';
    if (Number.isNaN(mins) || mins < 0 || Number.isNaN(cals) || cals < 0) return;
    setSubmitting(true);
    try {
      await onSave(name, mins, cals);
      setActivityName('');
      setDuration('');
      setCalories('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const durationNum = parseInt(duration.replace(/\D/g, ''), 10);
  const caloriesNum = parseInt(calories.replace(/\D/g, ''), 10);
  const valid =
    (activityName.trim().length > 0 || true) &&
    !Number.isNaN(durationNum) &&
    durationNum >= 0 &&
    !Number.isNaN(caloriesNum) &&
    caloriesNum >= 0;

  const title = dateLabel ? `Log workout for ${dateLabel}` : 'Log workout';

  return (
    <ModalSurface visible={visible} onRequestClose={onClose} contentClassName="p-6">
      <ModalTitle className="mb-4">{title}</ModalTitle>

      <ModalLabel>Activity</ModalLabel>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {ACTIVITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setActivityName(activityName === opt ? '' : opt)}
            className={`px-3 py-2 rounded-lg border ${
              activityName === opt ? 'bg-primary border-primary' : 'bg-muted border-border'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activityName === opt ? 'text-primary-foreground' : 'text-modal-content-foreground'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ModalInput
        value={activityName}
        onChangeText={setActivityName}
        placeholder="Or type custom (e.g. Rowing)"
        className="mb-4"
      />

      <ModalLabel>Duration (minutes)</ModalLabel>
      <ModalInput
        value={duration}
        onChangeText={setDuration}
        placeholder="e.g. 30"
        keyboardType="number-pad"
        className="mb-4"
      />

      <ModalLabel>Calories burned</ModalLabel>
      <ModalInput
        value={calories}
        onChangeText={setCalories}
        placeholder="e.g. 250"
        keyboardType="number-pad"
        className="mb-4"
      />

      <ModalButtonRow>
        <ModalButton variant="secondary" onPress={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          variant="primary"
          onPress={handleSave}
          disabled={!valid || submitting}
          loading={submitting}
        >
          Save
        </ModalButton>
      </ModalButtonRow>
    </ModalSurface>
  );
}
