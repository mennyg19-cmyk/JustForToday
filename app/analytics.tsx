import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalSurface } from '@/components/ModalSurface';
import {
  getDailyScoresForLastDays,
  getWeeklyScoresForLastWeeks,
  getMonthlyScoresForLastMonths,
  getSuggestionsFromScores,
} from '@/lib/analytics';
import type { DayScore } from '@/lib/analytics';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { formatDateKey } from '@/utils/date';
import { useIconColors } from '@/lib/iconTheme';
import { getAppVisibility } from '@/lib/settings/database';
import type { AppVisibility, DailyCheckIn } from '@/lib/database/schema';
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
} from 'lucide-react-native';
import { MODULE_HREFS } from '@/lib/modules';
import { getAllCheckIns } from '@/features/checkin/database';

const DAYS_IN_YEAR = 52 * 7; // 364 days for year heatmap
const WEEKS_52 = 52;
const MONTHS_12 = 12;

const SECTION_HREFS: Record<string, string> = MODULE_HREFS;

const DRILLDOWN_ROWS: { label: string; pctKey: keyof DayScore; sectionId: string; Icon: typeof CheckCircle }[] = [
  { label: 'Habits', pctKey: 'habitsPct', sectionId: 'habits', Icon: CheckCircle },
  { label: 'Steps', pctKey: 'stepsPct', sectionId: 'steps', Icon: Footprints },
  { label: 'Workouts', pctKey: 'workoutsPct', sectionId: 'workouts', Icon: Dumbbell },
  { label: 'Inventory', pctKey: 'invPct', sectionId: 'inventory', Icon: Calendar },
  { label: 'Gratitude', pctKey: 'gratitudePct', sectionId: 'gratitude', Icon: Heart },
  { label: 'Fasting', pctKey: 'fastingPct', sectionId: 'fasting', Icon: Clock },
  { label: 'Sobriety', pctKey: 'sobrietyPct', sectionId: 'sobriety', Icon: Target },
  { label: 'Stoic', pctKey: 'stoicPct', sectionId: 'stoic', Icon: BookOpen },
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getScoreLevel(score: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0) return 0;
  if (score <= 25) return 1;
  if (score <= 50) return 2;
  if (score <= 75) return 3;
  return 4;
}

function getWeekDateKeys(weekStartDateKey: string): string[] {
  const d = new Date(weekStartDateKey + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x.toISOString().split('T')[0];
  });
}

