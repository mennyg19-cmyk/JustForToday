import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Footprints, Pencil, CheckCircle, Flame } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MetricCard } from '@/components/MetricCard';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { CARD as cardClass } from '@/components/cardStyles';
import { useIconColors } from '@/lib/iconTheme';
import { formatDateShort, formatDateWithWeekday } from '@/utils/date';
import { useSteps, type RecentStepsDay } from './hooks/useSteps';
import { EditStepsModal } from './components/EditStepsModal';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';

export function StepsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const iconColors = useIconColors();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const {
    stepsToday,
    stepsGoal,
    recentDaysWithWorkoutsAndCalories,
    heatmapStepsData,
    activeCaloriesToday,
    activeCaloriesSource,
    loading,
    error,
    refresh,
    setManualSteps,
  } = useSteps();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDay, setEditDay] = useState<RecentStepsDay | null>(null);

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

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Steps" rightSlot={<ThemeToggle />} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  const progressPct = stepsGoal > 0 ? Math.min(100, (stepsToday / stepsGoal) * 100) : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Steps" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

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
        {/* Row 1: Calories – full width */}
        <View className="mb-4">
          <MetricCard
            icon={Flame}
            iconColor={iconColors.primary}
            title="Active calories"
            value={activeCaloriesToday.toLocaleString()}
            subtitle={
              activeCaloriesSource === 'healthkit'
                ? 'From Health app'
                : activeCaloriesSource === 'estimated'
                  ? 'Estimated from steps (~0.04 kcal/step)'
                  : 'Log steps or sync from Health'
            }
          />
        </View>

        {/* Steps card */}
        <View className="mb-4">
          <MetricCard
            icon={Footprints}
            iconColor={iconColors.primary}
            title="Steps"
            value={stepsToday.toLocaleString()}
            subtitle={
              stepsGoal > 0
                ? `Goal: ${stepsGoal.toLocaleString()} · ${Math.round(progressPct)}%`
                : 'Set goal in Settings'
            }
            actionLabel="Edit"
            onAction={openEditToday}
          >
            {stepsGoal > 0 ? (
              <View className="h-2 rounded-full bg-muted overflow-hidden">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </View>
            ) : null}
          </MetricCard>
        </View>

        {/* Recent days: steps and calories */}
        <View className={`${cardClass} mb-4`}>
          <Text className="text-base font-semibold text-foreground mb-3">
            Last 7 days
          </Text>
          <View className="gap-2">
            <View className="flex-row items-center py-2 border-b border-border">
              <View className="w-[40%]">
                <Text className="text-muted-foreground font-medium">Date</Text>
              </View>
              <View className="w-[35%]">
                <Text className="text-muted-foreground font-medium">Steps</Text>
              </View>
              <View className="w-[25%]">
                <Text className="text-muted-foreground font-medium text-right">Calories</Text>
              </View>
            </View>
            {recentDaysWithWorkoutsAndCalories.map((day) => {
              const stepsPct =
                stepsGoal > 0
                  ? Math.min(100, Math.round((day.steps_count / stepsGoal) * 100))
                  : null;
              const stepsLabel =
                stepsPct !== null
                  ? `${day.steps_count.toLocaleString()}/${stepsPct}%`
                  : day.steps_count.toLocaleString();
              return (
                <View
                  key={day.date}
                  className="flex-row items-center py-2 border-b border-border last:border-b-0"
                >
                  <View className="w-[40%]">
                    <Text
                      className="text-foreground font-medium text-sm"
                      numberOfLines={1}
                    >
                      {day.isToday ? 'Today' : formatDateWithWeekday(day.date)}
                    </Text>
                  </View>
                  <View className="w-[35%] flex-row items-center gap-1 flex-wrap">
                    <Text className="text-foreground text-sm">{stepsLabel}</Text>
                    {stepsGoal > 0 && day.steps_count >= stepsGoal && (
                      <CheckCircle size={14} color={iconColors.primary} />
                    )}
                    <TouchableOpacity
                      onPress={() => openEditDay(day)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      className="p-1"
                    >
                      <Pencil size={16} color={iconColors.primary} />
                    </TouchableOpacity>
                  </View>
                  <View className="w-[25%]">
                    <Text className="text-foreground text-sm text-right">
                      {day.activeCalories}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Link href="/workouts" asChild>
            <TouchableOpacity className="mt-3 py-2">
              <Text className="text-sm font-medium text-primary">View workouts →</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Steps heatmap – last 3 months */}
        <View className={`${cardClass} mb-4 overflow-hidden`}>
          <Text className="text-base font-semibold text-foreground mb-3">
            Last 3 months
          </Text>
          <HeatmapGrid dayScores={heatmapStepsData} weeks={14} horizontal />
        </View>

        <Text className="text-sm text-muted-foreground px-1">
          Steps goal is in Settings → Visible sections.
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

    </SafeAreaView>
  );
}
