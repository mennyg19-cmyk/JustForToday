import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { CheckCircle, Plus } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { createHabit } from '@/features/habits/database';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SUGGESTED_HABITS = [
  'Morning prayer',
  'Meditation',
  'Call sponsor',
  'Read recovery literature',
  'Attend meeting',
  'Journal',
];

export function HabitsSetupStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [habitName, setHabitName] = useState('');
  const [addedHabits, setAddedHabits] = useState<string[]>([]);

  const handleAdd = async (name: string) => {
    if (!name.trim()) return;

    try {
      await createHabit(name.trim(), 'daily', 'build');
      setAddedHabits([...addedHabits, name.trim()]);
      setHabitName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add habit. Please try again.');
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    if (!addedHabits.includes(suggestion)) {
      handleAdd(suggestion);
    }
  };

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip}>
        <View className="gap-6">
          {/* Icon */}
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
              <CheckCircle size={40} color={iconColors.primary} />
            </View>
          </View>

          {/* Title */}
          <Text className="text-3xl font-bold text-foreground text-center">
            Daily Habits
          </Text>

          <Text className="text-base text-muted-foreground text-center leading-7">
            Add 2-3 daily habits to track. No limits, no paywalls.
          </Text>

          {/* Custom Input */}
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground font-medium">
              Add your own
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                value={habitName}
                onChangeText={setHabitName}
                placeholder="e.g., Exercise, Make bed"
                placeholderTextColor={iconColors.muted}
                className="flex-1 bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={() => handleAdd(habitName)}
              />
              <TouchableOpacity
                onPress={() => handleAdd(habitName)}
                className="bg-primary rounded-xl px-4 items-center justify-center"
                activeOpacity={0.8}
              >
                <Plus size={24} color={iconColors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Suggested Habits */}
          <View className="gap-2">
            <Text className="text-sm text-muted-foreground font-medium">
              Or choose from common ones
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTED_HABITS.map((suggestion) => {
                const isAdded = addedHabits.includes(suggestion);
                return (
                  <TouchableOpacity
                    key={suggestion}
                    onPress={() => handleSuggestionPress(suggestion)}
                    disabled={isAdded}
                    className={`px-4 py-2 rounded-full border ${
                      isAdded
                        ? 'bg-primary/20 border-primary/40'
                        : 'bg-secondary border-border'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={isAdded ? 'text-primary font-medium' : 'text-secondary-foreground'}
                    >
                      {isAdded ? ' ' : ''}{suggestion}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Added Habits */}
          {addedHabits.length > 0 && (
            <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
              <Text className="text-primary font-medium mb-2">
                Added {addedHabits.length} habit{addedHabits.length !== 1 ? 's' : ''}:
              </Text>
              <Text className="text-foreground">
                {addedHabits.join(', ')}
              </Text>
            </View>
          )}

          <Text className="text-sm text-muted-foreground text-center leading-6">
            You can add, edit, or reorder habits anytime.
          </Text>
        </View>
    </OnboardingStep>
  );
}
