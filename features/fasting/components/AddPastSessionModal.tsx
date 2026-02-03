import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalButtonRow, ModalButton } from '@/components/ModalContent';
import { DateTimePickerBlock } from './DateTimePickerBlock';

interface AddPastSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (startAt: string, endAt: string) => Promise<void>;
}

export function AddPastSessionModal({
  visible,
  onClose,
  onSubmit,
}: AddPastSessionModalProps) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!startAt || !endAt) {
      setError('Please set both start and end time.');
      return;
    }
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();
    if (end <= start) {
      setError('End time must be after start time.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(startAt, endAt);
      onClose();
      setStartAt('');
      setEndAt('');
    } catch (e) {
      setError('Failed to add session.');
    } finally {
      setSubmitting(false);
    }
  }, [startAt, endAt, onSubmit, onClose]);

  const now = new Date();

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="p-6 max-h-[85%]"
    >
      <ModalTitle className="mb-4">Add past session</ModalTitle>
      <DateTimePickerBlock
        label="Start"
        value={startAt}
        onChange={setStartAt}
        maximumDate={now}
      />
      <DateTimePickerBlock
        label="End"
        value={endAt}
        onChange={setEndAt}
        maximumDate={now}
        minimumDate={startAt ? new Date(startAt) : undefined}
      />
      {error ? (
        <View className="mb-3 py-2 px-3 rounded-lg bg-destructive/20">
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      ) : null}
      <ModalButtonRow>
        <ModalButton variant="secondary" onPress={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          variant="primary"
          onPress={handleSubmit}
          disabled={submitting || !startAt || !endAt}
          loading={submitting}
        >
          Add session
        </ModalButton>
      </ModalButtonRow>
    </ModalSurface>
  );
}
