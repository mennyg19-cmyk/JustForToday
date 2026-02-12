/**
 * AnalyticsOptionA — "Dashboard First" layout.
 *
 * Hero score card with 30-day line chart, module sparkline cards,
 * simplified heatmap, streaks, suggestions, commitment history.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import {
  Target,
  Footprints,
  Dumbbell,
  Heart,
  Clock,
  CheckCircle,
  Calendar,
  BookOpen,
  RotateCcw,
  Shield,
  TrendingUp,
  TrendingDown,
  Award,
  Flame,
  Star,
} from 'lucide-react-native';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { MODULE_HREFS } from '@/lib/modules';
import type { DayScore, Suggestion } from '@/lib/analytics';
import type { AppVisibility, DailyCheckIn } from '@/lib/database/schema';
import { CARD_MB as cardClass } from '@/components/cardStyles';

const SECTION_HREFS: Record<string, string> = MODULE_HREFS;

interface ModuleConfig {
  id: string;
  label: string;
  pctKey: keyof DayScore;
  Icon: typeof CheckCircle;
}

const MODULE_CONFIGS: ModuleConfig[] = [
  { id: 'habits', label: 'Habits', pctKey: 'habitsPct', Icon: CheckCircle },
  { id: 'steps', label: 'Steps', pctKey: 'stepsPct', Icon: Footprints },
  { id: 'workouts', label: 'Workouts', pctKey: 'workoutsPct', Icon: Dumbbell },
  { id: 'inventory', label: 'Inventory', pctKey: 'invPct', Icon: Calendar },
  { id: 'gratitude', label: 'Gratitude', pctKey: 'gratitudePct', Icon: Heart },
  { id: 'fasting', label: 'Fasting', pctKey: 'fastingPct', Icon: Clock },
  { id: 'sobriety', label: 'Sobriety', pctKey: 'sobrietyPct', Icon: Target },
  { id: 'stoic', label: 'Stoic', pctKey: 'stoicPct', Icon: BookOpen },
];

function getModuleIcon(id: string) {
  return MODULE_CONFIGS.find((m) => m.id === id)?.Icon
    ?? (id === 'daily_renewal' ? RotateCcw : Calendar);
}

interface Props {
  dayScoresYear: DayScore[];
  suggestions: Suggestion[];
  checkIns: DailyCheckIn[];
  visibility: AppVisibility | null;
  iconColors: Record<string, string>;
  onDrillDown: (type: 'day' | 'week' | 'month', dateKey: string) => void;
}

export function AnalyticsOptionA({
  dayScoresYear,
  suggestions,
  checkIns,
  visibility,
  iconColors,
  onDrillDown,
}: Props) {
  const router = useRouter();
  const trackedDays = dayScoresYear.filter((d) => !d.beforeTrackingStart);

  // --- Hero card data ---
  const last30 = trackedDays.slice(-30);
  const last60 = trackedDays.slice(-60);
  const avg30 =
    last30.length > 0
      ? Math.round(last30.reduce((s, d) => s + d.score, 0) / last30.length)
      : 0;
  const prevAvg30 =
    last60.length > 30
      ? Math.round(
          last60.slice(0, last60.length - 30).reduce((s, d) => s + d.score, 0) /
            (last60.length - 30)
        )
      : avg30;
  const trendDelta = avg30 - prevAvg30;
  const trendUp = trendDelta >= 0;

  const lineData = useMemo(
    () =>
      last30.map((d, i) => ({
        value: d.score,
        label: i % 7 === 0 ? d.dateKey.slice(5) : '',
        dataPointText: undefined as string | undefined,
      })),
    [last30]
  );

  const todayScore = trackedDays.length > 0 ? trackedDays[trackedDays.length - 1].score : 0;

  // --- Module sparklines (last 7 days) ---
  const last7 = trackedDays.slice(-7);
  const visibleModules = useMemo(() => {
    if (!visibility) return [];
    return MODULE_CONFIGS.filter((m) => visibility[m.id as keyof AppVisibility]);
  }, [visibility]);

  const moduleSparklines = useMemo(
    () =>
      visibleModules.map((mod) => {
        const data = last7.map((d) => ({
          value: Math.round(d[mod.pctKey] as number),
        }));
        const avg =
          last7.length > 0
            ? Math.round(
                last7.reduce((s, d) => s + (d[mod.pctKey] as number), 0) / last7.length
              )
            : 0;
        return { ...mod, data, avg };
      }),
    [visibleModules, last7]
  );

  // --- Streaks ---
  const streakData = useMemo(() => {
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    for (const d of trackedDays) {
      if (d.score >= 50) {
        streak++;
        if (streak > longestStreak) longestStreak = streak;
      } else {
        streak = 0;
      }
    }
    // Current streak (from end)
    for (let i = trackedDays.length - 1; i >= 0; i--) {
      if (trackedDays[i].score >= 50) currentStreak++;
      else break;
    }
    const perfectDays = trackedDays.filter((d) => d.score >= 100).length;
    return { currentStreak, longestStreak, perfectDays };
  }, [trackedDays]);

  // --- Commitment stats ---
  const commitmentStats = useMemo(() => {
    if (checkIns.length === 0) return null;
    const total = checkIns.length;
    const with24h = checkIns.filter((c) => c.commitmentType === '24h').length;
    const with12h = checkIns.filter((c) => c.commitmentType === '12h').length;
    const withNone = checkIns.filter((c) => c.commitmentType === 'none').length;
    const withCommitment = with24h + with12h;
    let currentStreak = 0;
    const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedKey = expected.toISOString().slice(0, 10);
      if (sorted[i]?.date === expectedKey) currentStreak++;
      else break;
    }
    return { total, with24h, with12h, withNone, withCommitment, currentStreak };
  }, [checkIns]);

  const primaryColor = iconColors.primary;

  return (
    <View className="gap-4">
      {/* Hero Score Card */}
      <View className={cardClass}>
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-sm text-muted-foreground font-medium">Today's Score</Text>
            <Text className="text-4xl font-bold text-foreground">{todayScore}%</Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-1">
              {trendUp ? (
                <TrendingUp size={18} color={iconColors.primary} />
              ) : (
                <TrendingDown size={18} color={iconColors.destructive} />
              )}
              <Text
                className={`text-sm font-semibold ${trendUp ? 'text-primary' : 'text-destructive'}`}
              >
                {trendUp ? '+' : ''}{trendDelta}%
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">vs prev 30 days</Text>
          </View>
        </View>
        <Text className="text-xs text-muted-foreground mb-2">30-day average: {avg30}%</Text>
        {lineData.length > 1 && (
          <LineChart
            data={lineData}
            width={280}
            height={120}
            spacing={280 / Math.max(lineData.length - 1, 1)}
            color={primaryColor}
            thickness={2}
            startFillColor={primaryColor}
            endFillColor="transparent"
            startOpacity={0.3}
            endOpacity={0}
            areaChart
            hideDataPoints
            hideYAxisText
            hideAxesAndRules
            curved
            adjustToWidth
            isAnimated={false}
          />
        )}
      </View>

      {/* Module Sparkline Cards */}
      {moduleSparklines.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {moduleSparklines.map((mod) => {
            const href = SECTION_HREFS[mod.id];
            const Icon = mod.Icon;
            return (
              <TouchableOpacity
                key={mod.id}
                onPress={() => href && router.push(href as any)}
                activeOpacity={0.7}
                className="bg-card rounded-xl p-3 border border-border"
                style={{ width: 140 }}
              >
                <View className="flex-row items-center gap-2 mb-2">
                  <Icon size={16} color={primaryColor} />
                  <Text className="text-xs font-medium text-foreground" numberOfLines={1}>{mod.label}</Text>
                </View>
                <Text className="text-lg font-bold text-foreground mb-1">{mod.avg}%</Text>
                {mod.data.length > 1 && (
                  <BarChart
                    data={mod.data}
                    width={100}
                    height={32}
                    barWidth={8}
                    spacing={4}
                    frontColor={primaryColor}
                    hideYAxisText
                    hideAxesAndRules
                    hideOrigin
                    isAnimated={false}
                    barBorderRadius={2}
                    yAxisThickness={0}
                    xAxisThickness={0}
                    maxValue={100}
                    noOfSections={1}
                    disablePress
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Streaks & Milestones */}
      <View className={cardClass}>
        <View className="flex-row items-center gap-2 mb-3">
          <Flame size={18} color={iconColors.primary} />
          <Text className="text-base font-semibold text-foreground">Streaks & Milestones</Text>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">{streakData.currentStreak}</Text>
            <Text className="text-xs text-muted-foreground text-center">Current streak</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">{streakData.longestStreak}</Text>
            <Text className="text-xs text-muted-foreground text-center">Longest streak</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-foreground">{streakData.perfectDays}</Text>
            <Text className="text-xs text-muted-foreground text-center">Perfect days</Text>
          </View>
        </View>
        {streakData.currentStreak >= 7 && (
          <View className="flex-row items-center gap-2 mt-3 pt-3 border-t border-border">
            <Award size={16} color={iconColors.primary} />
            <Text className="text-sm text-foreground">
              {streakData.currentStreak >= 30
                ? 'Incredible — 30+ day streak!'
                : streakData.currentStreak >= 14
                  ? 'Two weeks strong!'
                  : 'One week and counting!'}
            </Text>
          </View>
        )}
      </View>

      {/* Year Heatmap */}
      <View className={`${cardClass} overflow-hidden px-3 py-4`}>
        <Text className="text-base font-semibold text-foreground mb-1">Last year</Text>
        <Text className="text-sm text-muted-foreground mb-3">Tap a square for breakdown.</Text>
        <HeatmapGrid
          dayScores={dayScoresYear.map((d) => ({
            dateKey: d.dateKey,
            score: d.score,
            beforeTrackingStart: d.beforeTrackingStart,
          }))}
          weeks={52}
          horizontal
          onCellPress={(dateKey) => onDrillDown('day', dateKey)}
        />
      </View>

      {/* What to Work On */}
      {suggestions.length > 0 && (
        <View className={cardClass}>
          <View className="flex-row items-center gap-2 mb-3">
            <Star size={18} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">What to work on</Text>
          </View>
          {suggestions.slice(0, 3).map((s) => {
            const href = SECTION_HREFS[s.id];
            const Icon = getModuleIcon(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => href && router.push(href as any)}
                className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
                disabled={!href}
              >
                <Icon size={20} color={primaryColor} />
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{s.label}</Text>
                  <Text className="text-xs text-muted-foreground">{s.message}</Text>
                </View>
                <Text className="text-sm font-semibold text-muted-foreground">{s.avgPct}%</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Commitment History */}
      {commitmentStats && commitmentStats.total > 0 && (
        <View className={cardClass}>
          <View className="flex-row items-center gap-2 mb-3">
            <Shield size={18} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">Commitments</Text>
          </View>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[80px]">
              <Text className="text-2xl font-bold text-foreground">{commitmentStats.total}</Text>
              <Text className="text-xs text-muted-foreground">check-ins</Text>
            </View>
            <View className="flex-1 min-w-[80px]">
              <Text className="text-2xl font-bold text-foreground">{commitmentStats.withCommitment}</Text>
              <Text className="text-xs text-muted-foreground">with commitment</Text>
            </View>
            <View className="flex-1 min-w-[80px]">
              <Text className="text-2xl font-bold text-foreground">{commitmentStats.currentStreak}</Text>
              <Text className="text-xs text-muted-foreground">day streak</Text>
            </View>
          </View>
          {commitmentStats.total > 1 && (
            <View className="flex-row gap-2 mt-3 border-t border-border pt-3">
              <Text className="text-xs text-muted-foreground">
                24h: {commitmentStats.with24h} · 12h: {commitmentStats.with12h} · None: {commitmentStats.withNone}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
