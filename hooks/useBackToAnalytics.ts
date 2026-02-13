import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Returns a callback to navigate back to /analytics when the screen was
 * opened from the analytics drilldown (from=analytics search param).
 * Returns undefined when the screen was opened normally.
 */
export function useBackToAnalytics() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  return params.from === 'analytics'
    ? () => router.replace('/analytics')
    : undefined;
}