function averageDayScores(scores: DayScore[]): Partial<DayScore> {
  if (scores.length === 0) return {};
  const n = scores.length;
  return {
    habitsPct: scores.reduce((s, d) => s + d.habitsPct, 0) / n,
    stepsPct: scores.reduce((s, d) => s + d.stepsPct, 0) / n,
    workoutsPct: scores.reduce((s, d) => s + d.workoutsPct, 0) / n,
    invPct: scores.reduce((s, d) => s + d.invPct, 0) / n,
    gratitudePct: scores.reduce((s, d) => s + d.gratitudePct, 0) / n,
    fastingPct: scores.reduce((s, d) => s + d.fastingPct, 0) / n,
    sobrietyPct: scores.reduce((s, d) => s + d.sobrietyPct, 0) / n,
    stoicPct: scores.reduce((s, d) => s + d.stoicPct, 0) / n,
    score: Math.round(scores.reduce((s, d) => s + d.score, 0) / n),
  };
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const iconColors = useIconColors();
  const [dayScoresYear, setDayScoresYear] = useState<DayScore[]>([]);
  const [weekScores, setWeekScores] = useState<{ dateKey: string; score: number }[]>([]);
  const [monthScores, setMonthScores] = useState<{ dateKey: string; score: number }[]>([]);
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<{ type: 'day' | 'week' | 'month'; dateKey: string } | null>(null);
  const [expandedHeatmap, setExpandedHeatmap] = useState<'days' | 'weeks' | 'months' | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [dailyYear, weekly, monthly, vis, allCheckIns] = await Promise.all([
        getDailyScoresForLastDays(DAYS_IN_YEAR),
        getWeeklyScoresForLastWeeks(WEEKS_52),
        getMonthlyScoresForLastMonths(MONTHS_12),
        getAppVisibility(),
        getAllCheckIns(),
      ]);
      setDayScoresYear(dailyYear);
      setWeekScores(weekly.map((w) => ({ dateKey: w.dateKey, score: w.score })));
      setMonthScores(monthly.map((m) => ({ dateKey: m.dateKey, score: m.score })));
      setVisibility(vis);
      setCheckIns(allCheckIns);
    } catch (err) {
      console.error('Analytics load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const trackedDays = dayScoresYear.filter((d) => !d.beforeTrackingStart);
  const avgScore =
    trackedDays.length > 0
      ? Math.round(
          trackedDays.reduce((sum, d) => sum + d.score, 0) / trackedDays.length
        )
      : 0;
  const perfectDays = trackedDays.filter((d) => d.score >= 100).length;
  const goodDays = trackedDays.filter((d) => d.score >= 75 && d.score < 100).length;
  const suggestions = visibility
    ? getSuggestionsFromScores(trackedDays, visibility)
    : [];

  // -- Commitment stats from check-in history --
  const commitmentStats = useMemo(() => {
    if (checkIns.length === 0) return null;
    const total = checkIns.length;
    const with24h = checkIns.filter((c) => c.commitmentType === '24h').length;
    const with12h = checkIns.filter((c) => c.commitmentType === '12h').length;
    const withNone = checkIns.filter((c) => c.commitmentType === 'none').length;
    const withCommitment = with24h + with12h;

    // Count consecutive days from most recent
    let currentStreak = 0;
    const sorted = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date();
    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const expectedKey = expected.toISOString().slice(0, 10);
      if (sorted[i]?.date === expectedKey) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { total, with24h, with12h, withNone, withCommitment, currentStreak };
  }, [checkIns]);

  const drillDownBreakdown = useMemo(() => {
    if (!drillDown || !visibility) return null;
    const dayMap = new Map(dayScoresYear.map((d) => [d.dateKey, d]));
    if (drillDown.type === 'day') {
      // Single day only: use that day's record, never weekly/monthly average
      const d = dayMap.get(drillDown.dateKey);
      return d ? { score: d.score, rows: d } : null;
    }
    if (drillDown.type === 'week') {
      const keys = getWeekDateKeys(drillDown.dateKey);
      const scores = keys.map((k) => dayMap.get(k)).filter(Boolean) as DayScore[];
      const avg = averageDayScores(scores);
      return avg.score != null ? { score: avg.score, rows: avg } : null;
    }
    if (drillDown.type === 'month') {
      const prefix = drillDown.dateKey.slice(0, 7);
      const scores = dayScoresYear.filter((d) => d.dateKey.startsWith(prefix));
      const avg = averageDayScores(scores);
      return avg.score != null ? { score: avg.score, rows: avg } : null;
    }
    return null;
  }, [drillDown, dayScoresYear, visibility]);

  const drillDownTitle = useMemo(() => {
    if (!drillDown) return '';
    if (drillDown.type === 'day') {
      const d = new Date(drillDown.dateKey + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (drillDown.type === 'week') {
      const d = new Date(drillDown.dateKey + 'T00:00:00');
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const d = new Date(drillDown.dateKey + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [drillDown]);

  const cardClass = 'rounded-2xl p-4 bg-card border border-border mb-4';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader
        title="Analytics"
        showBack
        onBackPress={() => router.replace('/settings')}
        rightSlot={<ThemeToggle />}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColors.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground font-semibold mb-2">Failed to load</Text>
          <Text className="text-muted-foreground text-center">{error}</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={iconColors.primary}
            />
          }
        >
          {/* Summary stats – top */}
          <View className="flex-row flex-wrap gap-4 mb-4">
            <View className="flex-1 min-w-[100px] rounded-2xl p-4 bg-card border border-border">
              <Text className="text-xs text-muted-foreground font-medium">Average score (1y)</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{avgScore}%</Text>
            </View>
            <View className="flex-1 min-w-[100px] rounded-2xl p-4 bg-card border border-border">
              <Text className="text-xs text-muted-foreground font-medium">Perfect days (100%)</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{perfectDays}</Text>
            </View>
            <View className="flex-1 min-w-[100px] rounded-2xl p-4 bg-card border border-border">
              <Text className="text-xs text-muted-foreground font-medium">Good days (75%+)</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">{goodDays}</Text>
            </View>
          </View>

          {/* Commitment history stats */}
          {commitmentStats && commitmentStats.total > 0 && (
            <View className={`${cardClass}`}>
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

          {/* Daily heatmap – tap card to open bigger; tap cell to drill down */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setExpandedHeatmap('days')}
            className={`${cardClass} overflow-hidden px-3 py-4`}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-base font-semibold text-foreground">Last year</Text>
              <Text className="text-xs text-primary font-medium">Tap to enlarge</Text>
            </View>
            <Text className="text-sm text-muted-foreground mb-3">
              Every day. Tap a square to see breakdown.
            </Text>
            <HeatmapGrid
              dayScores={dayScoresYear.map((d) => ({
                dateKey: d.dateKey,
                score: d.score,
                beforeTrackingStart: d.beforeTrackingStart,
              }))}
              weeks={52}
              horizontal
              onCellPress={(dateKey) => setDrillDown({ type: 'day', dateKey })}
            />
          </TouchableOpacity>

          {/* 52 weeks and 12 months – tap card to open bigger */}
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setExpandedHeatmap('weeks')}
              className="flex-1 min-w-0 rounded-2xl p-4 bg-card border border-border overflow-hidden"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-semibold text-foreground">52 weeks</Text>
                <Text className="text-xs text-primary font-medium">Tap to enlarge</Text>
              </View>
              <Text className="text-sm text-muted-foreground mb-3">Weekly average. Tap a square to see breakdown.</Text>
              <HeatmapGrid
                dayScores={weekScores}
                singleRow
                gridRows={4}
                onCellPress={(dateKey) => setDrillDown({ type: 'week', dateKey })}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setExpandedHeatmap('months')}
              className="flex-1 min-w-0 rounded-2xl p-4 bg-card border border-border overflow-hidden"
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-semibold text-foreground">12 months</Text>
                <Text className="text-xs text-primary font-medium">Tap to enlarge</Text>
              </View>
              <Text className="text-sm text-muted-foreground mb-3">Monthly average. Tap a square to see breakdown.</Text>
              <HeatmapGrid
                dayScores={monthScores}
                singleRow
                gridRows={3}
                onCellPress={(dateKey) => setDrillDown({ type: 'month', dateKey })}
              />
            </TouchableOpacity>
          </View>

          {/* What to work on – at bottom, collapsed by default */}
          <View className={cardClass}>
            <TouchableOpacity
              onPress={() => setSuggestionsExpanded(!suggestionsExpanded)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between"
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  What to work on
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                  Based on your last year. Tap to open that section.
                </Text>
              </View>
              <Text className="text-foreground text-xl w-6 text-center">
                {suggestionsExpanded ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            {suggestionsExpanded && (
              <View className="border-t border-border mt-3 pt-3">
                {suggestions.length === 0 ? (
                  <Text className="text-sm text-muted-foreground">
                    You're hitting all areas — keep it up!
                  </Text>
                ) : (
                  <View className="gap-2">
                    {suggestions.map((s) => {
                      const href = SECTION_HREFS[s.id];
                      const Icon =
                        s.id === 'habits'
                          ? CheckCircle
                          : s.id === 'steps'
                            ? Footprints
                            : s.id === 'workouts'
                              ? Dumbbell
                              : s.id === 'sobriety'
                                ? Target
                                : s.id === 'gratitude'
                                  ? Heart
                                  : s.id === 'fasting'
                                    ? Clock
                                    : s.id === 'stoic'
                                      ? BookOpen
                                      : s.id === 'daily_renewal'
                                        ? RotateCcw
                                        : Calendar;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => href && router.push(href as any)}
                          className="flex-row items-center gap-3 py-2 border-b border-border last:border-b-0"
                          disabled={!href}
                        >
                          <Icon size={20} color={iconColors.primary} />
                          <View className="flex-1">
                            <Text className="text-foreground font-medium">{s.label}</Text>
                            <Text className="text-xs text-muted-foreground">{s.message}</Text>
                          </View>
                          <Text className="text-sm font-semibold text-muted-foreground">
                            {s.avgPct}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>

          <Text className="text-sm text-muted-foreground px-1">
            Tap a day, week, or month to see breakdown. Pull down to refresh.
          </Text>
        </ScrollView>
      )}

      {/* Expanded heatmap modal – days: scrollable calendar by month; weeks/months: bigger grid */}
      <ModalSurface
        visible={!!expandedHeatmap}
        onRequestClose={() => setExpandedHeatmap(null)}
        contentClassName="p-4 w-[98%] max-w-lg h-[85%]"
      >
        {expandedHeatmap && (
          <>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-modal-content-foreground">
                {expandedHeatmap === 'days' ? 'Pick a day' : expandedHeatmap === 'weeks' ? '52 weeks' : '12 months'}
              </Text>
              <TouchableOpacity onPress={() => setExpandedHeatmap(null)}>
                <Text className="text-primary font-medium">Close</Text>
              </TouchableOpacity>
            </View>
            {expandedHeatmap === 'days' && (
              <ScrollView className="flex-1" showsVerticalScrollIndicator>
                {(() => {
                  const scoreMap = new Map(dayScoresYear.map((d) => [d.dateKey, d.score]));
                  const beforeTrackingMap = new Map(
                    dayScoresYear.map((d) => [d.dateKey, d.beforeTrackingStart])
                  );
                  const levelColors = ['bg-muted', 'bg-primary/20', 'bg-primary/40', 'bg-primary/60', 'bg-primary'];
                  const now = new Date();
                  const months: { year: number; month: number }[] = [];
                  for (let i = 0; i < 12; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    months.push({ year: d.getFullYear(), month: d.getMonth() });
                  }
                  return months.map(({ year, month }) => {
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const title = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    const cells: { dayNum: number | null; dateKey: string | null }[] = [];
                    for (let row = 0; row < 6; row++) {
                      for (let col = 0; col < 7; col++) {
                        const slot = row * 7 + col;
                        const dayNum = slot - firstDay + 1;
                        if (dayNum < 1 || dayNum > daysInMonth) {
                          cells.push({ dayNum: null, dateKey: null });
                        } else {
                          const dateKey = formatDateKey(new Date(year, month, dayNum));
                          cells.push({ dayNum, dateKey });
                        }
                      }
                    }
                    return (
                      <View key={`${year}-${month}`} className="mb-6">
                        <Text className="text-base font-semibold text-modal-content-foreground mb-2">{title}</Text>
                        <View className="flex-row mb-1">
                          {WEEKDAY_LABELS.map((l, i) => (
                            <View key={i} className="flex-1 items-center">
                              <Text className="text-xs text-muted-foreground">{l}</Text>
                            </View>
                          ))}
                        </View>
                        <View className="flex-row flex-wrap">
                          {cells.map((cell, idx) => {
                            const score = cell.dateKey ? (scoreMap.get(cell.dateKey) ?? 0) : 0;
                            const beforeTracking = cell.dateKey ? (beforeTrackingMap.get(cell.dateKey) ?? false) : false;
                            const level = beforeTracking ? 0 : getScoreLevel(score);
                            const colorClass = levelColors[level];
                            return (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                  if (cell.dateKey) {
                                    setDrillDown({ type: 'day', dateKey: cell.dateKey });
                                    setExpandedHeatmap(null);
                                  }
                                }}
                                disabled={!cell.dateKey}
                                className="w-[14.28%] aspect-square items-center justify-center rounded p-0.5"
                                style={{ minWidth: 0 }}
                              >
                                <View className={`flex-1 w-full rounded items-center justify-center ${cell.dateKey ? colorClass : ''}`}>
                                  {cell.dayNum != null && (
                                    <Text className={`text-xs ${cell.dateKey ? 'text-foreground font-medium' : 'text-transparent'}`}>
                                      {cell.dayNum}
                                    </Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  });
                })()}
              </ScrollView>
            )}
            {expandedHeatmap !== 'days' && (
              <Text className="text-sm text-modal-content-foreground/80 mb-3">Tap a square to see breakdown.</Text>
            )}
            {expandedHeatmap === 'weeks' && (
                <HeatmapGrid
                  dayScores={weekScores}
                  singleRow
                  gridRows={4}
                  onCellPress={(dateKey) => {
                    setDrillDown({ type: 'week', dateKey });
                    setExpandedHeatmap(null);
                  }}
                />
            )}
            {expandedHeatmap === 'months' && (
                <HeatmapGrid
                  dayScores={monthScores}
                  singleRow
                  gridRows={3}
                  onCellPress={(dateKey) => {
                    setDrillDown({ type: 'month', dateKey });
                    setExpandedHeatmap(null);
                  }}
                />
            )}
          </>
        )}
      </ModalSurface>

      {/* Drill-down modal */}
      <ModalSurface
        visible={!!drillDown}
        onRequestClose={() => setDrillDown(null)}
        contentClassName="p-6 max-h-[85%]"
      >
        {drillDown && drillDownBreakdown && (
          <>
            <Text className="text-lg font-bold text-modal-content-foreground mb-1">
              {drillDownTitle}
            </Text>
            {drillDown.type === 'day' && (
              <Text className="text-xs text-muted-foreground mb-1">This day only — not averaged</Text>
            )}
            {drillDown.type === 'week' && (
              <Text className="text-xs text-muted-foreground mb-1">Weekly average</Text>
            )}
            {drillDown.type === 'month' && (
              <Text className="text-xs text-muted-foreground mb-1">Monthly average</Text>
            )}
            <Text className="text-sm text-modal-content-foreground/80 mb-4">
              Overall: {drillDownBreakdown.score}%
            </Text>
            <ScrollView className="max-h-64" showsVerticalScrollIndicator>
              {DRILLDOWN_ROWS.map((row) => {
                const pct = (drillDownBreakdown.rows as Record<string, number>)[row.pctKey];
                if (pct == null) return null;
                const visible = visibility![row.sectionId as keyof AppVisibility];
                if (!visible) return null;
                // Don't show Stoic when there was no reflection that period (avoids showing 0% or diluted week average)
                if (row.pctKey === 'stoicPct' && pct === 0) return null;
                const Icon = row.Icon;
                const linkHref = SECTION_HREFS[row.sectionId];
                return (
                  <TouchableOpacity
                    key={row.pctKey}
                    onPress={() => {
                      if (!linkHref) return;
                      setDrillDown(null);
                      router.push({ pathname: linkHref as any, params: { from: 'analytics' } });
                    }}
                    className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Icon size={20} color={iconColors.primary} />
                      <Text className="text-modal-content-foreground font-medium">{row.label}</Text>
                    </View>
                    <Text className="text-modal-content-foreground font-semibold">{Math.round(pct)}%</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setDrillDown(null)}
              className="mt-4 py-3 rounded-lg bg-primary"
            >
              <Text className="text-center font-semibold text-primary-foreground">Close</Text>
            </TouchableOpacity>
          </>
        )}
      </ModalSurface>
    </SafeAreaView>
  );
}
