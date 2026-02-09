import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Edit2, AlertCircle } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DraggableList } from '@/components/DraggableList';
import { LoadingView, ErrorView, EmptyState } from '@/components/common';
import { useHabits } from './hooks/useHabits';
import { HabitCard } from './components/HabitCard';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitCalendar } from './components/HabitCalendar';
import type { Habit } from './types';
import { useRouter, useLocalSearchParams } from 'expo-router';

export function HabitsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const {
    habits,
    loading,
    error,
    toggleHabit,
    addHabit,
    deleteHabit,
    updateHabit,
    reorderHabits,
    completedCount,
    totalCount,
    allCompleted,
  } = useHabits();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleToggle = useCallback(
    async (id: string) => {
      try {
        await toggleHabit(id);
      } catch (err) {
        console.error('Failed to toggle habit:', err);
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
        console.error('Failed to reorder:', err);
      }
    },
    [reorderHabits]
  );

  const handleToggleCalendarDate = useCallback(
    async (habitId: string, date: string) => {
      try {
        await toggleHabit(habitId, date);
        const updated = habits.find((h) => h.id === habitId);
        if (updated) setSelectedHabit(updated);
      } catch (err) {
        console.error('Failed to toggle date:', err);
      }
    },
    [habits, toggleHabit]
  );

  const handleSaveHabitEdit = useCallback(
    async (habitId: string, updates: { name?: string; trackingStartDate?: string }) => {
      try {
        const updated = await updateHabit(habitId, updates);
        setSelectedHabit(updated);
      } catch (err) {
        console.error('Failed to save habit edit:', err);
      }
    },
    [updateHabit]
  );

  if (loading) {
    return <LoadingView message="Loading habits..." />;
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Habits" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
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
