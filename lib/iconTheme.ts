import { useColorScheme } from 'nativewind';

export function useIconColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    foreground: isDark ? '#FAFAFF' : '#1E1B24',
    muted: isDark ? '#9C96B4' : '#71717A',
    primary: isDark ? '#A78BFA' : '#8B5CF6',
    primaryForeground: isDark ? '#1E1B24' : '#FFFFFF',
    accent: isDark ? '#DDD6FE' : '#5B21B6',
    success: isDark ? '#34D399' : '#10B981',
    destructive: isDark ? '#F87171' : '#DC2626',
    destructiveForeground: isDark ? '#1E1B24' : '#FFFFFF',
  };
}
