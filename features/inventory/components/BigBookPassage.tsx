import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import type { BigBookPassage } from '../bigBook';

interface BigBookPassageViewProps {
  passage: BigBookPassage;
  /** When true, only title and reference are shown; tap to expand. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

/**
 * Renders a Big Book passage in an expandable box. When collapsed, shows only
 * title and reference; when expanded, shows full text with highlighted phrases.
 */
export function BigBookPassageView({
  passage,
  collapsed = true,
  onToggleCollapsed,
}: BigBookPassageViewProps) {
  const iconColors = useIconColors();
  const { title, reference, body, highlightPhrases = [] } = passage;
  const hasBody = body.trim().length > 0;
  const canExpand = hasBody && onToggleCollapsed != null;

  if (!hasBody) {
    return (
      <View className="rounded-2xl p-4 bg-card border border-border">
        <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
        <Text className="text-sm text-muted-foreground">{reference}</Text>
        <Text className="text-sm text-muted-foreground mt-2 italic">
          Add your excerpt in features/inventory/bigBook.ts
        </Text>
      </View>
    );
  }

  const parts = buildHighlightParts(body, highlightPhrases);

  return (
    <View className="rounded-2xl bg-card border border-border overflow-hidden">
      <TouchableOpacity
        onPress={canExpand ? onToggleCollapsed : undefined}
        activeOpacity={canExpand ? 0.7 : 1}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          <Text className="text-sm text-muted-foreground mt-0.5">{reference}</Text>
        </View>
        {canExpand &&
          (collapsed ? (
            <ChevronDown size={22} color={iconColors.primary} />
          ) : (
            <ChevronUp size={22} color={iconColors.primary} />
          ))}
      </TouchableOpacity>

      {!collapsed && (
        <View className="px-4 pb-4 pt-0 border-t border-border">
          <Text className="text-base text-foreground leading-6">
            {parts.map((part, i) =>
              part.highlight ? (
                <Text key={i} className="bg-primary/20 dark:bg-primary/50 text-foreground">
                  {part.text}
                </Text>
              ) : (
                <Text key={i}>{part.text}</Text>
              )
            )}
          </Text>
          {canExpand && (
            <Text
              onPress={onToggleCollapsed}
              className="text-primary font-semibold text-sm mt-3"
            >
              Show less
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

type Part = { text: string; highlight: boolean };

function buildHighlightParts(text: string, phrases: string[]): Part[] {
  if (phrases.length === 0) return [{ text, highlight: false }];

  const lower = text.toLowerCase();
  const parts: Part[] = [];
  let lastEnd = 0;

  // Collect ranges (start, end) for each phrase occurrence, then sort and merge
  const ranges: { start: number; end: number }[] = [];
  for (const phrase of phrases) {
    const p = phrase.toLowerCase();
    let idx = lower.indexOf(p, 0);
    while (idx !== -1) {
      ranges.push({ start: idx, end: idx + phrase.length });
      idx = lower.indexOf(p, idx + 1);
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    if (merged.length && r.start <= merged[merged.length - 1].end) {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  for (const { start, end } of merged) {
    if (start > lastEnd) {
      parts.push({ text: text.slice(lastEnd, start), highlight: false });
    }
    parts.push({ text: text.slice(start, end), highlight: true });
    lastEnd = end;
  }
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), highlight: false });
  }

  return parts.length ? parts : [{ text, highlight: false }];
}
