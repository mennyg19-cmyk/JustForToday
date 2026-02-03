import { useState, useEffect, useCallback, DependencyList } from 'react';

export interface UseAsyncResourceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for async data fetching with loading and error states
 */
export function useAsyncResource<T>(
  fetchFn: () => Promise<T>,
  deps: DependencyList = []
): UseAsyncResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('useAsyncResource error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
