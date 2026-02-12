/**
 * AnalyticsScreen — data loading, drill-down modal, and dashboard layout.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalSurface } from '@/components/ModalSurface';
import {
  getDailyScoresForLastDays,
  getSuggestionsFromScores,
} from '@/lib/analytics';
import type { DayScore } from '@/lib/analytics';
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
} from 'lucide-react-native';
import { MODULE_HREFS } from '@/lib/modules';
import { getAllCheckIns } from '@/features/checkin/database';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { logger } from '@/lib/logger';
import { AnalyticsOptionA } from './AnalyticsOptionA';

const DAYS_IN_YEAR = 52 * 7;
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

function getWeekDateKeys(weekStartDateKey: string): string[] {
  const d = new Date(weekStartDateKey + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return formatDateKey(x);
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
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drillDown, setDrillDown] = useState<{ type: 'day' | 'week' | 'month'; dateKey: string } | null>(null);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const load = useCallback(async () => {
    try {
      setError(null);
      const [dailyYear, vis, allCheckIns] = await Promise.all([
        getDailyScoresForLastDays(DAYS_IN_YEAR),
        getAppVisibility(),
        getAllCheckIns(),
      ]);
      setDayScoresYear(dailyYear);
      setVisibility(vis);
      setCheckIns(allCheckIns);
    } catch (err) {
      logger.error('Analytics load failed:', err);
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
  const suggestions = visibility
    ? getSuggestionsFromScores(trackedDays, visibility)
    : [];

  // --- Drill-down logic ---
  const drillDownBreakdown = useMemo(() => {
    if (!drillDown || !visibility) return null;
    const dayMap = new Map(dayScoresYear.map((d) => [d.dateKey, d]));
    if (drillDown.type === 'day') {
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

  const handleDrillDown = useCallback((type: 'day' | 'week' | 'month', dateKey: string) => {
    setDrillDown({ type, dateKey });
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader
        title="Analytics"
        showBack
        onBackPress={() => router.replace('/settings')}
        rightSlot={<ThemeToggle />}
      />

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={onRefresh} />
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
          <AnalyticsOptionA
            dayScoresYear={dayScoresYear}
            suggestions={suggestions}
            checkIns={checkIns}
            visibility={visibility}
            iconColors={iconColors}
            onDrillDown={handleDrillDown}
          />
        </ScrollView>
      )}

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
