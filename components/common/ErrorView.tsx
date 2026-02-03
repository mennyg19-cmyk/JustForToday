import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  const iconColors = useIconColors();

  return (
    <View className="flex-1 items-center justify-center p-6">
      <AlertCircle size={48} color={iconColors.destructive} />
      <Text className="mt-4 text-lg font-semibold text-foreground text-center">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-6 px-6 py-3 bg-primary rounded-lg"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
