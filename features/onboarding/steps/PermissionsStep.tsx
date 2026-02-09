import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Shield, Activity, Users } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { requestFitnessPermissions } from '@/lib/healthKit';
import * as Contacts from 'expo-contacts';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function PermissionsStep({ onNext, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [healthKitGranted, setHealthKitGranted] = useState(false);
  const [contactsGranted, setContactsGranted] = useState(false);

  const handleHealthKitRequest = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'HealthKit is only available on iOS devices.');
      return;
    }

    try {
      const granted = await requestFitnessPermissions();
      setHealthKitGranted(granted);
      if (granted) {
        Alert.alert('Success', 'HealthKit access granted!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request HealthKit permissions.');
    }
  };

  const handleContactsRequest = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      const granted = status === 'granted';
      setContactsGranted(granted);
      if (granted) {
        Alert.alert('Success', 'Contacts access granted!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request contacts permissions.');
    }
  };

  return (
    <OnboardingStep onNext={onNext} onSkip={onSkip}>
      <View className="gap-6">
        {/* Icon */}
        <View className="items-center">
          <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
            <Shield size={40} color={iconColors.primary} />
          </View>
        </View>

        {/* Title */}
        <Text className="text-3xl font-bold text-foreground text-center">
          Optional Permissions
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7">
          These enhance your experience but are completely optional.
        </Text>

        {/* HealthKit */}
        {Platform.OS === 'ios' && (
          <View className="gap-3 pt-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Activity size={24} color={iconColors.primary} />
              <Text className="text-lg font-semibold text-foreground">
                HealthKit (iOS only)
              </Text>
            </View>
            <Text className="text-sm text-muted-foreground leading-6 mb-3">
              Automatically track your daily steps and workouts from the Health app.
            </Text>
            <TouchableOpacity
              onPress={handleHealthKitRequest}
              disabled={healthKitGranted}
              className={`py-3 px-4 rounded-xl border ${
                healthKitGranted
                  ? 'bg-primary/20 border-primary/40'
                  : 'bg-secondary border-border'
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-center font-medium ${
                  healthKitGranted ? 'text-primary' : 'text-secondary-foreground'
                }`}
              >
                {healthKitGranted ? ' Granted' : 'Enable HealthKit'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contacts */}
        <View className="gap-3 pt-4">
          <View className="flex-row items-center gap-3 mb-2">
            <Users size={24} color={iconColors.primary} />
            <Text className="text-lg font-semibold text-foreground">
              Contacts
            </Text>
          </View>
          <Text className="text-sm text-muted-foreground leading-6 mb-3">
            Add trusted people (sponsor, support contacts) from your contacts for the Hard Moment screen.
          </Text>
          <TouchableOpacity
            onPress={handleContactsRequest}
            disabled={contactsGranted}
            className={`py-3 px-4 rounded-xl border ${
              contactsGranted
                ? 'bg-primary/20 border-primary/40'
                : 'bg-secondary border-border'
            }`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center font-medium ${
                contactsGranted ? 'text-primary' : 'text-secondary-foreground'
              }`}
            >
              {contactsGranted ? ' Granted' : 'Enable Contacts'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View className="bg-muted/50 rounded-xl p-4 mt-4">
          <Text className="text-sm text-muted-foreground text-center leading-6">
            All data stays on your device. We never see your health data or contacts.
          </Text>
        </View>

        <Text className="text-sm text-muted-foreground text-center italic leading-6 pt-2">
          You can grant these later in your device Settings.
        </Text>
      </View>
    </OnboardingStep>
  );
}
