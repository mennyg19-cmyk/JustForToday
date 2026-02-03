import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';

export interface EditStepsModalProps {
  visible: boolean;
  currentSteps: number;
  /** Optional: when editing a past day */
  dateKey?: string;
  dateLabel?: string;
  onClose: () => void;
  onSave: (steps: number, dateKey?: string) => Promise<void>;
}

export function EditStepsModal({
  visible,
  currentSteps,
  dateKey,
  dateLabel,
  onClose,
  onSave,
}: EditStepsModalProps) {
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setValue(currentSteps > 0 ? String(currentSteps) : '');
    }
  }, [visible, currentSteps]);

  const handleSave = async () => {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    if (Number.isNaN(num) || num < 0) return;
    setSubmitting(true);
    try {
      await onSave(num, dateKey);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const num = parseInt(value.replace(/\D/g, ''), 10);
  const valid = !Number.isNaN(num) && num >= 0;
  const title = dateLabel ? `Steps for ${dateLabel}` : 'Steps for today';

  return (
    <ModalSurface visible={visible} onRequestClose={onClose} contentClassName="p-6">
      <ModalTitle className="mb-4">{title}</ModalTitle>
      <ModalLabel>Number of steps</ModalLabel>
      <ModalInput
        value={value}
        onChangeText={setValue}
        placeholder="e.g. 8500"
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
