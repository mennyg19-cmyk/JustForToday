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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Check } from 'lucide-react-native';
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
import type { AppVisibility, SectionVisibility, ModuleId, ModuleSettingsMap, DailyCheckIn } from '@/lib/database/schema';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { getCardConfigs, CARD_IMAGES } from '@/lib/cardConfigs';
import { DailyQuote } from '@/components/DailyQuote';
import { DEFAULT_DASHBOARD_ORDER, getSectionGroups } from '@/lib/modules';
import type { SectionId } from '@/lib/database/schema';
import { useCheckIn } from '@/features/checkin/hooks/useCheckIn';
import { getEncouragement } from '@/lib/encouragement';
import { commitmentLabel, getCommitmentRemainingMs, commitmentDurationMs } from '@/lib/commitment';
import { getUserProfile, type UserProfile } from '@/lib/settings/database';

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
  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
  const [compactView, setCompactViewState] = useState(true); // default compact
  const [refreshing, setRefreshing] = useState(false);
  // Tools start collapsed — the home screen focuses on today's check-in
  const [toolsExpanded, setToolsExpanded] = useState(false);
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
      console.error('Failed to fetch dashboard:', err);
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

  // Refresh dashboard, check-in, and profile on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      refreshCheckIn();
      getUserProfile().then(setProfile).catch(() => {});
      return () => {};
    }, [fetchDashboard, refreshCheckIn])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), refreshCheckIn()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (error || !dailyProgress || !visibility) {
    return (
      <SafeAreaView className="flex-1 bg-background">
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
    <SafeAreaView className="flex-1 bg-background">
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
              iconColors={iconColors}
              isDark={isDark}
            />
          ) : (
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
                    section.moduleIds.includes(id)
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
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// LastCommitmentInfo — shows how long ago the last commitment expired
// ---------------------------------------------------------------------------

/**
 * Format a time-ago string from milliseconds.
 * e.g. "2 days ago", "5 hours ago", "just now"
 */
function formatTimeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function LastCommitmentInfo({ lastCheckIn }: { lastCheckIn: DailyCheckIn | null }) {
  if (!lastCheckIn) return null;

  // If the last check-in was today, don't show the expiry
  const today = new Date().toISOString().slice(0, 10);
  if (lastCheckIn.date === today) return null;

  // Only show expiry for timed commitments
  if (lastCheckIn.commitmentType === 'none') {
    return (
      <Text className="text-muted-foreground text-xs text-center">
        Last check-in was on {new Date(lastCheckIn.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </Text>
    );
  }

  // Calculate when the commitment expired
  const durationMs = commitmentDurationMs(lastCheckIn.commitmentType);
  if (durationMs == null) return null;

  const startMs = new Date(lastCheckIn.createdAt).getTime();
  const expiredAtMs = startMs + durationMs;
  const agoMs = Date.now() - expiredAtMs;

  if (agoMs <= 0) {
    // Commitment from a previous day is somehow still active — unlikely but handle gracefully
    return null;
  }

  return (
    <Text className="text-muted-foreground text-xs text-center">
      Last {commitmentLabel(lastCheckIn.commitmentType).toLowerCase()} expired {formatTimeAgo(agoMs)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// CheckedInCard — shown when the user has already checked in today
// ---------------------------------------------------------------------------

/** Rotating encouragement messages for when the countdown is active */
const COUNTDOWN_MESSAGES = [
  'You are doing this.',
  'One moment at a time.',
  'You chose this. You can do it.',
  'Stay with it.',
  'This hour is yours.',
  'Keep going — you are stronger than you think.',
  'Right now, you are succeeding.',
];

function getCountdownMessage(): string {
  const idx = Math.floor(Date.now() / 60000) % COUNTDOWN_MESSAGES.length;
  return COUNTDOWN_MESSAGES[idx];
}

/** AsyncStorage key for per-challenge completion states. */
const TODOS_KEY_PREFIX = 'lifetrack_todos_';
/** AsyncStorage key for committed counter names. */
const COMMITTED_KEY_PREFIX = 'lifetrack_committed_';

function CheckedInCard({
  todayCheckIn,
  onReset,
  encouragement,
  iconColors,
  isDark,
}: {
  todayCheckIn: DailyCheckIn;
  onReset: () => void;
  encouragement: string;
  iconColors: ReturnType<typeof useIconColors>;
  isDark: boolean;
}) {
  const hasTimedCommitment = todayCheckIn.commitmentType !== 'none';

  // Live countdown state — ticks every second
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    getCommitmentRemainingMs(todayCheckIn)
  );
  const [countdownMsg, setCountdownMsg] = useState(getCountdownMessage);
  const [confirmReset, setConfirmReset] = useState(false);

  // Per-challenge completion checkboxes
  const todoLines = todayCheckIn.todoText
    ? todayCheckIn.todoText.split('\n').filter(Boolean)
    : [];
  const [todosCompleted, setTodosCompleted] = useState<boolean[]>(() =>
    todoLines.map(() => todayCheckIn.todoCompleted)
  );

  // Committed addiction names
  const [committedNames, setCommittedNames] = useState<string[]>([]);

  // Load per-item completion states + committed names from AsyncStorage
  useEffect(() => {
    const dateKey = todayCheckIn.date;
    AsyncStorage.getItem(TODOS_KEY_PREFIX + dateKey).then((raw) => {
      if (raw) {
        try {
          const arr = JSON.parse(raw) as boolean[];
          setTodosCompleted(todoLines.map((_, i) => arr[i] ?? false));
        } catch {
          setTodosCompleted(todoLines.map(() => todayCheckIn.todoCompleted));
        }
      }
    }).catch(() => {});

    AsyncStorage.getItem(COMMITTED_KEY_PREFIX + dateKey).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Handle both old format (string[]) and new format (object[] with .name)
          const names = parsed.map((item: any) =>
            typeof item === 'string' ? item : item.name
          );
          setCommittedNames(names);
        } catch {}
      }
    }).catch(() => {});
  }, [todayCheckIn.date]);

  const toggleTodoItem = useCallback(async (index: number) => {
    const next = [...todosCompleted];
    next[index] = !next[index];
    setTodosCompleted(next);
    await AsyncStorage.setItem(
      TODOS_KEY_PREFIX + todayCheckIn.date,
      JSON.stringify(next)
    ).catch(() => {});
  }, [todosCompleted, todayCheckIn.date]);

  useEffect(() => {
    if (!hasTimedCommitment) return;

    const tick = () => {
      const ms = getCommitmentRemainingMs(todayCheckIn);
      setRemainingMs(ms);
      setCountdownMsg(getCountdownMessage());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [todayCheckIn, hasTimedCommitment]);

  const commitmentActive = remainingMs != null && remainingMs > 0;

  const formatCountdown = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Accent background color — uses the secondary palette for a distinct card feel
  const cardBg = isDark ? 'rgba(50,42,28,1)' : 'rgba(245,238,220,1)';
  const accentBorder = isDark ? 'rgba(160,125,60,0.4)' : 'rgba(212,178,106,0.5)';
  const accentText = isDark ? '#F0E6C8' : '#64511A';

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: accentBorder }}>
      {/* Main commitment area — distinct accent background */}
      <View style={{ backgroundColor: cardBg, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }} className="gap-3">
        {/* Encouragement text */}
        <Text style={{ color: accentText }} className="text-sm italic text-center">
          {commitmentActive ? countdownMsg : encouragement}
        </Text>

        {/* Commitment label */}
        <View className="flex-row items-center justify-center gap-2">
          <CheckCircle size={18} color={accentText} />
          <Text className="text-foreground font-bold text-base">
            {hasTimedCommitment
              ? commitmentLabel(todayCheckIn.commitmentType)
              : 'Checked in for today'}
          </Text>
        </View>

        {/* Committed addiction names */}
        {committedNames.length > 0 && (
          <View className="items-center">
            <Text className="text-muted-foreground text-xs">
              {committedNames.join(' · ')}
            </Text>
          </View>
        )}

        {/* Live countdown — large, front and center */}
        {hasTimedCommitment && commitmentActive && remainingMs != null && (
          <View className="items-center py-3">
            <Text style={{ color: accentText }} className="font-bold text-4xl tracking-wider">
              {formatCountdown(remainingMs)}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">remaining</Text>
          </View>
        )}

        {/* Commitment expired */}
        {hasTimedCommitment && !commitmentActive && (
          <View className="items-center py-2">
            <Text className="text-muted-foreground text-sm">
              Commitment complete — well done.
            </Text>
          </View>
        )}
      </View>

      {/* Lower area — per-challenge TODOs + actions */}
      <View className="bg-card px-5 pb-4 pt-3 gap-3">
        {/* Per-challenge checkboxes */}
        {todoLines.length > 0 && (
          <View className="gap-2">
            {todoLines.map((line, i) => {
              const done = todosCompleted[i] ?? false;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => toggleTodoItem(i)}
                  activeOpacity={0.7}
                  className="flex-row items-start gap-3 bg-muted rounded-xl p-3"
                >
                  <View
                    className={`w-5 h-5 rounded border mt-0.5 items-center justify-center ${
                      done ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {done && <Check size={12} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text
                    className={`flex-1 text-sm ${
                      done ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}
                  >
                    {line}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Reset commitment */}
        {!confirmReset ? (
          <TouchableOpacity
            onPress={() => setConfirmReset(true)}
            activeOpacity={0.7}
            className="self-center py-1"
          >
            <Text className="text-muted-foreground text-xs">
              Reset and start over
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row items-center justify-center gap-4 py-1">
            <Text className="text-sm text-foreground">Start a new check-in?</Text>
            <TouchableOpacity
              onPress={() => {
                setConfirmReset(false);
                onReset();
              }}
              activeOpacity={0.7}
              className="bg-destructive/20 rounded-lg px-3 py-1.5"
            >
              <Text className="text-destructive text-sm font-semibold">Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmReset(false)}
              activeOpacity={0.7}
              className="bg-muted rounded-lg px-3 py-1.5"
            >
              <Text className="text-muted-foreground text-sm font-semibold">No</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

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
