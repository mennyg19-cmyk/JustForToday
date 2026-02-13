/**
 * InventoryScreen — Step 10 personal inventory.
 *
 * Two sub-tabs:
 *   - Resentment (the existing Step 10 form)
 *   - Fear (coming soon)
 *
 * This file is the list-view + form-selection orchestrator.
 * Individual forms live in ./components/.
 */

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useInventory } from './hooks/useInventory';
import { ResentmentForm } from './components/ResentmentForm';
import { FearForm } from './components/FearForm';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';

type Tab = 'resentment' | 'fear';

export function InventoryScreen() {
  const backToAnalytics = useBackToAnalytics();
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const {
    step10Entries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<Tab>('resentment');

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <View className="flex-row border-b border-border px-6">
        {(['resentment', 'fear'] as const).map((tab) => (
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
              {tab === 'resentment' ? 'Resentment' : 'Fear'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="p-6 gap-4">
          {activeTab === 'resentment' && (
            <ResentmentForm
              step10Entries={step10Entries}
              addEntry={addEntry}
              updateEntry={updateEntry}
              removeEntry={removeEntry}
              scrollRef={scrollRef}
              privacyLock={privacyLock}
            />
          )}

          {activeTab === 'fear' && <FearForm />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
