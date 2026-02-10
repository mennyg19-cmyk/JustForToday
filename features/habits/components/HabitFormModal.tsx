import React, { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { ModalSurface } from '@/components/ModalSurface';
import {
  ModalTitle,
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalBox,
  ModalChoiceGroup,
  ModalChoiceButton,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';
import { logger } from '@/lib/logger';

interface HabitFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    frequency: 'daily' | 'weekly',
    type: 'build' | 'break'
  ) => Promise<void>;
}

export function HabitFormModal({ visible, onClose, onSubmit }: HabitFormModalProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [type, setType] = useState<'build' | 'break'>('build');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit(name.trim(), frequency, type);
      setName('');
      setFrequency('daily');
      setType('build');
      onClose();
    } catch (err) {
      logger.error('Failed to add habit:', err);
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
      <ModalTitle>Add New Habit</ModalTitle>

      <ModalSection>
        <ModalLabel>Habit Name</ModalLabel>
        <ModalInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Morning Run"
        />
      </ModalSection>

      <ModalSection>
        <ModalLabel>Frequency</ModalLabel>
        <ModalChoiceGroup>
          <ModalChoiceButton
            selected={frequency === 'daily'}
            onPress={() => setFrequency('daily')}
          >
            Daily
          </ModalChoiceButton>
          <ModalChoiceButton
            selected={frequency === 'weekly'}
            onPress={() => setFrequency('weekly')}
          >
            Weekly
          </ModalChoiceButton>
        </ModalChoiceGroup>
      </ModalSection>

      <ModalSection last>
        <ModalLabel>Type</ModalLabel>
        <ModalBox>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text className="text-2xl">{type === 'build' ? '🏗️' : '🚫'}</Text>
              <View>
                <Text className="font-bold text-modal-content-foreground">
                  {type === 'build' ? 'Build Habit' : 'Break Habit'}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {type === 'build' ? 'Something to do' : 'Something to avoid'}
                </Text>
              </View>
            </View>
            <Switch
              value={type === 'break'}
              onValueChange={(val) => setType(val ? 'break' : 'build')}
              trackColor={{ false: '#B48C3C', true: '#C83232' }}
              thumbColor="#ffffff"
            />
          </View>
        </ModalBox>
      </ModalSection>

      <ModalButtonRow>
        <ModalButton onPress={onClose} disabled={submitting} variant="secondary">
          Cancel
        </ModalButton>
        <ModalButton
          onPress={handleSubmit}
          disabled={submitting || !name.trim()}
          variant="primary"
          loading={submitting}
        >
          Add Habit
        </ModalButton>
      </ModalButtonRow>
    </ModalSurface>
  );
}
