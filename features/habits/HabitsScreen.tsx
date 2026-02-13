import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DraggableList } from '@/components/DraggableList';
import { LoadingView, ErrorView, EmptyState } from '@/components/common';
import { useHabits } from './hooks/useHabits';
import { HabitCard } from './components/HabitCard';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitCalendar } from './components/HabitCalendar';
import type { Habit } from './types';
import { getTodayKey } from '@/utils/date';
import { useFocusEffect } from 'expo-router';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';
import { logger } from '@/lib/logger';
import { getHabitsShowMetrics, setHabitsShowMetrics } from '@/lib/settings/database';
import { useSwitchColors } from '@/lib/iconTheme';

export function HabitsScreen() {
  const backToAnalytics = useBackToAnalytics();
  const {
    habits,
    loading,
    error,
    toggleHabit,
    addHabit,
    updateHabit,
    reorderHabits,
  } = useHabits();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);

  const switchColors = useSwitchColors();

  // Re-read the setting every time the screen gains focus
  useFocusEffect(
    useCallback(() => {
      getHabitsShowMetrics().then(setShowMetrics).catch(() => {});
    }, [])
  );

  const handleToggleMetrics = useCallback(async (value: boolean) => {
    setShowMetrics(value);
    await setHabitsShowMetrics(value);
  }, []);

  const handleToggle = useCallback(
    async (id: string) => {
      try {
        await toggleHabit(id);
      } catch (err) {
        logger.error('Failed to toggle habit:', err);
      }
    },
    [toggleHabit]
  );

  const handleAddHabit = useCallback(
    async (name: string, frequency: 'daily' | 'weekly', type: 'build' | 'break') => {
      await addHabit(name, frequency, type);
    },
    [addHabit]
  );

  const handleReorder = useCallback(
    async (newOrder: string[]) => {
      try {
        await reorderHabits(newOrder);
      } catch (err) {
        logger.error('Failed to reorder:', err);
      }
    },
    [reorderHabits]
  );

  const handleToggleCalendarDate = useCallback(
    async (habitId: string, date: string) => {
      try {
        await toggleHabit(habitId, date);
        // Optimistically update the selected habit's calendar view
        setSelectedHabit((prev) => {
          if (!prev || prev.id !== habitId) return prev;
          const newHistory = { ...prev.history };
          newHistory[date] = !newHistory[date];
          const todayKey = getTodayKey();
          return { ...prev, history: newHistory, completedToday: date === todayKey ? !prev.completedToday : prev.completedToday };
        });
      } catch (err) {
        logger.error('Failed to toggle date:', err);
      }
    },
    [toggleHabit]
  );

  const handleSaveHabitEdit = useCallback(
    async (habitId: string, updates: { name?: string; trackingStartDate?: string }) => {
      try {
        const updated = await updateHabit(habitId, updates);
        setSelectedHabit(updated);
      } catch (err) {
        logger.error('Failed to save habit edit:', err);
      }
    },
    [updateHabit]
  );

  if (loading) {
    return <LoadingView message="Loading habits..." />;
  }

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Habits" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Habits" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        <View className="p-6 gap-3">
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary rounded-2xl p-4 flex-row items-center justify-center gap-2"
          >
            <Plus className="text-primary-foreground" size={24} />
            <Text className="text-primary-foreground font-bold text-lg">Add Habit</Text>
          </TouchableOpacity>

          <View className="flex-row items-center gap-3 bg-card rounded-xl p-3 border border-border">
            <Text className="text-sm text-muted-foreground flex-1">
              Tracking helps us build and break habits. You can turn it off if you don't want to see it.
            </Text>
            <Switch
              value={showMetrics}
              onValueChange={handleToggleMetrics}
              {...switchColors}
            />
          </View>

          {habits.length > 1 && (
            <TouchableOpacity
              onPress={() => setEditMode(!editMode)}
              className={`rounded-2xl p-4 flex-row items-center justify-center gap-2 ${
                editMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Edit2 className={editMode ? 'text-primary-foreground' : 'text-foreground'} size={20} />
              <Text
                className={`font-bold ${editMode ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {editMode ? 'Done Ordering' : 'Edit Order'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {habits.length === 0 ? (
          <EmptyState
            message="No habits yet. Tap 'Add Habit' to start tracking your journey."
            icon={<Text className="text-5xl mb-4">🎯</Text>}
          />
        ) : editMode ? (
          <View className="px-6">
            <DraggableList
              items={habits.map((h) => ({ id: h.id, label: h.name, data: h }))}
              editMode={true}
              onReorder={handleReorder}
              renderItem={(item) => {
                const habit = item.data as Habit;
                return (
                  <HabitCard
                    habit={habit}
                    onToggle={handleToggle}
                    onPress={setSelectedHabit}
                    compact={false}
                    showMetrics={showMetrics}
                  />
                );
              }}
            />
          </View>
        ) : (
          <View className="px-6">
            <View className="flex-row flex-wrap justify-between">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggle}
                  onPress={setSelectedHabit}
                  compact={true}
                  showMetrics={showMetrics}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <HabitFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddHabit}
      />

      <HabitCalendar
        habit={selectedHabit}
        visible={selectedHabit !== null}
        onClose={() => setSelectedHabit(null)}
        onToggleDate={handleToggleCalendarDate}
        onSaveEdit={handleSaveHabitEdit}
      />
    </SafeAreaView>
  );
}
