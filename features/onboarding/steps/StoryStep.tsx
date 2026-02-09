import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Heart } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function StoryStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip} showSkip={false}>
      <View className="gap-6">
        {/* Icon */}
        <View className="items-center pb-4">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Heart size={40} color={iconColors.primary} fill={iconColors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Why This Exists
        </Text>

        {/* Story */}
        <View className="gap-5 pt-2">
          <Text className="text-base text-foreground leading-7">
            When I started my recovery, I tried every habit tracker and sobriety app I could find. They all wanted $10/month to track more than 3 things.
          </Text>

          <Text className="text-base text-foreground leading-7">
            So I built my own. Just for me at first.
          </Text>

          <Text className="text-base text-foreground leading-7">
            Then my sponsor suggested stoicism. My therapist reminded me: one day at a time. An old-timer taught me about gratitude journals.
          </Text>

          <Text className="text-base text-foreground leading-7">
            As I worked out to boost my self-esteem, I added step tracking and workout logging.
          </Text>

          <Text className="text-base text-foreground leading-7 font-semibold">
            Each feature here comes from someone's real advice on my real journey.
          </Text>

          <Text className="text-base text-foreground leading-7 pt-4">
            This isn't a product. It's a tool I use every day.
          </Text>

          <Text className="text-lg text-primary font-semibold text-center pt-2">
            And now it's yours too.
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
