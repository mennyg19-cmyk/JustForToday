import React from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6">
      {icon}
      <Text className="mt-4 text-base text-muted-foreground text-center">{message}</Text>
    </View>
  );
}
