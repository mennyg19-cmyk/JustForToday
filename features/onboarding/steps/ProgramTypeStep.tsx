/**
 * ProgramTypeStep — Lets the user choose between "recovery" and "support"
 * (Al-Anon / CoDA / Nar-Anon) program types during onboarding.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Shield, Heart } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { setProgramType } from '@/lib/settings/database';
import type { ProgramType } from '@/lib/settings/database';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ProgramTypeStep({ onNext }: StepProps) {
  const iconColors = useIconColors();
  const [selected, setSelected] = useState<ProgramType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected || saving) return;
    setSaving(true);
    await setProgramType(selected);
    onNext();
  };

  return (
    <OnboardingStep onNext={selected ? handleContinue : undefined} showSkip={false}>
      <Text className="text-3xl font-bold text-foreground mb-2">
        How are you using this app?
      </Text>
      <Text className="text-base text-muted-foreground mb-8">
        This helps us tailor the experience for you.
      </Text>

      {/* Recovery option */}
      <TouchableOpacity
        onPress={() => setSelected('recovery')}
        activeOpacity={0.7}
        className={`rounded-2xl p-5 mb-4 border-2 ${
          selected === 'recovery'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
        }`}
      >
        <View className="flex-row items-center gap-3 mb-2">
          <Shield size={24} color={selected === 'recovery' ? iconColors.primary : iconColors.muted} />
          <Text className="text-lg font-semibold text-foreground">I'm in recovery</Text>
        </View>
        <Text className="text-sm text-muted-foreground leading-5">
          I'm working a 12-step program for my own addiction or compulsive behavior. I want to track sobriety, daily commitments, and use all recovery tools.
        </Text>
      </TouchableOpacity>

      {/* Support option */}
      <TouchableOpacity
        onPress={() => setSelected('support')}
        activeOpacity={0.7}
        className={`rounded-2xl p-5 mb-4 border-2 ${
          selected === 'support'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
        }`}
      >
        <View className="flex-row items-center gap-3 mb-2">
          <Heart size={24} color={selected === 'support' ? iconColors.primary : iconColors.muted} />
          <Text className="text-lg font-semibold text-foreground">I'm supporting someone else</Text>
        </View>
        <Text className="text-sm text-muted-foreground leading-5">
          I'm in Al-Anon, CoDA, Nar-Anon, or a similar program. I want to use the tools — habits, inventory, gratitude, and more — without tracking sobriety or daily commitments.
        </Text>
      </TouchableOpacity>

      <Text className="text-xs text-muted-foreground text-center mt-2">
        You can change this later in Settings.
      </Text>
    </OnboardingStep>
  );
}
