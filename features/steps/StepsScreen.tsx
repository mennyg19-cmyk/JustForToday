import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footprints, Pencil, CheckCircle, Flame, Dumbbell, Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateShort } from '@/utils/date';
import { useSteps, type RecentStepsDay } from './hooks/useSteps';
import { EditStepsModal } from './components/EditStepsModal';
import { AddWorkoutModal } from './components/AddWorkoutModal';
import type { Workout } from '@/lib/database/schema';

const cardClass = 'rounded-2xl p-4 bg-card border border-border';

export function StepsScreen() {
  const iconColors = useIconColors();
  const {
    stepsToday,
    stepsGoal,
    recentDays,
    workoutsToday,
    activeCaloriesToday,
    activeCaloriesSource,
    loading,
    error,
    syncing,
    refresh,
    setManualSteps,
    addManualWorkout,
    removeWorkout,
    syncFromHealthKit,
  } = useSteps();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDay, setEditDay] = useState<RecentStepsDay | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showNotAvailable, setShowNotAvailable] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  const handleSaveSteps = useCallback(
    async (steps: number, dateKey?: string) => {
      await setManualSteps(steps, dateKey);
      setShowEditModal(false);
      setEditDay(null);
    },
    [setManualSteps]
  );

  const openEditToday = useCallback(() => {
    setEditDay(null);
    setShowEditModal(true);
  }, []);

  const openEditDay = useCallback((day: RecentStepsDay) => {
    setEditDay(day);
    setShowEditModal(true);
  }, []);

  const handleSyncHealthKit = useCallback(() => {
    if (Platform.OS !== 'ios') {
      setShowNotAvailable(true);
      return;
    }
    setSyncError(null);
    syncFromHealthKit(
      (msg) => setSyncError(msg),
      (msg) => setSyncError(msg)
    );
  }, [syncFromHealthKit]);

  const handleAddWorkout = useCallback(
    async (activityName: string, durationMinutes: number, caloriesBurned: number) => {
      await addManualWorkout(activityName, durationMinutes, caloriesBurned);
      setShowAddWorkout(false);
    },
    [addManualWorkout]
  );

  const handleDeleteWorkout = useCallback(
    async (w: Workout) => {
      await removeWorkout(w.id);
      setWorkoutToDelete(null);
    },
    [removeWorkout]
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={iconColors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Steps" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground font-semibold mb-2">Failed to load</Text>
          <Text className="text-muted-foreground text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPct = stepsGoal > 0 ? Math.min(100, (stepsToday / stepsGoal) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Steps" rightSlot={<ThemeToggle />} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={iconColors.primary}
          />
        }
      >
        {/* Today's steps – hero */}
        <View className={`${cardClass} mb-4`}>
          <View className="flex-row items-center gap-2 mb-2">
            <Footprints size={20} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">Today</Text>
          </View>
          <Text className="text-4xl font-bold text-foreground">
            {stepsToday.toLocaleString()}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">steps</Text>
          {stepsGoal > 0 && (
            <View className="mt-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-muted-foreground">
                  Goal: {stepsGoal.toLocaleString()}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {Math.round(progressPct)}%
                </Text>
              </View>
              <View className="h-2 rounded-full bg-muted overflow-hidden">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Active calories */}
        <View className={`${cardClass} mb-4`}>
          <View className="flex-row items-center gap-2 mb-2">
            <Flame size={20} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">Active calories</Text>
          </View>
          <Text className="text-3xl font-bold text-foreground">
            {activeCaloriesToday.toLocaleString()}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {activeCaloriesSource === 'healthkit'
              ? 'From Health app'
              : activeCaloriesSource === 'estimated'
                ? 'Estimated from steps (~0.04 kcal/step)'
                : 'Log steps or sync from Health'}
          </Text>
        </View>

        {/* Actions */}
        <View className={`${cardClass} mb-4`}>
          <Text className="text-base font-semibold text-foreground mb-3">
            Update steps
          </Text>
          <View className="gap-3">
            <ModalButton variant="primary" onPress={openEditToday}>
              Enter manually
            </ModalButton>
            {Platform.OS === 'ios' ? (
              <ModalButton
                variant="secondary"
                onPress={handleSyncHealthKit}
                disabled={syncing}
                loading={syncing}
              >
                Sync from Health
              </ModalButton>
            ) : (
              <ModalButton variant="secondary" onPress={handleSyncHealthKit}>
                Sync from Health
              </ModalButton>
            )}
          </View>
        </View>

        {/* Workouts today */}
        <View className={`${cardClass} mb-4`}>
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <Dumbbell size={20} color={iconColors.primary} />
              <Text className="text-base font-semibold text-foreground">Workouts today</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddWorkout(true)}
              className="px-3 py-2 rounded-lg bg-primary"
            >
              <Text className="text-sm font-semibold text-primary-foreground">Add</Text>
            </TouchableOpacity>
          </View>
          {workoutsToday.length === 0 ? (
            <Text className="text-sm text-muted-foreground py-2">
              No workouts yet. Add one or sync from Health (iOS).
            </Text>
          ) : (
            <View className="gap-2">
              {workoutsToday.map((w) => (
                <View
                  key={w.id}
                  className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">{w.activityName}</Text>
                    <Text className="text-sm text-muted-foreground">
                      {w.durationMinutes} min · {w.caloriesBurned} kcal
                      {w.source === 'healthkit' ? ' (Health)' : ''}
                    </Text>
                  </View>
                  {w.source === 'manual' && (
                    <TouchableOpacity
                      onPress={() => setWorkoutToDelete(w)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      className="p-2"
                    >
                      <Trash2 size={18} color={iconColors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent days */}
        <View className={`${cardClass} mb-4`}>
          <Text className="text-base font-semibold text-foreground mb-3">
            Last 7 days
          </Text>
          <View className="gap-2">
            {recentDays.map((day) => (
              <View
                key={day.date}
                className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <Text
                    className="text-foreground font-medium min-w-[72px]"
                    numberOfLines={1}
                  >
                    {day.isToday ? 'Today' : formatDateShort(day.date)}
                  </Text>
                  <Text className="text-muted-foreground">
                    {day.steps_count.toLocaleString()} steps
                  </Text>
                  {stepsGoal > 0 && day.steps_count >= stepsGoal && (
                    <CheckCircle size={16} color={iconColors.primary} />
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => openEditDay(day)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="p-2"
                >
                  <Pencil size={18} color={iconColors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-sm text-muted-foreground px-1">
          Your daily steps goal is set in Settings → Goals.
        </Text>
      </ScrollView>

      <EditStepsModal
        visible={showEditModal}
        currentSteps={editDay?.steps_count ?? stepsToday}
        dateKey={editDay?.date}
        dateLabel={editDay ? (editDay.isToday ? undefined : formatDateShort(editDay.date)) : undefined}
        onClose={() => {
          setShowEditModal(false);
          setEditDay(null);
        }}
        onSave={handleSaveSteps}
      />

      {/* In-app: Sync not available (e.g. Android) */}
      <ModalSurface visible={showNotAvailable} onRequestClose={() => setShowNotAvailable(false)} contentClassName="p-6">
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Not available
        </Text>
        <Text className="text-modal-content-foreground mb-4">
          Step sync from Health is only available on iOS. You can enter steps manually.
        </Text>
        <ModalButton variant="primary" onPress={() => setShowNotAvailable(false)}>
          OK
        </ModalButton>
      </ModalSurface>

      {/* In-app: Sync error */}
      <ModalSurface visible={!!syncError} onRequestClose={() => setSyncError(null)} contentClassName="p-6">
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Sync failed
        </Text>
        <Text className="text-modal-content-foreground mb-4">{syncError}</Text>
        <ModalButton variant="primary" onPress={() => setSyncError(null)}>
          OK
        </ModalButton>
      </ModalSurface>

      <AddWorkoutModal
        visible={showAddWorkout}
        onClose={() => setShowAddWorkout(false)}
        onSave={handleAddWorkout}
      />

      {/* Delete workout confirmation */}
      <ModalSurface
        visible={!!workoutToDelete}
        onRequestClose={() => setWorkoutToDelete(null)}
        contentClassName="p-6"
      >
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Delete workout?
        </Text>
        <Text className="text-modal-content-foreground mb-4">
          {workoutToDelete?.activityName} will be removed. This can't be undone.
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={() => setWorkoutToDelete(null)}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onPress={() => workoutToDelete && handleDeleteWorkout(workoutToDelete)}
          >
            Delete
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>
    </SafeAreaView>
  );
}
