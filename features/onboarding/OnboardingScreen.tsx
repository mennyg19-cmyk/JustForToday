/**
 * OnboardingScreen - First-time user experience
 * 
 * Walks users through the app philosophy and initial setup.
 * Shows once, then accessible via Settings > About.
 */

import React, { useState, useRef } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WelcomeStep } from './steps/WelcomeStep';
import { StoryStep } from './steps/StoryStep';
import { PhilosophyStep } from './steps/PhilosophyStep';
import { FeaturesStep } from './steps/FeaturesStep';
import { ProfileStep } from './steps/ProfileStep';
import { SobrietySetupStep } from './steps/SobrietySetupStep';
import { HabitsSetupStep } from './steps/HabitsSetupStep';
import { GoalsStep } from './steps/GoalsStep';
import { PermissionsStep } from './steps/PermissionsStep';
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
  /** If true, user can skip entire onboarding (e.g., returning from Settings) */
  allowSkip?: boolean;
}

export function OnboardingScreen({ onComplete, allowSkip = true }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);

  const handleComplete = async () => {
    await setOnboardingCompleted();
    onComplete();
  };

  const handleNext = () => {
    if (currentIndex < STEPS.length - 1) {
      scrollRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    setCurrentIndex(newIndex);
  };

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        ref={scrollRef}
        data={STEPS}
        renderItem={({ item: StepComponent, index }) => (
          <View style={{ width }}>
            <StepComponent
              onNext={handleNext}
              onSkip={allowSkip ? handleSkip : undefined}
              isFirst={index === 0}
              isLast={index === STEPS.length - 1}
            />
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={true}
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
