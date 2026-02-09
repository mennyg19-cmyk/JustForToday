import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

const CARD_CLASS = 'rounded-2xl p-4 bg-card border border-border';

interface MetricCardProps {
  /** Optional icon (e.g. Flame, Footprints) */
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  /** Main value (number, string, or node) */
  value: React.ReactNode;
  /** Optional subtitle below value */
  subtitle?: string;
  /** Optional: action button label; when set, card shows a button and onAction is called on press */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional: secondary action (e.g. "Sync") – rendered as a text-style button */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** When true, card is half width (for 2-column layout). Default false = full width. */
  halfWidth?: boolean;
  /** Optional extra content (e.g. progress bar, list) below subtitle */
  children?: React.ReactNode;
  /** Optional: make the whole card pressable (e.g. for navigation) */
  onPress?: () => void;
}

/**
 * Reusable metric/summary card. Matches habits/sobriety styling: bg-card, rounded-2xl, border.
 * Use for dashboard tiles, steps/calories/workouts, etc.
 */
export function MetricCard({
  icon: Icon,
  iconColor,
  title,
  value,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  halfWidth = false,
  children,
  onPress,
}: MetricCardProps) {
  const content = (
    <>
      <View className="flex-row items-center gap-2 mb-2">
        {Icon && iconColor && <Icon size={20} color={iconColor} />}
        <Text className="text-base font-semibold text-foreground">{title}</Text>
      </View>
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          {typeof value === 'string' || typeof value === 'number' ? (
            <Text className="text-3xl font-bold text-foreground">{value}</Text>
          ) : (
            value
          )}
        </View>
        <View className="flex-row items-center gap-2">
          {secondaryActionLabel && onSecondaryAction ? (
            <TouchableOpacity
              onPress={onSecondaryAction}
              className="px-2 py-1.5"
              activeOpacity={0.8}
            >
              <Text className="text-sm font-medium text-primary">{secondaryActionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {actionLabel && onAction ? (
            <TouchableOpacity
              onPress={onAction}
              className="px-3 py-2 rounded-lg bg-primary"
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-primary-foreground">{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {subtitle ? (
        <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
      {children ? <View className="mt-3">{children}</View> : null}
    </>
  );

  const cardClassName = halfWidth
    ? `w-[48%] ${CARD_CLASS}`
    : CARD_CLASS;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        className={cardClassName}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View className={cardClassName}>{content}</View>;
}
