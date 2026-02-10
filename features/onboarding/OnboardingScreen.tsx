/**
 * OnboardingScreen - First-time user experience
 *
 * Walks users through the app philosophy and initial setup.
 * Shows once, then accessible via Settings > About.
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, FlatList, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeStep } from './steps/WelcomeStep';
import { StoryStep } from './steps/StoryStep';
import { PhilosophyStep } from './steps/PhilosophyStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ProfileStep } from './steps/ProfileStep';
import { SobrietySetupStep } from './steps/SobrietySetupStep';
import { HabitsSetupStep } from './steps/HabitsSetupStep';
import { GoalsStep } from './steps/GoalsStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { logger } from '@/lib/logger';
import { CompleteStep } from './steps/CompleteStep';
import { ProgressDots } from './components/ProgressDots';
import { setOnboardingCompleted } from '@/lib/settings/database';

const STEPS = [
  WelcomeStep,
  StoryStep,
  PhilosophyStep,
  FeaturesStep,
  ProfileStep,
  SobrietySetupStep,
  HabitsSetupStep,
  GoalsStep,
  PermissionsStep,
  CompleteStep,
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const scrollRef = useRef<FlatList>(null);

  // Height available for each step (full screen minus safe area and progress dots)
  const stepHeight = height - insets.top - insets.bottom - 56;

  const handleComplete = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      await setOnboardingCompleted();
      onComplete();
    } catch (err) {
      logger.error('Failed to save onboarding state:', err);
      // Still let the user proceed — don't leave them stuck
      onComplete();
    }
  }, [completing, onComplete]);

  const handleNext = useCallback(() => {
    if (currentIndex < STEPS.length - 1) {
      const nextIndex = currentIndex + 1;
      // Update index immediately — on web, onMomentumScrollEnd may not fire
      // for programmatic scrolls, which would leave currentIndex stale.
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      handleComplete();
    }
  }, [currentIndex, handleComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  }, [width]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), [width]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        ref={scrollRef}
        data={STEPS}
        renderItem={({ item: StepComponent, index }) => (
          <View style={{ width, height: stepHeight }}>
            <StepComponent
              onNext={handleNext}
              onSkip={handleSkip}
              isFirst={index === 0}
              isLast={index === STEPS.length - 1}
            />
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled={!completing}
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
      />

      <ProgressDots
        total={STEPS.length}
        current={currentIndex}
      />
    </SafeAreaView>
  );
}
