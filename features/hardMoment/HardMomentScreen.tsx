/**
 * HardMomentScreen — emergency support screen for difficult moments.
 *
 * Design philosophy: reduce stimulation, narrow focus, offer containment.
 * This is NOT an advice screen. It's a quiet room.
 *
 * Layout:
 *   1. Grounding message (rotating, calm)
 *   2. Grounding actions (breathing, encouraging tools, writing)
 *   3. Trusted contacts (one-tap phone call)
 *
 * Accessible from anywhere in the app via a floating button in _layout.tsx.
 * No data is logged from this screen. No tracking. No friction.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { getEncouragement } from '@/lib/encouragement';
import { GroundingExercise } from './components/GroundingExercise';
import { TrustedContacts } from './components/TrustedContacts';

export function HardMomentScreen() {
  const message = getEncouragement('hardMoment');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Hard Moment" showBack />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Grounding message — the first thing the user sees */}
        <View className="items-center py-8">
          <Text className="text-foreground text-2xl font-bold text-center leading-8">
            {message}
          </Text>
        </View>

        {/* Divider */}
        <View className="h-px bg-border my-4" />

        {/* Grounding exercise (breathing, tools, writing) */}
        <GroundingExercise />

        {/* Divider */}
        <View className="h-px bg-border my-6" />

        {/* Trusted contacts for one-tap calling */}
        <TrustedContacts />
      </ScrollView>
    </SafeAreaView>
  );
}
