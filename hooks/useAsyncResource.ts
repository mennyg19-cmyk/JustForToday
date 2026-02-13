import { useState, useEffect, useCallback, useRef, DependencyList } from 'react';
import { logger } from '@/lib/logger';

export interface UseAsyncResourceResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAsyncResource<T>(
  fetchFn: () => Promise<T>,
  deps: DependencyList = []
): UseAsyncResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fnRef.current();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('useAsyncResource error:', err);
    } finally {
      setLoading(false);
    }
  }, deps);

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
