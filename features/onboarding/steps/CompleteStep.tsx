import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { CheckCircle } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function CompleteStep({ onNext }: StepProps) {
  const iconColors = useIconColors();

  return (
    <OnboardingStep onNext={onNext} nextLabel="Let's Begin" showSkip={false}>
      <View className="gap-8 pt-20 items-center">
        {/* Success Icon */}
        <View className="w-28 h-28 rounded-full bg-primary/20 items-center justify-center">
          <CheckCircle size={64} color={iconColors.primary} strokeWidth={2.5} />
        </View>

        {/* Title */}
        <Text className="text-4xl font-bold text-foreground text-center">
          You're All Set
        </Text>

        {/* Core Message */}
        <View className="gap-6 pt-4">
          <Text className="text-2xl text-primary font-semibold text-center leading-9">
            Remember:{'\n'}Just for today.
          </Text>

          <Text className="text-lg text-muted-foreground text-center leading-8">
            Not yesterday.{'\n'}Not tomorrow.{'\n'}Just today.
          </Text>

          <Text className="text-xl text-foreground font-medium text-center leading-8 px-4 pt-4">
            Show up when you can.{'{\\n}'}That's enough.
          </Text>
        </View>

        {/* Attribution */}
        <View className="pt-12">
          <Text className="text-sm text-muted-foreground text-center italic">
            Built with care by Dan
          </Text>
          <Text className="text-xs text-muted-foreground text-center italic pt-1">
            In and out of recovery since 2014
          </Text>
        </View>

        {/* Final Encouragement */}
        <View className="bg-primary/10 rounded-2xl p-6 mx-4 border border-primary/20 mt-4">
          <Text className="text-base text-foreground text-center leading-7">
            Your progress starts now.{'\n'}Welcome to the journey.
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
