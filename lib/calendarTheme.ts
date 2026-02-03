import { useColorScheme } from 'nativewind';

export function useCalendarTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    monthLabel: isDark ? '#d1d5db' : '#374151',
    chevron: isDark ? '#d1d5db' : '#374151',
    weekday: isDark ? '#9ca3af' : '#6b7280',
  };
}

// Fallback for non-hook usage
export const calendarTheme = {
  monthLabel: '#c4b5fd',
  chevron: '#c4b5fd',
  weekday: '#a78bfa',
};
