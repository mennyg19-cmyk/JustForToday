import React, { useEffect } from 'react';
import { View, LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProgressDotsProps {
  total: number;
  current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [current]);

  return (
    <View className="flex-row justify-center gap-2 py-8">
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${
            index === current
              ? 'w-8 bg-primary'
              : 'w-2 bg-muted'
          }`}
        />
      ))}
    </View>
  );
}
