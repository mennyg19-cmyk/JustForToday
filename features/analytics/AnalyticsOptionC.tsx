/**
 * AnalyticsOptionC — "Module Timeline" layout with period selector.
 *
 * Period selector (7d/30d/90d/1y), overall line chart, per-module rows
 * with mini bar charts, year heatmap, personal records, suggestions.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
  ChevronDown,
  ChevronUp,
  Trophy,
  Star,
} from 'lucide-react-native';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { MODULE_HREFS } from '@/lib/modules';
import type { DayScore, Suggestion } from '@/lib/analytics';
import type { AppVisibility } from '@/lib/database/schema';
import { CARD_MB as cardClass } from '@/components/cardStyles';

const SECTION_HREFS: Record<string, string> = MODULE_HREFS;

type Period = '7d' | '30d' | '90d' | '1y';
const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: '7d', label: '7d', days: 7 },
  { key: '30d', label: '30d', days: 30 },
  { key: '90d', label: '90d', days: 90 },
  { key: '1y', label: '1y', days: 365 },
];

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
  { id: 'step11', label: 'Step 11', pctKey: 'invPct', Icon: Calendar },
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
  visibility: AppVisibility | null;
  iconColors: Record<string, string>;
  onDrillDown: (type: 'day' | 'week' | 'month', dateKey: string) => void;
}

export function AnalyticsOptionC({
  dayScoresYear,
  suggestions,
  visibility,
  iconColors,
  onDrillDown,
}: Props) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('30d');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const trackedDays = dayScoresYear.filter((d) => !d.beforeTrackingStart);
  const periodDays = PERIODS.find((p) => p.key === period)!.days;
  const periodData = trackedDays.slice(-periodDays);

  const primaryColor = iconColors.primary;

  // --- Overall line chart data ---
  const lineData = useMemo(() => {
    // For large periods, aggregate by week to keep chart readable
    if (periodData.length <= 60) {
      return periodData.map((d, i) => ({
        value: d.score,
        label: i % Math.max(1, Math.floor(periodData.length / 5)) === 0 ? d.dateKey.slice(5) : '',
      }));
    }
    // Aggregate by week
    const weeks: { value: number; label: string }[] = [];
    for (let i = 0; i < periodData.length; i += 7) {
      const chunk = periodData.slice(i, i + 7);
      const avg = Math.round(chunk.reduce((s, d) => s + d.score, 0) / chunk.length);
      weeks.push({
        value: avg,
        label: weeks.length % Math.max(1, Math.floor(periodData.length / 7 / 5)) === 0
          ? chunk[0].dateKey.slice(5)
          : '',
      });
    }
    return weeks;
  }, [periodData]);

  const avgScore =
    periodData.length > 0
      ? Math.round(periodData.reduce((s, d) => s + d.score, 0) / periodData.length)
      : 0;

  // --- Visible modules ---
  const visibleModules = useMemo(() => {
    if (!visibility) return [];
    return MODULE_CONFIGS.filter((m) => visibility[m.id as keyof AppVisibility]);
  }, [visibility]);

  // --- Per-module data for current period ---
  const moduleRows = useMemo(
    () =>
      visibleModules.map((mod) => {
        const values = periodData.map((d) => Math.round(d[mod.pctKey] as number));
        const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        const bestDay = values.length > 0 ? Math.max(...values) : 0;
        const worstDay = values.length > 0 ? Math.min(...values) : 0;

        // Create bar data: aggregate to max ~15 bars for readability
        const maxBars = 15;
        let barData: { value: number }[];
        if (values.length <= maxBars) {
          barData = values.map((v) => ({ value: v }));
        } else {
          const chunkSize = Math.ceil(values.length / maxBars);
          barData = [];
          for (let i = 0; i < values.length; i += chunkSize) {
            const chunk = values.slice(i, i + chunkSize);
            barData.push({ value: Math.round(chunk.reduce((a, b) => a + b, 0) / chunk.length) });
          }
        }

        // Streak (consecutive days >= 50% for this module)
        let streak = 0;
        for (let i = values.length - 1; i >= 0; i--) {
          if (values[i] >= 50) streak++;
          else break;
        }

        return { ...mod, avg, bestDay, worstDay, barData, streak };
      }),
    [visibleModules, periodData]
  );

  // --- Personal records ---
  const records = useMemo(() => {
    if (trackedDays.length === 0) return null;
    const bestDay = trackedDays.reduce((best, d) => (d.score > best.score ? d : best), trackedDays[0]);
    const perfectDays = trackedDays.filter((d) => d.score >= 100).length;

    // Best week
    let bestWeekScore = 0;
    let bestWeekKey = '';
    for (let i = 0; i <= trackedDays.length - 7; i++) {
      const chunk = trackedDays.slice(i, i + 7);
      const avg = chunk.reduce((s, d) => s + d.score, 0) / chunk.length;
      if (avg > bestWeekScore) {
        bestWeekScore = avg;
        bestWeekKey = chunk[0].dateKey;
      }
    }

    // Longest streak (score >= 50)
    let longestStreak = 0;
    let s = 0;
    for (const d of trackedDays) {
      if (d.score >= 50) { s++; if (s > longestStreak) longestStreak = s; }
      else s = 0;
    }

    return {
      bestDay: { date: bestDay.dateKey, score: bestDay.score },
      bestWeek: { date: bestWeekKey, score: Math.round(bestWeekScore) },
      perfectDays,
      longestStreak,
    };
  }, [trackedDays]);

  return (
    <View className="gap-4">
      {/* Period Selector */}
      <View className="flex-row bg-card rounded-xl border border-border p-1">
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            className={`flex-1 py-2 rounded-lg items-center ${
              period === p.key ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                period === p.key ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overall Score Line Chart */}
      <View className={cardClass}>
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-sm text-muted-foreground font-medium">Average Score</Text>
            <Text className="text-3xl font-bold text-foreground">{avgScore}%</Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {periodData.length} tracked day{periodData.length !== 1 ? 's' : ''}
          </Text>
        </View>
        {lineData.length > 1 && (
          <LineChart
            data={lineData}
            width={280}
            height={140}
            spacing={280 / Math.max(lineData.length - 1, 1)}
            color={primaryColor}
            thickness={2}
            startFillColor={primaryColor}
            endFillColor="transparent"
            startOpacity={0.2}
            endOpacity={0}
            areaChart
            hideDataPoints
            hideYAxisText
            hideAxesAndRules
            curved
            adjustToWidth
            isAnimated={false}
            showReferenceLine1
            referenceLine1Position={avgScore}
            referenceLine1Config={{
              color: iconColors.muted,
              dashWidth: 4,
              dashGap: 4,
              thickness: 1,
            }}
          />
        )}
      </View>

      {/* Module Rows */}
      {moduleRows.map((mod) => {
        const isExpanded = expandedModule === mod.id;
        const href = SECTION_HREFS[mod.id];
        const Icon = mod.Icon;
        return (
          <View key={mod.id} className={`bg-card rounded-xl border border-border overflow-hidden`}>
            <TouchableOpacity
              onPress={() => setExpandedModule(isExpanded ? null : mod.id)}
              activeOpacity={0.7}
              className="flex-row items-center p-3 gap-3"
            >
              <Icon size={20} color={primaryColor} />
              <View className="flex-1">
                <Text className="text-foreground font-medium">{mod.label}</Text>
                <Text className="text-xs text-muted-foreground">{mod.streak > 0 ? `${mod.streak} day streak` : 'No active streak'}</Text>
              </View>
              <Text className="text-lg font-bold text-foreground mr-2">{mod.avg}%</Text>
              {isExpanded ? (
                <ChevronUp size={16} color={iconColors.muted} />
              ) : (
                <ChevronDown size={16} color={iconColors.muted} />
              )}
            </TouchableOpacity>

            {/* Mini bar chart always visible */}
            <View className="px-3 pb-3">
              {mod.barData.length > 0 && (
                <BarChart
                  data={mod.barData}
                  width={280}
                  height={40}
                  barWidth={280 / mod.barData.length / 2}
                  spacing={280 / mod.barData.length / 2}
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
                  adjustToWidth
                  disablePress
                />
              )}
            </View>

            {/* Expanded details */}
            {isExpanded && (
              <View className="px-3 pb-3 border-t border-border pt-3">
                <View className="flex-row gap-4 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">Best day</Text>
                    <Text className="text-lg font-bold text-foreground">{mod.bestDay}%</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">Worst day</Text>
                    <Text className="text-lg font-bold text-foreground">{mod.worstDay}%</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground">Streak</Text>
                    <Text className="text-lg font-bold text-foreground">{mod.streak}d</Text>
                  </View>
                </View>
                {href && (
                  <TouchableOpacity
                    onPress={() => router.push(href as any)}
                    className="py-2 rounded-lg bg-primary/10 items-center"
                  >
                    <Text className="text-primary font-semibold text-sm">Go to {mod.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* Year Heatmap */}
      <View className={`${cardClass} overflow-hidden px-3 py-4`}>
        <Text className="text-base font-semibold text-foreground mb-1">Full Year</Text>
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

      {/* Personal Records */}
      {records && (
        <View className={cardClass}>
          <View className="flex-row items-center gap-2 mb-3">
            <Trophy size={18} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">Personal Records</Text>
          </View>
          <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[45%]">
              <Text className="text-2xl font-bold text-foreground">{records.bestDay.score}%</Text>
              <Text className="text-xs text-muted-foreground">Best day ({records.bestDay.date.slice(5)})</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-2xl font-bold text-foreground">{records.bestWeek.score}%</Text>
              <Text className="text-xs text-muted-foreground">Best week avg</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-2xl font-bold text-foreground">{records.longestStreak}d</Text>
              <Text className="text-xs text-muted-foreground">Longest streak</Text>
            </View>
            <View className="flex-1 min-w-[45%]">
              <Text className="text-2xl font-bold text-foreground">{records.perfectDays}</Text>
              <Text className="text-xs text-muted-foreground">Perfect days</Text>
            </View>
          </View>
        </View>
      )}

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
    </View>
  );
}
