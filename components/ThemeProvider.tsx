import React, { useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { View, useColorScheme as useNativeColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme';
import { getThemeMode, ThemeMode } from '@/lib/settings';
import { ThemeStyleProvider } from '@/lib/ThemeContext';
import { logger } from '@/lib/logger';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { setColorScheme } = useColorScheme();
  const systemColorScheme = useNativeColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await getThemeMode();
        setThemeMode(savedMode);

        // Apply theme
        if (savedMode === 'system') {
          setColorScheme(systemColorScheme === 'dark' ? 'dark' : 'light');
        } else {
          setColorScheme(savedMode);
        }
        setLoaded(true);
      } catch (err) {
        logger.error('Failed to load theme:', err);
        setLoaded(true);
      }
    };

    loadTheme();
  }, [systemColorScheme, setColorScheme]);

  const activeColorScheme =
    themeMode === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const themeVars = activeColorScheme === 'dark' ? darkTheme : lightTheme;
  const themeContextValue = useMemo(
    () => ({ themeStyle: themeVars, isDark: activeColorScheme === 'dark' }),
    [themeVars, activeColorScheme]
  );

  if (!loaded) {
    // Show a themed empty view while loading to avoid a white flash
    return (
      <View style={themeVars} className={`${activeColorScheme} flex-1 bg-background`} />
    );
  }

  return (
    <ThemeStyleProvider value={themeContextValue}>
      <View style={themeVars} className={`${activeColorScheme} flex-1 bg-background`}>
        {children}
      </View>
    </ThemeStyleProvider>
  );
}
