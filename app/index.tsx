/**
 * Home screen — the daily anchor.
 *
 * Priorities (in visual order):
 *   1. Today's date + soft greeting
 *   2. Check-In card (primary action — or status if already checked in)
 *   3. Daily Quote
 *   4. Your Tools (existing module cards, visually secondary)
 *
 * The progress bar and percentage are removed from here. They still exist
 * in the Analytics screen. The home screen emphasizes presence over performance.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// AsyncStorage used by CheckedInCard (extracted to components/)
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react-native';
import {
  getDashboardData,
  type DashboardData,
} from '@/lib/dashboard';
import {
  getAppVisibility,
  getSectionVisibility,
  getModuleSettings,
  getDashboardOrder,
  getDashboardSectionOrder,
  getDashboardGrouped,
  getCompactViewMode,
} from '@/lib/settings';
import type { AppVisibility, SectionVisibility, ModuleSettingsMap, DailyCheckIn } from '@/lib/database/schema';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { getCardConfigs, CARD_IMAGES } from '@/lib/cardConfigs';
import { DailyQuote } from '@/components/DailyQuote';
import { DEFAULT_DASHBOARD_ORDER, getSectionGroups } from '@/lib/modules';
import type { SectionId } from '@/lib/database/schema';
import { useCheckIn } from '@/features/checkin/hooks/useCheckIn';
import { getEncouragement } from '@/lib/encouragement';
// commitment utilities used by CheckedInCard (extracted to components/)
import { getUserProfile, type UserProfile, getCommitmentPromptDismissedDate, setCommitmentPromptDismissedDate } from '@/lib/settings/database';
import { DailyCommitmentPrompt } from '@/components/DailyCommitmentPrompt';
import { CheckedInCard, LastCommitmentInfo } from '@/components/CheckedInCard';
import { getTodayKey } from '@/utils/date';
import { logger } from '@/lib/logger';

type SectionKey = SectionId;
const defaultOrder = DEFAULT_DASHBOARD_ORDER;
const DASHBOARD_SECTIONS = getSectionGroups();

/**
 * Format today's date as a warm, human-readable string.
 * e.g. "Monday, February 9"
 */
