import React from 'react';
import { View, Text, Image } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Lock } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function WelcomeStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip} nextLabel="Let's Begin" showSkip={false}>
      <View className="items-center gap-8 pt-12">
        {/* App Icon/Logo */}
        <Image
          source={require('@/assets/images/icon.png')}
          className="w-24 h-24 rounded-3xl"
          style={{ width: 96, height: 96 }}
          resizeMode="cover"
        />

        {/* Welcome Message */}
        <View className="gap-4">
          <Text className="text-4xl font-bold text-foreground text-center">
            Welcome to{'\n'}Just For Today
          </Text>
          <Text className="text-lg text-primary font-semibold text-center tracking-widest">
            LIFE TRACKER
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

        {/* Privacy Promise */}
        <View className="bg-muted/50 rounded-2xl p-5 mx-2 gap-3">
          <View className="flex-row items-center justify-center gap-2">
            <Lock size={16} color={iconColors.primary} />
            <Text className="text-sm font-semibold text-foreground">
              Your data is yours alone
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground text-center leading-6">
            Everything stays on your device. No accounts, no servers, no tracking. The only cloud this app touches is your personal iCloud — and only if you choose to enable it.
          </Text>
        </View>

        {/* Attribution */}
        <View className="pt-4">
          <Text className="text-sm text-muted-foreground text-center italic">
            Built by Menny,{'\n'}baked by Daniel
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
