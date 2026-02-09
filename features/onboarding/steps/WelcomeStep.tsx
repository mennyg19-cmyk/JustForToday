import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function WelcomeStep({ onNext, onSkip }: StepProps) {
  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip} nextLabel="Let's Begin" showSkip={false}>
      <View className="items-center gap-8 pt-12">
        {/* App Icon/Logo */}
        <View className="w-24 h-24 rounded-3xl bg-primary/10 items-center justify-center">
          <Text className="text-6xl"></Text>
        </View>

        {/* Welcome Message */}
        <View className="gap-4">
          <Text className="text-4xl font-bold text-foreground text-center">
            Welcome to{'\n'}Just For Today
          </Text>

          <Text className="text-lg text-muted-foreground text-center leading-7 px-4">
            I built this app because I was tired of recovery tools with paywalls and limitations.
          </Text>

          <Text className="text-lg text-muted-foreground text-center leading-7 px-4">
            I needed something honest. Something that would grow with me, not track me.
          </Text>

          <Text className="text-lg text-foreground text-center leading-7 px-4 pt-4">
            Let me show you what we've built together.
          </Text>
        </View>

        {/* Attribution */}
        <View className="pt-8">
          <Text className="text-sm text-muted-foreground text-center italic">
            Built by Dan,{'\n'}in and out of recovery since 2014
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
