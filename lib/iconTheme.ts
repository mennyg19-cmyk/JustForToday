import { useColorScheme } from 'nativewind';

/**
 * Hook providing theme-aware icon colors.
 * Brass/amber palette — used throughout the app for icon tinting.
 */
export function useIconColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    foreground: isDark ? '#F0EBE1' : '#241E18',
    muted: isDark ? '#B4AA96' : '#807869',
    primary: isDark ? '#D4B26A' : '#B48C3C',
    primaryForeground: isDark ? '#1E1910' : '#FFFFFF',
    accent: isDark ? '#E6E0C8' : '#64511A',
    success: isDark ? '#8CB86A' : '#6A9A48',   // muted green, not neon
    destructive: isDark ? '#DC5050' : '#C83232',
    destructiveForeground: isDark ? '#1E1910' : '#FFFFFF',
  };
}
