import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Check } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function PhilosophyStep({ onNext, onBack, onSkip }: StepProps) {
  const iconColors = useIconColors();

  const principles = [
    'No notifications nagging you',
    'No guilt-inducing streaks',
    'No judgment when you skip a day',
    'Analytics exist, but they\'re hidden (One day at a time, remember?)',
  ];

  return (
    <OnboardingStep onNext={onNext} onBack={onBack} onSkip={onSkip} showSkip={false}>
      <View className="gap-6">
        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Just For Today
        </Text>

        <Text className="text-lg text-muted-foreground text-center leading-7">
          You'll notice this app is different.
        </Text>

        {/* Principles */}
        <View className="gap-4 pt-4">
          {principles.map((principle, index) => (
            <View key={index} className="flex-row gap-3">
              <View className="pt-1">
                <Check size={24} color={iconColors.primary} strokeWidth={3} />
              </View>
              <Text className="text-base text-foreground leading-7 flex-1">
                {principle}
              </Text>
            </View>
          ))}
        </View>

        {/* Core message */}
        <View className="pt-8 gap-4">
          <Text className="text-xl text-foreground font-semibold text-center leading-8">
            This is about presence,{'\n'}not performance.
          </Text>

          <Text className="text-lg text-muted-foreground text-center leading-7 pt-2">
            Show up when you can. That's enough.
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
