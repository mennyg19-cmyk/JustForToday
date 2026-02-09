import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Target } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getGoals, saveGoals } from '@/lib/settings/database';
import type { AppGoals } from '@/lib/database/schema';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function GoalsStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [goals, setGoals] = useState<AppGoals>({
    habitsGoal: 0,
    stepsGoal: 10000,
    workoutsGoal: 1,
    fastingHoursGoal: 16,
    inventoriesPerDayGoal: 2,
    gratitudesPerDayGoal: 1,
  });

  useEffect(() => {
    getGoals().then(setGoals);
  }, []);

  const handleNext = async () => {
    await saveGoals(goals);
    onNext();
  };

  const updateGoal = (key: keyof AppGoals, value: string) => {
    const numValue = parseInt(value) || 0;
    setGoals({ ...goals, [key]: numValue });
  };

  return (
    <OnboardingStep onNext={handleNext} onSkip={onSkip}>
      <View className="gap-6">
        {/* Icon */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Target size={40} color={iconColors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Daily Goals
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7">
          Set targets for what feels right. You can change these anytime.
        </Text>

        {/* Goals Inputs */}
        <View className="gap-4 pt-2">
          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Habits (0 = all habits count)
            </Text>
            <TextInput
              value={goals.habitsGoal.toString()}
              onChangeText={(val) => updateGoal('habitsGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Daily Steps
            </Text>
            <TextInput
              value={goals.stepsGoal.toString()}
              onChangeText={(val) => updateGoal('stepsGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Workouts per Day
            </Text>
            <TextInput
              value={goals.workoutsGoal.toString()}
              onChangeText={(val) => updateGoal('workoutsGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Fasting Hours per Day
            </Text>
            <TextInput
              value={goals.fastingHoursGoal.toString()}
              onChangeText={(val) => updateGoal('fastingHoursGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Inventories per Day
            </Text>
            <TextInput
              value={goals.inventoriesPerDayGoal.toString()}
              onChangeText={(val) => updateGoal('inventoriesPerDayGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm text-foreground font-medium">
              Gratitude Entries per Day
            </Text>
            <TextInput
              value={goals.gratitudesPerDayGoal.toString()}
              onChangeText={(val) => updateGoal('gratitudesPerDayGoal', val)}
              keyboardType="number-pad"
              className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            />
          </View>
        </View>

        <Text className="text-sm text-muted-foreground text-center italic leading-6 pt-2">
          These are targets, not requirements. Be gentle with yourself.
        </Text>
      </View>
    </OnboardingStep>
  );
}
