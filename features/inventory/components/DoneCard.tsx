import React from 'react';
import { View, Text } from 'react-native';
import { ModalButton } from '@/components/ModalContent';

interface Props {
  title: string;
  subtitle: string;
  onEdit: () => void;
}

/** Completion card shown when today's morning/nightly inventory is already done. */
export function DoneCard({ title, subtitle, onEdit }: Props) {
  return (
    <View className="rounded-2xl p-5 bg-card border border-border">
      <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted-foreground mb-4">{subtitle}</Text>
      <ModalButton onPress={onEdit} variant="primary">Edit</ModalButton>
    </View>
  );
}
