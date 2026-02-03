import React, { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalTitle, ModalButtonRow, ModalButton } from '@/components/ModalContent';
import { DateTimePickerBlock } from './DateTimePickerBlock';
import type { FastingSession } from '@/lib/database/schema';

interface EditSessionModalProps {
  session: FastingSession | null;
  visible: boolean;
  onClose: () => void;
  onSave: (
    sessionId: string,
    updates: { startAt?: string; endAt?: string | null }
  ) => Promise<void>;
}

export function EditSessionModal({
  session,
  visible,
  onClose,
  onSave,
}: EditSessionModalProps) {
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = session?.endAt == null;

  useEffect(() => {
    if (session) {
      setStartAt(session.startAt);
      setEndAt(session.endAt);
      setError(null);
    }
  }, [session]);

  const handleSave = useCallback(async () => {
    if (!session) return;
    if (!startAt) {
      setError('Start time is required.');
      return;
    }
    if (!isActive && endAt != null) {
      const start = new Date(startAt).getTime();
      const end = new Date(endAt).getTime();
      if (end <= start) {
        setError('End time must be after start time.');
        return;
      }
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSave(session.id, {
        startAt,
        ...(isActive ? {} : { endAt }),
      });
      onClose();
    } catch (e) {
      setError('Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }, [session, startAt, endAt, isActive, onSave, onClose]);

  if (!session) return null;

  const now = new Date();

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      position="bottom"
      animationType="slide"
      contentClassName="p-6 max-h-[85%]"
    >
      <ModalTitle className="mb-4">
        {isActive ? 'Edit start time' : 'Edit session'}
      </ModalTitle>
      <DateTimePickerBlock
        label="Start"
        value={startAt}
        onChange={setStartAt}
        maximumDate={now}
      />
      {!isActive && (
        <DateTimePickerBlock
          label="End"
          value={endAt ?? ''}
          onChange={(v) => setEndAt(v)}
          maximumDate={now}
          minimumDate={startAt ? new Date(startAt) : undefined}
        />
      )}
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
          onPress={handleSave}
          disabled={submitting}
          loading={submitting}
        >
          Save
        </ModalButton>
      </ModalButtonRow>
    </ModalSurface>
  );
}
