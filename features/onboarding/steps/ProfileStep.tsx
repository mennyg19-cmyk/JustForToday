import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { User } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getUserProfile, saveUserProfile } from '@/lib/settings/database';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ProfileStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [name, setName] = useState('');

  const handleNext = async () => {
    if (name.trim()) {
      const profile = await getUserProfile();
      await saveUserProfile({ ...profile, name: name.trim() });
    }
    onNext();
  };

  return (
    <OnboardingStep onNext={handleNext} onSkip={onSkip}>
      <View className="gap-6 pt-8">
        {/* Icon */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <User size={40} color={iconColors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          What's your name?
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7 px-4">
          Used for personalized greetings like "Good morning, {name || 'friend'}".
        </Text>

        <Text className="text-sm text-muted-foreground text-center italic">
          This stays private on your device.
        </Text>

        {/* Input */}
        <View className="pt-4">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your first name (optional)"
            placeholderTextColor={iconColors.muted}
            className="bg-input text-input-foreground text-lg px-6 py-4 rounded-xl border border-border"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={handleNext}
          />
        </View>

        <Text className="text-sm text-muted-foreground text-center leading-6 pt-2">
          You can change this anytime in Settings.
        </Text>
      </View>
    </OnboardingStep>
  );
}
