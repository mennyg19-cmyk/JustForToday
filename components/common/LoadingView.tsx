import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" />
      {message && <Text className="mt-4 text-muted-foreground">{message}</Text>}
    </SafeAreaView>
  );
}
