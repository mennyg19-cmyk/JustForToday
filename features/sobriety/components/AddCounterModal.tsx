import React, { useState } from 'react';
import { ModalSurface } from '@/components/ModalSurface';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';

interface AddCounterModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    displayName: string,
    actualName?: string,
    notes?: string
  ) => Promise<void>;
}

export function AddCounterModal({
  visible,
  onClose,
  onSubmit,
}: AddCounterModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [actualName, setActualName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!displayName.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit(
        displayName.trim(),
        actualName.trim() || undefined,
        notes.trim() || undefined
      );
      setDisplayName('');
      setActualName('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error('Failed to add counter:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSurface
      visible={visible}
      onRequestClose={onClose}
      contentClassName="p-6"
    >
      <ModalTitle>Add Sobriety Counter</ModalTitle>

      <ModalSection>
        <ModalLabel>Display Name *</ModalLabel>
        <ModalInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g., Alcohol"
        />
      </ModalSection>

      <ModalSection>
        <ModalLabel>Real Addiction Name (Optional)</ModalLabel>
        <ModalInput
          value={actualName}
          onChangeText={setActualName}
          placeholder="e.g., Alcohol addiction"
        />
      </ModalSection>

      <ModalSection last>
        <ModalLabel>Motivation (Optional)</ModalLabel>
        <ModalInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Why this matters to you..."
          multiline
          numberOfLines={2}
        />
      </ModalSection>

      <ModalButtonRow>
        <ModalButton onPress={onClose} disabled={submitting} variant="secondary">
          Cancel
        </ModalButton>
        <ModalButton
          onPress={handleSubmit}
          disabled={submitting || !displayName.trim()}
          variant="primary"
          loading={submitting}
        >
          Add Counter
        </ModalButton>
      </ModalButtonRow>
    </ModalSurface>
  );
}
