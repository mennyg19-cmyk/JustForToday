/**
 * OnboardingScreen - First-time user experience
 *
 * Walks users through the app philosophy and initial setup.
 * Shows once, then accessible via Settings > About.
 *
 * If the user chooses "support" program type, the SobrietySetupStep is
 * automatically skipped and sobriety/daily_renewal modules are disabled.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, FlatList, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WelcomeStep } from './steps/WelcomeStep';
import { StoryStep } from './steps/StoryStep';
import { PhilosophyStep } from './steps/PhilosophyStep';
import { ProgramTypeStep } from './steps/ProgramTypeStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ProfileStep } from './steps/ProfileStep';
import { SobrietySetupStep } from './steps/SobrietySetupStep';
import { HabitsSetupStep } from './steps/HabitsSetupStep';
import { GoalsStep } from './steps/GoalsStep';
import { PermissionsStep } from './steps/PermissionsStep';
import { logger } from '@/lib/logger';
import { CompleteStep } from './steps/CompleteStep';
import { ProgressDots } from './components/ProgressDots';
import { setOnboardingCompleted, getProgramType, saveAppVisibility } from '@/lib/settings/database';
import type { ProgramType } from '@/lib/settings/database';
import { getAppVisibility } from '@/lib/settings/database';

/** All possible steps in order. SobrietySetupStep is filtered out for support users. */
const ALL_STEPS = [
  { key: 'welcome', Component: WelcomeStep, recoveryOnly: false },
  { key: 'story', Component: StoryStep, recoveryOnly: false },
  { key: 'philosophy', Component: PhilosophyStep, recoveryOnly: false },
  { key: 'programType', Component: ProgramTypeStep, recoveryOnly: false },
  { key: 'features', Component: FeaturesStep, recoveryOnly: false },
  { key: 'profile', Component: ProfileStep, recoveryOnly: false },
  { key: 'sobriety', Component: SobrietySetupStep, recoveryOnly: true },
  { key: 'habits', Component: HabitsSetupStep, recoveryOnly: false },
  { key: 'goals', Component: GoalsStep, recoveryOnly: false },
  { key: 'permissions', Component: PermissionsStep, recoveryOnly: false },
  { key: 'complete', Component: CompleteStep, recoveryOnly: false },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [programType, setProgramTypeState] = useState<ProgramType>('recovery');
  const scrollRef = useRef<FlatList>(null);

  const stepHeight = height - insets.top - insets.bottom - 56;

  const steps = useMemo(() => {
    if (programType === 'support') {
      return ALL_STEPS.filter((s) => !s.recoveryOnly);
    }
    return ALL_STEPS;
  }, [programType]);

  const handleComplete = useCallback(async () => {
    if (completing) return;
    setCompleting(true);
    try {
      // If support user, disable sobriety & daily_renewal modules
      if (programType === 'support') {
        const vis = await getAppVisibility();
        vis.sobriety = false;
        vis.daily_renewal = false;
        await saveAppVisibility(vis);
      }
      await setOnboardingCompleted();
      onComplete();
    } catch (err) {
      logger.error('Failed to save onboarding state:', err);
      onComplete();
    }
  }, [completing, onComplete, programType]);

  const handleNext = useCallback(() => {
    const currentStepKey = steps[currentIndex]?.key;

    // When leaving the ProgramType step, read the stored choice to
    // determine which steps to show going forward.
    if (currentStepKey === 'programType') {
      getProgramType().then((type) => {
        setProgramTypeState(type);
        // Compute next steps based on new type
        const nextSteps =
          type === 'support'
            ? ALL_STEPS.filter((s) => !s.recoveryOnly)
            : ALL_STEPS;
        const nextIndex = currentIndex + 1;
        if (nextIndex < nextSteps.length) {
          setCurrentIndex(nextIndex);
          // Need a small delay to let the FlatList re-render with new data
          setTimeout(() => {
            scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          }, 50);
        } else {
          handleComplete();
        }
      });
      return;
    }

    if (currentIndex < steps.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      handleComplete();
    }
  }, [currentIndex, handleComplete, steps]);

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
        data={steps}
        renderItem={({ item, index }) => (
          <View style={{ width, height: stepHeight }}>
            <item.Component
              onNext={handleNext}
              onSkip={handleSkip}
              isFirst={index === 0}
              isLast={index === steps.length - 1}
            />
          </View>
        )}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEnabled={!completing}
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
      />

      <ProgressDots
        total={steps.length}
        current={currentIndex}
      />
    </SafeAreaView>
  );
}
