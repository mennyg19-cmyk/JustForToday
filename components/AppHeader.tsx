import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface AppHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
  showBack?: boolean;
}

/**
 * Shared page header with optional back button and right-side slot.
 * Keeps page chrome consistent across screens.
 */
export function AppHeader({ title, rightSlot, showBack = true }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
      <View className="flex-row items-center gap-3">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} color="#c4b5fd" />
          </TouchableOpacity>
        )}
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
      </View>
      {rightSlot}
    </View>
  );
}
