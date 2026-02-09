import React from 'react';
import { View } from 'react-native';

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View className="flex-row justify-center gap-2 py-8">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full transition-all ${
            index === current
              ? 'w-8 bg-primary'
              : 'w-2 bg-muted'
          }`}
        />
      ))}
    </View>
  );
}
