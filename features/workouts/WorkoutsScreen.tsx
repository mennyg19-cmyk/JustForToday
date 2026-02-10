import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MetricCard } from '@/components/MetricCard';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { CARD_MB as cardClass } from '@/components/cardStyles';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateWithWeekday } from '@/utils/date';
import { useSteps } from '@/features/steps/hooks/useSteps';
import { AddWorkoutModal } from '@/features/steps/components/AddWorkoutModal';
import type { Workout } from '@/lib/database/schema';
import { useRouter, useLocalSearchParams } from 'expo-router';

export function WorkoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const iconColors = useIconColors();
  const {
    workoutsToday,
    workoutsGoal,
    recentDaysWithWorkoutsAndCalories,
    loading,
    error,
    refresh,
    addManualWorkout,
    addManualWorkoutForDate,
    removeWorkout,
  } = useSteps();

  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [addWorkoutForDate, setAddWorkoutForDate] = useState<string | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null);

  const handleAddWorkout = useCallback(
    async (activityName: string, durationMinutes: number, caloriesBurned: number) => {
      const dateKey = addWorkoutForDate ?? undefined;
      if (dateKey) {
        await addManualWorkoutForDate(dateKey, activityName, durationMinutes, caloriesBurned);
        setAddWorkoutForDate(null);
      } else {
        await addManualWorkout(activityName, durationMinutes, caloriesBurned);
        setShowAddWorkout(false);
      }
    },
    [addManualWorkout, addManualWorkoutForDate]
  );

  const handleDeleteWorkout = useCallback(
    async (w: Workout) => {
      await removeWorkout(w.id);
      setWorkoutToDelete(null);
    },
    [removeWorkout]
  );

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Workouts" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const totalCaloriesToday = workoutsToday.reduce((s, w) => s + w.caloriesBurned, 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Workouts" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

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
        <View className="mb-4">
          <MetricCard
            icon={Dumbbell}
            iconColor={iconColors.primary}
            title="Today"
            value={workoutsToday.length}
            subtitle={
              workoutsGoal > 0
                ? `Goal: ${workoutsGoal} · ${workoutsToday.length >= workoutsGoal ? 'Done' : `${workoutsToday.length}/${workoutsGoal}`}`
                : workoutsToday.length > 0
                  ? `${totalCaloriesToday} kcal burned`
                  : 'Set goal in Settings'
            }
            actionLabel="Add"
            onAction={() => setShowAddWorkout(true)}
          >
            {workoutsToday.length > 0 ? (
              <View className="gap-1">
                {workoutsToday.map((w) => (
                  <View
                    key={w.id}
                    className="flex-row items-center justify-between py-1 border-b border-border last:border-b-0"
                  >
                    <Text className="text-xs text-foreground font-medium" numberOfLines={1}>
                      {w.activityName} · {w.durationMinutes} min · {w.caloriesBurned} kcal
                    </Text>
                    {w.source === 'manual' ? (
                      <TouchableOpacity
                        onPress={() => setWorkoutToDelete(w)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={14} color={iconColors.destructive} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </MetricCard>
        </View>

        <View className={cardClass}>
          <Text className="text-base font-semibold text-foreground mb-3">Last 7 days</Text>
          <View className="gap-2">
            <View className="flex-row items-center py-2 border-b border-border">
              <View className="flex-1">
                <Text className="text-muted-foreground font-medium">Date</Text>
              </View>
              <View className="w-20">
                <Text className="text-muted-foreground font-medium text-center">Workouts</Text>
              </View>
              <View className="w-20">
                <Text className="text-muted-foreground font-medium text-right">Calories</Text>
              </View>
            </View>
            {recentDaysWithWorkoutsAndCalories.map((day) => (
              <View
                key={day.date}
                className="flex-row items-center py-2 border-b border-border last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="text-foreground font-medium text-sm">
                    {day.isToday ? 'Today' : formatDateWithWeekday(day.date)}
                  </Text>
                </View>
                <View className="w-20 flex-row items-center justify-center gap-1">
                  <Text className="text-foreground text-sm">{day.workoutsCount}</Text>
                  <TouchableOpacity
                    onPress={() => setAddWorkoutForDate(day.date)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-1"
                  >
                    <Dumbbell size={14} color={iconColors.primary} />
                  </TouchableOpacity>
                </View>
                <View className="w-20">
                  <Text className="text-foreground text-sm text-right">
                    {day.workoutsCalories}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-sm text-muted-foreground px-1">
          Workout goal is in Settings → Visible sections → module gear.
        </Text>
      </ScrollView>

      <AddWorkoutModal
        visible={showAddWorkout || !!addWorkoutForDate}
        dateLabel={
          addWorkoutForDate
            ? recentDaysWithWorkoutsAndCalories.find((d) => d.date === addWorkoutForDate)?.isToday
              ? undefined
              : formatDateWithWeekday(addWorkoutForDate)
            : undefined
        }
        onClose={() => {
          setShowAddWorkout(false);
          setAddWorkoutForDate(null);
        }}
        onSave={handleAddWorkout}
      />

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
