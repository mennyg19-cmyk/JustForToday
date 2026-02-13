/**
 * Step11Screen — Morning & Nightly inventories.
 *
 * Extracted from the combined InventoryScreen so Step 11 has its own
 * dedicated route (/step11) separate from Step 10 (/inventory).
 *
 * This file handles the tab selector, shared state, and loading/error
 * states. The actual forms live in components/MorningForm and
 * components/NightlyForm.
 */

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors, useSwitchColors } from '@/lib/iconTheme';
import { useInventory } from './hooks/useInventory';
import { MorningForm } from './components/MorningForm';
import { NightlyForm } from './components/NightlyForm';
import { useLocalSearchParams } from 'expo-router';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';

type Tab = 'morning' | 'nightly';

export function Step11Screen() {
  const backToAnalytics = useBackToAnalytics();
  const params = useLocalSearchParams<{ from?: string; tab?: string }>();
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const {
    morningEntries,
    nightlyEntries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  } = useInventory();
  const iconColors = useIconColors();
  const switchColors = useSwitchColors();

  const initialTab: Tab = params.tab === 'nightly' ? 'nightly' : 'morning';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // -- Loading / error states --

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        className="flex-1 bg-background"
      >
        <AppHeader
          title="Step 11"
          rightSlot={<ThemeToggle />}
          onBackPress={backToAnalytics}
        />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background"
    >
      <AppHeader
        title="Step 11"
        rightSlot={<ThemeToggle />}
        onBackPress={backToAnalytics}
      />

      <View className="flex-row border-b border-border px-6">
        {(['morning', 'nightly'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === tab ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab === 'morning' ? 'Morning' : 'Nightly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="p-6 gap-4">
          {activeTab === 'morning' && (
            <MorningForm
              morningEntries={morningEntries}
              switchColors={switchColors}
              iconColors={iconColors}
              privacyLock={privacyLock}
              addEntry={addEntry}
              updateEntry={updateEntry}
              removeEntry={removeEntry}
            />
          )}

          {activeTab === 'nightly' && (
            <NightlyForm
              nightlyEntries={nightlyEntries}
              switchColors={switchColors}
              iconColors={iconColors}
              privacyLock={privacyLock}
              addEntry={addEntry}
              updateEntry={updateEntry}
              removeEntry={removeEntry}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
