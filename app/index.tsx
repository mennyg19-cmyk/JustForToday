import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, useFocusEffect } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getDashboardData,
  type DashboardData,
} from '@/lib/dashboard';
import {
  getAppVisibility,
  getDashboardOrder,
  getCompactViewMode,
  setCompactViewMode,
} from '@/lib/settings';
import type { AppVisibility } from '@/lib/database/schema';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { getCardConfigs } from '@/lib/cardConfigs';
import { progressCardGradient } from '@/theme';
import { DailyQuote } from '@/components/DailyQuote';

const defaultOrder = [
  'habits',
  'sobriety',
  'fasting',
  'inventory',
  'steps',
  'gratitude',
  'stoic',
];

function progressPercent(data: DashboardData | null): number {
  if (!data) return 0;
  const habitsTotal = data.habitsTotal || 1;
  const invGoal = data.inventoriesPerDayGoal || 1;
  const stepsGoal = data.stepsGoal || 1;
  const habitsPct = (data.habitsCompleted / habitsTotal) * 100;
  const invPct = (data.inventoryCount / invGoal) * 100;
  const stepsPct = (data.stepsCount / stepsGoal) * 100;
  return Math.round((habitsPct + invPct + stepsPct) / 3);
}

export default function DashboardScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColors = useIconColors();
  const [dailyProgress, setDailyProgress] = useState<DashboardData | null>(null);
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
  const [compactView, setCompactViewState] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [data, vis, order, compact] = await Promise.all([
        getDashboardData(),
        getAppVisibility(),
        getDashboardOrder(),
        getCompactViewMode(),
      ]);
      setDailyProgress(data);
      setVisibility(vis);
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

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      return () => {};
    }, [fetchDashboard])
  );

  const handleToggleCompactView = async () => {
    const newValue = !compactView;
    setCompactViewState(newValue);
    await setCompactViewMode(newValue);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
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
            Unable to Load Dashboard
          </Text>
          <Text className="text-muted-foreground text-center">
            {error || 'Please check your connection and try again'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const cardConfigs = getCardConfigs(dailyProgress);
  const orderedSections = (
    dashboardOrder.length > 0 ? dashboardOrder : defaultOrder
  ).filter((id) => visibility?.[id as keyof AppVisibility]);

  const renderCard = (id: string) => {
    const config = cardConfigs[id as keyof typeof cardConfigs];
    if (!config) return null;

    const IconComponent = config.icon;
    const iconColor = isDark ? iconColors.foreground : config.iconColorLight;
    const badgeColor = isDark ? config.badgeColorDark : config.badgeColorLight;
    const textColor = isDark ? config.textColorDark : config.textColorLight;

    if (compactView) {
      return (
        <Link href={config.href as any} asChild>
          <TouchableOpacity className="w-full">
            <View className="bg-card rounded-xl overflow-hidden border border-border p-3 shadow-card">
              <Text className="text-foreground font-bold text-sm mb-1">
                {config.title}
              </Text>
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
          <View className="bg-card rounded-2xl overflow-hidden border border-border shadow-card-lg">
            <LinearGradient
              colors={isDark ? config.gradientDark : config.gradientLight}
              style={{ height: 100 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-1 items-center justify-center">
                <IconComponent size={40} color={iconColor} />
              </View>
            </LinearGradient>
            <View className="p-4 relative">
              <Text className="text-foreground font-bold text-lg">
                {config.title}
              </Text>
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
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const pct = progressPercent(dailyProgress);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-sm text-muted-foreground">Welcome back,</Text>
          <Text className="text-2xl font-bold text-foreground">
            Your Dashboard
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleToggleCompactView}
            className={`px-3 py-2 rounded-lg ${
              compactView ? 'bg-primary' : 'bg-muted'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                compactView ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {compactView ? 'Full' : 'Compact'}
            </Text>
          </TouchableOpacity>
          <ThemeToggle />
        </View>
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
        <DailyQuote />
        {/* Today's Progress - day at a glance, purple highlight */}
        <LinearGradient
          colors={isDark ? progressCardGradient.dark : progressCardGradient.light}
          style={{ borderRadius: 20, paddingVertical: 20, paddingHorizontal: 24 }}
        >
          <View className="flex-row items-center gap-4">
            <Text className="text-white font-bold text-base shrink-0">
              Today's Progress
            </Text>
            <View className="flex-1 h-3 rounded-full bg-white/30 overflow-hidden">
              <View
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </View>
            <Text className="text-white font-bold text-base shrink-0 w-12 text-right">
              {pct}%
            </Text>
          </View>
        </LinearGradient>

        <View className="gap-4">
          <Text className="text-lg font-bold text-foreground">Your Tools</Text>
          <View className="flex-row flex-wrap gap-4">
            {orderedSections.map((id) => (
              <View key={id} className="w-[48%]">
                {renderCard(id)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
