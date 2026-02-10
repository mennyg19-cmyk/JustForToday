import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIconColors } from '@/lib/iconTheme';

interface LoadingViewProps {
  message?: string;
  color?: string;
}

export function LoadingView({ message, color }: LoadingViewProps) {
  const iconColors = useIconColors();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color={color ?? iconColors.primary} />
      {message && <Text className="mt-4 text-muted-foreground">{message}</Text>}
    </SafeAreaView>
  );
}
