/**
 * CollapsibleSection — tappable card header that expands/collapses content.
 * Used in the Settings screen to keep the page compact.
 *
 * The header and expanded content are wrapped in a single card so the
 * content is visually contained within the section even when expanded.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutChangeEvent } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface CollapsibleSectionProps {
  title: string;
  /** Optional subtitle shown below the title in the collapsed header. */
  subtitle?: string;
  /** Icon rendered to the left of the title. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  /** Start expanded instead of collapsed. */
  defaultExpanded?: boolean;
}

export function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const iconColors = useIconColors();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState(0);
  const animHeight = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    Animated.parallel([
      Animated.timing(animHeight, {
        toValue: next ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: next ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded, animHeight, rotateAnim]);

  // Measure content on layout
  const onContentLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setContentHeight(h);
  }, []);

  // Update animated value when content size changes while expanded
  useEffect(() => {
    if (expanded && contentHeight > 0) {
      animHeight.setValue(1);
    }
  }, [contentHeight, expanded, animHeight]);

  const interpolatedHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight || 500],
  });

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className="mb-4 bg-card rounded-xl border border-border overflow-hidden">
      {/* Header — always visible */}
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        className="p-4 flex-row items-center"
      >
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">
          <Text className="text-foreground font-semibold">{title}</Text>
          {subtitle && (
            <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text>
          )}
        </View>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <ChevronDown size={20} color={iconColors.muted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Content — expands within the same card */}
      <Animated.View style={{ height: interpolatedHeight, overflow: 'hidden' }}>
        <View onLayout={onContentLayout} style={{ position: 'absolute', width: '100%' }}>
          <View className="border-t border-border px-4 pb-4 pt-3">
            {children}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
