import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Target, Plus } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { createSobrietyCounter } from '@/features/sobriety/database';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SobrietySetupStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [displayName, setDisplayName] = useState('');
  const [actualName, setActualName] = useState('');
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter what you\'re tracking.');
      return;
    }

    try {
      await createSobrietyCounter(
        displayName.trim(),
        actualName.trim() || undefined
      );
      setAdded(true);
      setDisplayName('');
      setActualName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add counter. Please try again.');
    }
  };

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip}>
      <View className="gap-6">
        {/* Icon */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Target size={40} color={iconColors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Sobriety Tracking
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7 px-2">
          What are you working on? Add your first counter. You can add more anytime.
        </Text>

        {/* Display Name Input */}
        <View className="gap-2">
          <Text className="text-sm text-muted-foreground font-medium">
            Display Name (what others might see)
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g., Sobriety, Clean, Sober"
            placeholderTextColor={iconColors.muted}
            className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        {/* Actual Name Input (Optional) */}
        <View className="gap-2">
          <Text className="text-sm text-muted-foreground font-medium">
            Actual Name (private, optional)
          </Text>
          <TextInput
            value={actualName}
            onChangeText={setActualName}
            placeholder="e.g., Alcohol, Cocaine, Gambling"
            placeholderTextColor={iconColors.muted}
            className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Text className="text-xs text-muted-foreground italic">
            Kept private on your device
          </Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAdd}
          className="bg-secondary rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <Plus size={20} color={iconColors.secondaryForeground} />
          <Text className="text-secondary-foreground text-base font-semibold">
            Add Counter
          </Text>
        </TouchableOpacity>

        {added && (
          <View className="bg-primary/10 rounded-xl p-4 border border-primary/20">
            <Text className="text-primary text-center font-medium">
               Counter added! You can add more later.
            </Text>
          </View>
        )}

        <Text className="text-sm text-muted-foreground text-center leading-6 pt-2">
          Not applicable? No problemjust skip.
        </Text>
      </View>
    </OnboardingStep>
  );
}
