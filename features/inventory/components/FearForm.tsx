/**
 * FearForm — placeholder for the upcoming fear inventory feature.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

export function FearForm() {
  const iconColors = useIconColors();

  return (
    <View className="items-center py-16 gap-4">
      <View className="bg-muted rounded-full p-4">
        <Clock size={32} color={iconColors.muted} />
      </View>
      <Text className="text-lg font-bold text-foreground">Fear Inventory</Text>
      <Text className="text-muted-foreground text-sm text-center px-6">
        Coming soon — a guided inventory for working through fears.
      </Text>
    </View>
  );
}
