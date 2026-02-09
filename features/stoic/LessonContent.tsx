import React from 'react';
import { View, Text } from 'react-native';

interface LessonContentProps {
  lesson: string;
  className?: string;
}

/** Renders lesson text with **headers** as section headers and "quoted" lines as quote style. */
export function LessonContent({ lesson, className = '' }: LessonContentProps) {
  const parts = lesson.split(/\*\*([^*]+)\*\*/);
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      nodes.push(
        <Text key={`h-${i}`} className="text-base font-semibold text-foreground mt-4 mb-1 first:mt-0">
          {parts[i].trim()}
        </Text>
      );
    } else if (parts[i].trim()) {
      const paragraph = parts[i];
      const lines = paragraph.split('\n');
      lines.forEach((line, j) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const isQuote =
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith('"') && trimmed.length > 1);
        if (isQuote) {
          nodes.push(
            <View key={`q-${i}-${j}`} className="my-2 pl-3 border-l-2 border-primary/50">
              <Text className="text-sm italic text-muted-foreground">{trimmed}</Text>
            </View>
          );
        } else {
          nodes.push(
            <Text key={`p-${i}-${j}`} className="text-sm text-foreground leading-6 mb-1.5">
              {trimmed}
            </Text>
          );
        }
      });
    }
  }

  return <View className={className}>{nodes}</View>;
}
