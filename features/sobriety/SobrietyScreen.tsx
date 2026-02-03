import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit2, AlertCircle } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DraggableList, type DraggableItem } from '@/components/DraggableList';
import { useSobriety } from './hooks/useSobriety';
import { AddCounterModal } from './components/AddCounterModal';
import { CounterDetailModal } from './components/CounterDetailModal';
import { SobrietyCard } from './components/SobrietyCard';

export function SobrietyScreen() {
  const {
    counters,
    loading,
    error,
    refresh,
    addCounter,
    toggleDay,
    updateCounter,
    resetToNow,
    reorder,
    calculateTimeSince,
  } = useSobriety();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState<typeof counters[0] | null>(null);
  const [orderEditMode, setOrderEditMode] = useState(false);

  const handleReorder = useCallback(
    async (newOrder: string[]) => {
      await reorder(newOrder);
    },
    [reorder]
  );

  const handleSaveEdit = useCallback(
    async (
      counterId: string,
      updates: Partial<{
        displayName: string;
        actualName: string;
        currentStreakStart: string;
        notes: string;
      }>
    ) => {
      const updated = await updateCounter(counterId, updates);
      setSelectedCounter(updated);
    },
    [updateCounter]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Sobriety" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle className="text-destructive mb-4" size={48} />
          <Text className="text-lg font-bold text-foreground mb-2">
            Failed to Load Counters
          </Text>
          <Text className="text-muted-foreground text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Sobriety" rightSlot={<ThemeToggle />} />

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        <View className="p-6 gap-3">
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-2xl p-4 flex-row items-center justify-center gap-2"
          >
            <Plus className="text-primary-foreground" size={24} />
            <Text className="text-primary-foreground font-bold text-lg">
              Add Sobriety Counter
            </Text>
          </TouchableOpacity>

          {counters.length > 1 ? (
            <TouchableOpacity
              onPress={() => setOrderEditMode((e) => !e)}
              className={`rounded-2xl p-4 flex-row items-center justify-center gap-2 ${
                orderEditMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Edit2
                className={orderEditMode ? 'text-primary-foreground' : 'text-foreground'}
                size={20}
              />
              <Text
                className={`font-bold ${
                  orderEditMode ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {orderEditMode ? 'Done Ordering' : 'Edit Order'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {orderEditMode ? (
          <View className="px-6">
            <DraggableList
              items={counters.map((c) => ({
                id: c.id,
                label: c.displayName,
                data: c,
              }))}
              editMode
              onReorder={handleReorder}
              renderItem={(item) => {
                const counter = item.data;
                const timeSince = calculateTimeSince(counter.currentStreakStart);
                const isLongest =
                  timeSince.days >= counter.longestStreak && timeSince.days > 0;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCounter(counter);
                    }}
                    className="bg-card rounded-2xl p-3 border border-border mb-4 shadow-card"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 pr-1">
                        <Text
                          className="text-sm font-bold text-foreground"
                          numberOfLines={2}
                        >
                          {counter.displayName}
                        </Text>
                        {counter.notes ? (
                          <Text
                            className="text-[11px] text-muted-foreground mt-1"
                            numberOfLines={1}
                          >
                            {counter.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between bg-muted rounded-lg px-2 py-1.5">
                      <Text className="text-lg font-bold text-foreground">
                        {timeSince.days} days
                      </Text>
                      {isLongest ? (
                        <Text className="text-xs text-primary font-semibold">
                          Longest
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        ) : (
          <View className="px-6 flex-row flex-wrap justify-between">
            {counters.map((counter) => (
              <SobrietyCard
                key={counter.id}
                counter={counter}
                timeSince={calculateTimeSince(counter.currentStreakStart)}
                onPress={() => setSelectedCounter(counter)}
              />
            ))}
          </View>
        )}

        {counters.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-5xl mb-4">🌟</Text>
            <Text className="text-xl font-bold text-foreground text-center mb-2">
              Start Your Journey
            </Text>
            <Text className="text-muted-foreground text-center">
              Add your first sobriety counter to begin tracking your progress
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <AddCounterModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addCounter}
      />

      <CounterDetailModal
        counter={selectedCounter}
        visible={selectedCounter !== null}
        onClose={() => setSelectedCounter(null)}
        onToggleDay={toggleDay}
        onResetToNow={resetToNow}
        onSaveEdit={handleSaveEdit}
      />
    </SafeAreaView>
  );
}
