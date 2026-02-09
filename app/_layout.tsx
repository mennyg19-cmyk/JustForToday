/**
 * Root layout — tab navigator + Hard Moment floating button.
 *
 * The Hard Moment button is rendered above the tab bar and visible on all
 * screens so the user can reach it in any moment of need. It navigates
 * to /hard-moment without disrupting the current screen.
 */

import { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, Settings, Heart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { initializeSync } from '@/lib/sync';
import { ensureFirstLaunchInitialized, hasCompletedOnboarding } from '@/lib/settings/database';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import '@/global.css';

function TabNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // First launch: set all module tracking start dates to today
    ensureFirstLaunchInitialized().catch((err) => {
      console.error('First launch init failed:', err);
    });
    // Initialize iCloud sync on app start (iOS only)
    initializeSync().catch((err) => {
      console.error('Failed to initialize sync:', err);
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: isDark ? '#D4B26A' : '#B48C3C',
        tabBarInactiveTintColor: isDark ? '#807060' : '#A09080',
        tabBarStyle: {
          backgroundColor: isDark ? '#1A1408' : '#FFFDF7',
          borderTopColor: isDark ? '#41382A' : '#E6DECD',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          color: isDark ? '#C8BEA6' : '#4A3E28',
          fontSize: 12,
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
        options={{ href: null, title: 'Inventory' }}
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

  // Don't show the FAB when already on the hard moment screen
  if (pathname === '/hard-moment') return null;

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 72, // above the tab bar
        right: 20,
        zIndex: 100,
      }}
    >
      <TouchableOpacity
        onPress={() => router.push('/hard-moment')}
        activeOpacity={0.8}
        style={{
          backgroundColor: isDark ? '#3A3020' : '#F5EDD8',
          borderColor: isDark ? '#5A4A30' : '#E0D4B0',
          borderWidth: 1,
          borderRadius: 28,
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          // Subtle shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Heart size={16} color={isDark ? '#D4B26A' : '#B48C3C'} />
        <Text style={{ color: isDark ? '#D4B26A' : '#8A7030', fontSize: 13, fontWeight: '600' }}>
          Hard moment
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if onboarding has been completed on app launch
    hasCompletedOnboarding()
      .then((completed) => setOnboardingComplete(completed))
      .catch((err) => {
        console.error('Failed to check onboarding status:', err);
        setOnboardingComplete(true); // Default to showing app if check fails
      });
  }, []);

  // Loading state while checking onboarding status
  if (onboardingComplete === null) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: '#161410' }} />
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          {!onboardingComplete ? (
            <OnboardingScreen onComplete={() => setOnboardingComplete(true)} />
          ) : (
            <>
              <TabNavigator />
              <HardMomentFAB />
            </>
          )}
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
