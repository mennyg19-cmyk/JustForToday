import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { getQuoteOfTheDay } from '@/lib/quotes';

/**
 * Displays a daily stoic/inspirational quote. Same quote all day; changes at midnight.
 * Uses theme: text-foreground, text-muted-foreground, bg-card/border.
 */
export function DailyQuote() {
  const quote = useMemo(() => getQuoteOfTheDay(), []);

  return (
    <View className="rounded-xl px-4 py-3 bg-card border border-border mb-1">
      <Text className="text-sm text-foreground italic" numberOfLines={3}>
        "{quote.text}"
      </Text>
      <Text className="text-xs text-muted-foreground mt-1.5">
        — {quote.author}
      </Text>
    </View>
  );
}
