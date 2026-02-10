import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface AppHeaderProps {
  title: string;
  rightSlot?: React.ReactNode;
  showBack?: boolean;
  /** When set, back button calls this instead of router.back() (e.g. return to Analytics). */
  onBackPress?: () => void;
}

/**
 * Shared page header with optional back button and right-side slot.
 * Keeps page chrome consistent across screens.
 *
 * When `showBack` is omitted the back arrow auto-shows only when
 * there is a screen to navigate back to (i.e. the screen was pushed,
 * not opened as a tab root).
 */
export function AppHeader({ title, rightSlot, showBack, onBackPress }: AppHeaderProps) {
  const router = useRouter();
  const iconColors = useIconColors();
  const handleBack = onBackPress ?? (() => router.back());
  const canGoBack = showBack ?? router.canGoBack();

  return (
    <View className="flex-row items-center justify-between px-6 py-5">
      <View className="flex-row items-center gap-3">
        {canGoBack && (
          <TouchableOpacity onPress={handleBack} hitSlop={8}>
            <ArrowLeft size={22} color={iconColors.primary} />
          </TouchableOpacity>
        )}
        <Text
          className="text-2xl font-bold text-foreground"
          style={{ letterSpacing: 0.3 }}
        >
          {title}
        </Text>
      </View>
      {rightSlot}
    </View>
  );
}
