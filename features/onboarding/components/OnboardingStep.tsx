/**
 * OnboardingStep - Shared wrapper for all onboarding steps
 * Provides consistent layout, keyboard avoidance, and navigation buttons
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface OnboardingStepProps {
  children: React.ReactNode;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  showSkip?: boolean;
}

export function OnboardingStep({
  children,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  showSkip = true,
}: OnboardingStepProps) {
  const iconColors = useIconColors();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 px-6">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 40, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>

        {/* Navigation buttons */}
        <View className="pb-4 gap-3">
          {onNext && (
            <TouchableOpacity
              onPress={onNext}
              className="bg-primary rounded-xl py-4 px-6 flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-primary-foreground text-lg font-semibold mr-2">
                {nextLabel}
              </Text>
              <ChevronRight size={20} color={iconColors.primaryForeground} />
            </TouchableOpacity>
          )}

          {showSkip && onSkip && (
            <TouchableOpacity onPress={onSkip} className="py-3" activeOpacity={0.6}>
              <Text className="text-muted-foreground text-center text-base">
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
