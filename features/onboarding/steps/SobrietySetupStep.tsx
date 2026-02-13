import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { Target, Plus, Calendar } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { createSobrietyCounter } from '@/features/sobriety/database';
import { getProgramType } from '@/lib/settings/database';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function SobrietySetupStep({ onNext, onBack, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const autoAdvanced = useRef(false);

  useEffect(() => {
    if (autoAdvanced.current) return;
    getProgramType().then((type) => {
      if (type === 'support') {
        autoAdvanced.current = true;
        onNext();
      }
    }).catch(() => {
      // Couldn't read program type — continue with sobriety setup
    });
  }, [onNext]);
  const [displayName, setDisplayName] = useState('');
  const [actualName, setActualName] = useState('');
  const [useToday, setUseToday] = useState(true);
  const [startDateText, setStartDateText] = useState('');
  const [added, setAdded] = useState(false);

  const parseDate = (text: string): Date | null => {
    // Accept MM/DD/YYYY or YYYY-MM-DD
    const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const d = new Date(+slashMatch[3], +slashMatch[1] - 1, +slashMatch[2]);
      if (!isNaN(d.getTime()) && d <= new Date()) return d;
    }
    const dashMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dashMatch) {
      const d = new Date(+dashMatch[1], +dashMatch[2] - 1, +dashMatch[3]);
      if (!isNaN(d.getTime()) && d <= new Date()) return d;
    }
    return null;
  };

  const handleAdd = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your counter.');
      return;
    }

    let startDateISO: string | undefined;
    if (!useToday && startDateText.trim()) {
      const parsed = parseDate(startDateText.trim());
      if (!parsed) {
        Alert.alert('Invalid Date', 'Please enter a valid date (MM/DD/YYYY) that is not in the future.');
        return;
      }
      startDateISO = parsed.toISOString();
    }

    try {
      await createSobrietyCounter(
        displayName.trim(),
        actualName.trim() || undefined,
        undefined,
        startDateISO
      );
      setAdded(true);
      setDisplayName('');
      setActualName('');
      setStartDateText('');
      setUseToday(true);
    } catch (_error) {
      Alert.alert('Error', 'Failed to add counter. Please try again.');
    }
  };

  return (
    <OnboardingStep onNext={onNext} onBack={onBack} onSkip={onSkip}>
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

        {/* Counter Name Input */}
        <View className="gap-2">
          <Text className="text-sm text-foreground font-medium">
            Counter Name
          </Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="e.g., Sobriety, Clean Time, Sober"
            placeholderTextColor={iconColors.muted}
            className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            autoCapitalize="sentences"
            returnKeyType="next"
          />
          <Text className="text-xs text-muted-foreground">
            How this counter appears in your app
          </Text>
        </View>

        {/* Private Name Input (Optional) */}
        <View className="gap-2">
          <Text className="text-sm text-foreground font-medium">
            What you're tracking (private, optional)
          </Text>
          <TextInput
            value={actualName}
            onChangeText={setActualName}
            placeholder="e.g., Alcohol, Gambling, Smoking"
            placeholderTextColor={iconColors.muted}
            className="bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
            autoCapitalize="sentences"
            returnKeyType="done"
          />
          <Text className="text-xs text-muted-foreground italic">
            Only you see this — stays on your device
          </Text>
        </View>

        {/* Start Date */}
        <View className="gap-2">
          <Text className="text-sm text-foreground font-medium">
            When did you start?
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setUseToday(true)}
              className={`flex-1 py-3 rounded-xl border items-center ${
                useToday ? 'bg-primary/20 border-primary/40' : 'bg-secondary border-border'
              }`}
              activeOpacity={0.7}
            >
              <Text className={useToday ? 'text-primary font-semibold' : 'text-foreground'}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUseToday(false)}
              className={`flex-1 py-3 rounded-xl border items-center ${
                !useToday ? 'bg-primary/20 border-primary/40' : 'bg-secondary border-border'
              }`}
              activeOpacity={0.7}
            >
              <Text className={!useToday ? 'text-primary font-semibold' : 'text-foreground'}>
                Earlier date
              </Text>
            </TouchableOpacity>
          </View>
          {!useToday && (
            <View className="gap-2 mt-1">
              <View className="flex-row items-center gap-3">
                <Calendar size={18} color={iconColors.primary} />
                <TextInput
                  value={startDateText}
                  onChangeText={setStartDateText}
                  placeholder="MM/DD/YYYY or YYYY-MM-DD"
                  placeholderTextColor={iconColors.muted}
                  className="flex-1 bg-input text-input-foreground text-base px-4 py-3 rounded-xl border border-border"
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  returnKeyType="done"
                />
              </View>
              <Text className="text-xs text-muted-foreground ml-7">
                Enter the date you started (must be today or earlier)
              </Text>
            </View>
          )}
        </View>

        {/* Add Button */}
        <TouchableOpacity
          onPress={handleAdd}
          className="bg-secondary rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
          activeOpacity={0.8}
        >
          <Plus size={20} color={iconColors.foreground} />
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
          Not applicable? No problem — just skip.
        </Text>
      </View>
    </OnboardingStep>
  );
}
