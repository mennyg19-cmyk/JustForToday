import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';

/**
 * Stoic module — skeleton. Build out with reflections, practices, etc.
 */
export function StoicScreen() {
  const iconColors = useIconColors();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Stoic" rightSlot={<ThemeToggle />} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
      >
        <View className="rounded-2xl p-6 bg-card border border-border items-center justify-center">
          <BookOpen size={48} color={iconColors.primary} />
          <Text className="text-lg font-semibold text-foreground mt-4">
            Stoic
          </Text>
          <Text className="text-sm text-muted-foreground text-center mt-2">
            Reflections and practices. Coming soon.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
