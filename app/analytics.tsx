import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Analytics" rightSlot={<ThemeToggle />} />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-2">Analytics</Text>
        <Text className="text-muted-foreground text-center">
          Feature coming soon. This will show analytics across all tracked data.
        </Text>
      </View>
    </SafeAreaView>
  );
}
