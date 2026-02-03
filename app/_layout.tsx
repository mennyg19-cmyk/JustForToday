import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, BarChart3, Settings } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { initializeSync } from '@/lib/sync';
import '@/global.css';

function TabNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Initialize iCloud sync on app start
    initializeSync().catch((err) => {
      console.error('Failed to initialize sync:', err);
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          color: isDark ? '#d1d5db' : '#374151',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* Hidden screens - still accessible via linking */}
      <Tabs.Screen
        name="habits"
        options={{
          href: null,
          title: 'Habits',
        }}
      />
      <Tabs.Screen
        name="sobriety"
        options={{
          href: null,
          title: 'Sobriety',
        }}
      />
      <Tabs.Screen
        name="fasting"
        options={{
          href: null,
          title: 'Fasting',
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          href: null,
          title: 'Inventory',
        }}
      />
      <Tabs.Screen
        name="steps"
        options={{
          href: null,
          title: 'Steps',
        }}
      />
      <Tabs.Screen
        name="gratitude"
        options={{
          href: null,
          title: 'Gratitude',
        }}
      />
      <Tabs.Screen
        name="stoic"
        options={{
          href: null,
          title: 'Stoic',
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <TabNavigator />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
