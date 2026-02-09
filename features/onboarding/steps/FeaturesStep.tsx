import React from 'react';
import { View, Text } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { RotateCcw, Target, Calendar, CheckCircle, Heart, BookOpen, Footprints, Dumbbell, AlertCircle } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function FeaturesStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();

  const features = [
    { icon: RotateCcw, name: 'Daily Renewal', desc: 'Your 24-hour commitment' },
    { icon: Target, name: 'Sobriety Counters', desc: 'Track what matters to you' },
    { icon: Calendar, name: 'Step 10 Inventory', desc: 'Morning, nightly, and spot-check' },
    { icon: CheckCircle, name: 'Habits', desc: 'Build good, break bad (no limits, no paywall)' },
    { icon: Heart, name: 'Gratitude', desc: 'From an old-timer\'s wisdom' },
    { icon: BookOpen, name: 'Stoic Wisdom', desc: 'My sponsor\'s recommendation' },
    { icon: Footprints, name: 'Steps', desc: 'Self-esteem through movement' },
    { icon: Dumbbell, name: 'Workouts', desc: 'Track your fitness journey' },
    { icon: AlertCircle, name: 'Hard Moment', desc: 'When you need it most' },
  ];

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip} nextLabel="Let's Set Up">
      <View className="gap-6">
        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Your Daily Tools
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7">
          Each feature is here because it helped someone in recovery:
        </Text>

        {/* Features list */}
        <View className="gap-3 pt-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <View key={index} className="flex-row items-start gap-3 py-2">
                <View className="pt-0.5">
                  <Icon size={20} color={iconColors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {feature.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    {feature.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </OnboardingStep>
  );
}