function formatTodayHeading(): string {
  const d = new Date();
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Time-of-day greeting.
 * Before noon: "Good morning", before 5pm: "Good afternoon", else "Good evening".
 */
function getTimeGreeting(name?: string): string {
  const h = new Date().getHours();
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  if (name?.trim()) return `${base}, ${name.trim()}`;
  return base;
}

function isGoalCompleted(id: string, data: DashboardData): boolean {
  switch (id) {
    case 'habits':
      if (!data.hasHabits) return false;
      const habitsTarget = data.habitsGoal > 0 ? data.habitsGoal : data.habitsTotal;
      return data.habitsCompleted >= habitsTarget;
    case 'fasting':
      return data.fastingHoursGoal > 0 && data.fastingHours >= data.fastingHoursGoal;
    case 'inventory':
    case 'step10':
      return data.inventoriesPerDayGoal > 0 && data.inventoryCount >= data.inventoriesPerDayGoal;
    case 'steps':
      return data.stepsGoal > 0 && data.stepsCount >= data.stepsGoal;
    case 'workouts':
      return data.workoutsGoal > 0 && data.workoutsCount >= data.workoutsGoal;
    case 'gratitude':
      return data.gratitudesPerDayGoal > 0 && data.gratitudeCount >= data.gratitudesPerDayGoal;
    case 'stoic':
      return data.stoicReflectionDoneToday;
    case 'daily_renewal':
      return data.hasSobrietyCounters && data.dailyRenewalRenewed === data.sobrietyTotal;
    case 'sobriety':
      return false;
    default:
      return false;
  }
}

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColors = useIconColors();
  const router = useRouter();
  const { todayCheckIn, lastCheckIn, hasCheckedIn, loading: checkInLoading, refresh: refreshCheckIn, resetCheckIn } = useCheckIn();
  const [profile, setProfile] = useState<UserProfile>({ name: '', birthday: '' });

  const [dailyProgress, setDailyProgress] = useState<DashboardData | null>(null);
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility | null>(null);
  const [dashboardGrouped, setDashboardGrouped] = useState<boolean>(false);
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(['sobriety', 'daily_practice', 'health']);
  const [_moduleSettings, setModuleSettings] = useState<ModuleSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
  const [compactView, setCompactViewState] = useState(false); // default expanded
  const [refreshing, setRefreshing] = useState(false);
  // Daily commitment prompt state
  const [showCommitmentPrompt, setShowCommitmentPrompt] = useState(false);
  const [promptDismissedToday, setPromptDismissedToday] = useState(false);
  // Tools start collapsed — the home screen focuses on today's check-in
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const [sectionsCollapsed, setSectionsCollapsed] = useState<Record<SectionKey, boolean>>({
    health: false,
    sobriety: false,
    daily_practice: false,
  });

  const fetchDashboard = useCallback(async () => {
    try {
      const [data, vis, secVis, grouped, secOrder, modSet, order, compact] = await Promise.all([
        getDashboardData(),
        getAppVisibility(),
        getSectionVisibility(),
        getDashboardGrouped(),
        getDashboardSectionOrder(),
        getModuleSettings(),
        getDashboardOrder(),
        getCompactViewMode(),
      ]);
      setDailyProgress(data);
      setVisibility(vis);
      setSectionVisibility(secVis);
      setDashboardGrouped(grouped ?? false);
      setSectionOrder(
        secOrder?.length === 3 ? (secOrder as SectionKey[]) : ['sobriety', 'daily_practice', 'health']
      );
      setModuleSettings(modSet ?? {});
      setDashboardOrder(order ?? []);
      setCompactViewState(compact);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch dashboard:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
  }, [fetchDashboard]);

  // Refresh dashboard, check-in, profile, and commitment prompt on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      refreshCheckIn();
      getUserProfile().then(setProfile).catch(() => {});

      // Check whether to show the daily commitment prompt
      (async () => {
        try {
          const today = getTodayKey();
          const dismissedDate = await getCommitmentPromptDismissedDate();
          const dismissed = dismissedDate === today;
          setPromptDismissedToday(dismissed);

          // Fetch today's check-in inline to avoid stale closure
          const { getCheckInForDate } = await import('@/features/checkin/database');
          const todayCI = await getCheckInForDate(today);
          if (!todayCI && !dismissed) {
            setShowCommitmentPrompt(true);
          }
        } catch (_err) {
          // silently skip prompt on error
        }
      })();

      return () => {};
    }, [fetchDashboard, refreshCheckIn])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboard(), refreshCheckIn()]);
    } catch (err) {
      logger.error('Dashboard refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  /** Dismiss the daily commitment prompt and mark it as dismissed for today. */
  const handleDismissPrompt = useCallback(async () => {
    setShowCommitmentPrompt(false);
    setPromptDismissedToday(true);
    try {
      await setCommitmentPromptDismissedDate(getTodayKey());
    } catch (err) {
      logger.error('Failed to save prompt dismissal:', err);
    }
  }, []);

  /** Navigate to check-in from the prompt and dismiss it. */
  const handlePromptGoToCheckIn = useCallback(async () => {
    setShowCommitmentPrompt(false);
    setPromptDismissedToday(true);
    try {
      await setCommitmentPromptDismissedDate(getTodayKey());
    } catch (err) {
      logger.error('Failed to save prompt dismissal:', err);
    }
    router.push('/check-in');
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error || !dailyProgress || !visibility) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle className="text-destructive mb-4" size={48} />
          <Text className="text-lg font-bold text-foreground mb-2">
            Unable to Load
          </Text>
          <Text className="text-muted-foreground text-center">
            {error || 'Please check your connection and try again'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cardConfigs = getCardConfigs(dailyProgress);
  const secVis = sectionVisibility ?? { health: true, sobriety: true, daily_practice: true };
  const baseOrder = dashboardOrder.length > 0 ? dashboardOrder : defaultOrder;
  const orderedIds = [
    ...baseOrder.filter((id) => visibility?.[id as keyof AppVisibility]),
    ...defaultOrder.filter(
      (id) =>
        visibility?.[id as keyof AppVisibility] && !baseOrder.includes(id)
    ),
  ];
  const grouped = dashboardGrouped ?? false;

  const toggleSection = (key: SectionKey) => {
    setSectionsCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Encouragement message for the home screen (changes daily, personalized)
  const encouragement = getEncouragement('home', new Date(), profile.name);

  const renderCard = (id: string) => {
    const config = cardConfigs[id as keyof typeof cardConfigs];
    if (!config) return null;

    const IconComponent = config.icon;
    const iconColor = isDark ? iconColors.foreground : config.iconColorLight;
    const badgeColor = isDark ? config.badgeColorDark : config.badgeColorLight;
    const textColor = isDark ? config.textColorDark : config.textColorLight;
    const goalDone = isGoalCompleted(id, dailyProgress);
    const imageSource = CARD_IMAGES[id];

    if (compactView) {
      return (
        <Link href={config.href as any} asChild>
          <TouchableOpacity className="w-full">
            <View className="bg-card rounded-xl overflow-hidden border border-border p-3 shadow-card">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-foreground font-bold text-sm">
                  {config.title}
                </Text>
                {goalDone && (
                  <CheckCircle size={18} color={iconColors.success} />
                )}
              </View>
              <Text className="text-muted-foreground text-xs mb-2">
                {config.getSubtitle(dailyProgress)}
              </Text>
              <View
                className={`px-2 py-1 rounded-full ${badgeColor} self-start`}
              >
                <Text className={`text-xs font-bold ${textColor}`}>
                  {config.getBadgeText(dailyProgress)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      );
    }

    return (
      <Link href={config.href as any} asChild>
        <TouchableOpacity className="w-full">
          <View
            className={`rounded-2xl overflow-hidden border border-border shadow-card-lg ${imageSource ? '' : 'bg-card'}`}
            style={imageSource ? styles.cardWithImage : undefined}
          >
            {imageSource ? (
              <>
                <View style={StyleSheet.absoluteFill}>
                  <Image
                    source={imageSource}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
                {isDark && (
                  <View
                    style={[StyleSheet.absoluteFill, styles.cardImageDarkOverlay]}
                    pointerEvents="none"
                  />
                )}
                <View
                  style={styles.cardBannerOverlay}
                  className="bg-card p-4"
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground font-bold text-lg">
                      {config.title}
                    </Text>
                    {goalDone && (
                      <CheckCircle size={22} color={iconColors.success} />
                    )}
                  </View>
                  <Text className="text-muted-foreground text-sm mt-1">
                    {config.getSubtitle(dailyProgress)}
                  </Text>
                  <View
                    className={`absolute bottom-4 right-4 px-2 py-1 rounded-full ${badgeColor}`}
                  >
                    <Text className={`text-xs font-bold ${textColor}`}>
                      {config.getBadgeText(dailyProgress)}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View
                  style={{ height: 100, backgroundColor: isDark ? config.bannerColorDark : config.bannerColorLight }}
                >
                  <View className="flex-1 items-center justify-center">
                    <IconComponent size={40} color={iconColor} />
                  </View>
                </View>
                <View className="p-4 relative">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground font-bold text-lg">
                      {config.title}
                    </Text>
                    {goalDone && (
                      <CheckCircle size={22} color={iconColors.success} />
                    )}
                  </View>
                  <Text className="text-muted-foreground text-sm mt-1">
                    {config.getSubtitle(dailyProgress)}
                  </Text>
                  <View
                    className={`absolute bottom-4 right-4 px-2 py-1 rounded-full ${badgeColor}`}
                  >
                    <Text className={`text-xs font-bold ${textColor}`}>
                      {config.getBadgeText(dailyProgress)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      {/* ---------------------------------------------------------------- */}
      {/* Header: today's date, personalized greeting, controls             */}
      {/* ---------------------------------------------------------------- */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-primary tracking-wide">
            Just for Today
          </Text>
          <ThemeToggle />
        </View>
        <Text className="text-sm text-muted-foreground mt-1">{formatTodayHeading()}</Text>
        <Text className="text-2xl font-bold text-foreground">
          {getTimeGreeting(profile.name)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 20,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* -------------------------------------------------------------- */}
        {/* Check-In card — the primary action on the home screen          */}
        {/* -------------------------------------------------------------- */}
        {!checkInLoading && (
          hasCheckedIn && todayCheckIn ? (
            <CheckedInCard
              todayCheckIn={todayCheckIn}
              onReset={resetCheckIn}
              encouragement={encouragement}
              isDark={isDark}
            />
          ) : promptDismissedToday ? (
            /* Gentle reminder — user dismissed the prompt earlier */
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => router.push('/check-in')}
                activeOpacity={0.8}
                className="bg-primary rounded-2xl py-6 px-6 items-center"
              >
                <Text className="text-primary-foreground font-bold text-lg">
                  Ready when you are
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Text className="text-primary-foreground/70 text-sm">
                    No rush — check in anytime
                  </Text>
                  <ChevronRight size={14} color={iconColors.primaryForeground} />
                </View>
              </TouchableOpacity>
              <LastCommitmentInfo lastCheckIn={lastCheckIn} />
            </View>
          ) : (
            /* First view of the day — bold CTA */
            <View className="gap-2">
              <TouchableOpacity
                onPress={() => router.push('/check-in')}
                activeOpacity={0.8}
                className="bg-primary rounded-2xl py-6 px-6 items-center"
              >
                <Text className="text-primary-foreground font-bold text-lg">
                  Check In
                </Text>
                <Text className="text-primary-foreground/70 text-sm mt-1">
                  Start your day with a commitment
                </Text>
              </TouchableOpacity>
              {/* Show when the last commitment expired, if any */}
              <LastCommitmentInfo lastCheckIn={lastCheckIn} />
            </View>
          )
        )}

        {/* Daily quote */}
        <DailyQuote />

        {/* -------------------------------------------------------------- */}
        {/* Your Tools — collapsed by default, secondary to check-in       */}
        {/* -------------------------------------------------------------- */}
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setToolsExpanded((prev) => !prev)}
            activeOpacity={0.7}
            className="flex-row items-center gap-2"
          >
            {toolsExpanded ? (
              <ChevronDown size={22} color={iconColors.muted} />
            ) : (
              <ChevronRight size={22} color={iconColors.muted} />
            )}
            <Text className="text-lg font-bold text-foreground">Your Tools</Text>
          </TouchableOpacity>

          {toolsExpanded && (
            grouped ? (
              <View className="gap-4">
                {sectionOrder.map((sectionKey) => {
                  if (!secVis[sectionKey]) return null;
                  const section = DASHBOARD_SECTIONS[sectionKey];
                  const moduleIdsInSection = orderedIds.filter((id) =>
                    section.moduleIds.includes(id as keyof AppVisibility)
                  );
                  if (moduleIdsInSection.length === 0) return null;
                  const isCollapsed = sectionsCollapsed[sectionKey];
                  return (
                    <View key={sectionKey} className="gap-2">
                      <TouchableOpacity
                        onPress={() => toggleSection(sectionKey)}
                        activeOpacity={0.7}
                        className="flex-row items-center gap-2 py-1"
                      >
                        {isCollapsed ? (
                          <ChevronRight size={20} color={iconColors.muted} />
                        ) : (
                          <ChevronDown size={20} color={iconColors.muted} />
                        )}
                        <Text className="text-base font-semibold text-muted-foreground">
                          {section.title}
                        </Text>
                      </TouchableOpacity>
                      {!isCollapsed && (
                        <View className="flex-row flex-wrap gap-4">
                          {moduleIdsInSection.map((id) => (
                            <View key={id} className="w-[48%]">
                              {renderCard(id)}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-4">
                {orderedIds.map((id) => (
                  <View key={id} className="w-[48%]">
                    {renderCard(id)}
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Daily commitment prompt — shown on first open of the day */}
      <DailyCommitmentPrompt
        visible={showCommitmentPrompt}
        lastCheckIn={lastCheckIn}
        userName={profile.name || undefined}
        onGoToCheckIn={handlePromptGoToCheckIn}
        onDismiss={handleDismissPrompt}
      />
    </SafeAreaView>
  );
}

// CheckedInCard and LastCommitmentInfo extracted to @/components/CheckedInCard.tsx

const styles = StyleSheet.create({
  cardWithImage: {
    width: '100%',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageDarkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cardBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
