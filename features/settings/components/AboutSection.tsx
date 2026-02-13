import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, ChevronRight } from 'lucide-react-native';

const cardClass = 'bg-card rounded-xl p-4 border border-border';

interface Props {
  iconColors: Record<string, string>;
  onOpenStory: () => void;
}

export function AboutSection({ iconColors, onOpenStory }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-bold text-foreground mb-3">About</Text>
      <View className="gap-3">
        <View className={`${cardClass}`}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-foreground font-semibold text-sm">Version 4.1.5</Text>
            <Text className="text-muted-foreground text-sm">Feb 2026</Text>
          </View>
          <Text className="text-muted-foreground text-xs">Built by Menny, baked by Daniel</Text>
        </View>

        <TouchableOpacity
          onPress={onOpenStory}
          activeOpacity={0.7}
          className={`${cardClass} flex-row items-center gap-3`}
        >
          <Heart size={24} color={iconColors.primary} />
          <View className="flex-1">
            <Text className="text-foreground font-semibold">Our Story</Text>
            <Text className="text-xs text-muted-foreground">Why this app exists and our philosophy</Text>
          </View>
          <ChevronRight size={20} color={iconColors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
