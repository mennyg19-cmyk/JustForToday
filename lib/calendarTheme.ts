import { useColorScheme } from 'nativewind';

/**
 * Calendar color theme — warm brass/amber tones.
 * Used by calendar components across habits, sobriety, etc.
 */
export function useCalendarTheme() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    monthLabel: isDark ? '#E6DCC8' : '#4A3E28',
    chevron: isDark ? '#D4B26A' : '#B48C3C',
    weekday: isDark ? '#B4AA96' : '#807869',
  };
}

// Fallback for non-hook usage (defaults to dark mode brass tones)
export const calendarTheme = {
  monthLabel: '#D4B26A',
  chevron: '#D4B26A',
  weekday: '#B4AA96',
};
