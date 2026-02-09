import React, { useMemo, useCallback } from 'react';
import { Text, TouchableOpacity, Share, Platform } from 'react-native';
import { getQuoteOfTheDay } from '@/lib/quotes';

/**
 * Displays a daily stoic/inspirational quote. Same quote all day; changes at midnight.
 * Tap to open the native share sheet with the quote.
 */
export function DailyQuote() {
  const quote = useMemo(() => getQuoteOfTheDay(), []);

  const handleShare = useCallback(async () => {
    const message = `"${quote.text}" — ${quote.author}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Daily quote',
            text: message,
          });
        } else {
          await navigator.clipboard?.writeText(message);
        }
      } else {
        await Share.share({
          message,
          title: 'Daily quote',
        });
      }
    } catch {
      // User cancelled or share failed – ignore
    }
  }, [quote.text, quote.author]);

  return (
    <TouchableOpacity
      onPress={handleShare}
      activeOpacity={0.8}
      className="rounded-xl px-4 py-3 bg-card border border-border mb-1"
    >
      <Text className="text-sm text-foreground italic" numberOfLines={3}>
        "{quote.text}"
      </Text>
      <Text className="text-xs text-muted-foreground mt-1.5">
        — {quote.author}
      </Text>
    </TouchableOpacity>
  );
}
