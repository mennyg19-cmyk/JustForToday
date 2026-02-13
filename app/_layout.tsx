/**
 * Root layout — tab navigator + Hard Moment floating button.
 *
 * The Hard Moment button is rendered above the tab bar and visible on all
 * screens so the user can reach it in any moment of need. It navigates
 * to /hard-moment without disrupting the current screen.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, Animated, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Settings, Heart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useIconColors } from '@/lib/iconTheme';
import { themeColors } from '@/theme';
import { initializeSync } from '@/lib/sync';
import { ensureFirstLaunchInitialized, getOnboardingCompleted } from '@/lib/settings/database';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { logger } from '@/lib/logger';
import '@/global.css';

function TabNavigator() {
  const { colorScheme } = useColorScheme();
  const iconColors = useIconColors();
  const colors = themeColors[colorScheme === 'dark' ? 'dark' : 'light'];

  useEffect(() => {
    initializeSync().catch((err) => {
      logger.error('Failed to initialize sync:', err);
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: iconColors.primary,
        tabBarInactiveTintColor: iconColors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          // Elevated tab bar with subtle shadow
          ...(Platform.OS === 'ios'
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: colorScheme === 'dark' ? 0.15 : 0.06,
                shadowRadius: 12,
              }
            : { elevation: 8 }),
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          color: iconColors.muted,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ href: null, title: 'Analytics' }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* Hidden screens — accessible via linking but not shown in tab bar */}
      <Tabs.Screen
        name="habits"
        options={{ href: null, title: 'Habits' }}
      />
      <Tabs.Screen
        name="sobriety"
        options={{ href: null, title: 'Sobriety' }}
      />
      <Tabs.Screen
        name="daily-renewal"
        options={{ href: null, title: 'Daily Renewal' }}
      />
      <Tabs.Screen
        name="fasting"
        options={{ href: null, title: 'Fasting' }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ href: null, title: 'Step 10' }}
      />
      <Tabs.Screen
        name="step11"
        options={{ href: null, title: 'Step 11' }}
      />
      <Tabs.Screen
        name="steps"
        options={{ href: null, title: 'Steps' }}
      />
      <Tabs.Screen
        name="workouts"
        options={{ href: null, title: 'Workouts' }}
      />
      <Tabs.Screen
        name="gratitude"
        options={{ href: null, title: 'Gratitude' }}
      />
      <Tabs.Screen
        name="stoic"
        options={{ href: null, title: 'Stoic Handbook' }}
      />
      <Tabs.Screen
        name="check-in"
        options={{ href: null, title: 'Check In' }}
      />
      <Tabs.Screen
        name="hard-moment"
        options={{ href: null, title: 'Hard Moment' }}
      />
      <Tabs.Screen
        name="reader"
        options={{ href: null, title: 'Reader' }}
      />
    </Tabs>
  );
}

/**
 * Small floating button above the tab bar for Hard Moment access.
 * Hidden when the user is already on the Hard Moment screen.
 */
function HardMomentFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // Don't show the FAB when already on the hard moment screen
  if (pathname === '/hard-moment') return null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: Math.max(insets.bottom, 16) + 60,
        right: 16,
        zIndex: 100,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        onPress={() => router.push('/hard-moment')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: isDark ? '#3A3020' : '#F5EDD8',
          borderColor: isDark ? '#5A4A30' : '#E0D4B0',
          borderWidth: 1,
          borderRadius: 24,
          paddingHorizontal: 18,
          paddingVertical: 11,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          // Premium shadow
          shadowColor: isDark ? '#000' : '#8A7030',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Heart size={15} color={isDark ? '#D4B26A' : '#B48C3C'} />
        <Text
          style={{
            color: isDark ? '#D4B26A' : '#8A7030',
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 0.3,
          }}
        >
          Hard moment
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Run critical init first — sets module tracking dates, etc.
        await ensureFirstLaunchInitialized();
      } catch (err) {
        logger.error('First launch init failed:', err);
      }
      // Only check onboarding after init completes
      const completed = await getOnboardingCompleted();
      setShowOnboarding(!completed);
    }
    init();
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // Still loading onboarding state — render nothing to avoid flash
  if (showOnboarding === null) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <View style={{ flex: 1 }} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <View style={{ flex: 1 }}>
            <TabNavigator />
            <HardMomentFAB />
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
