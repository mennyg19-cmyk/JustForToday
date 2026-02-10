import { useState, useEffect, useCallback } from 'react';
import { sortByOrder } from '@/utils/sorting';
import { logger } from '@/lib/logger';

export interface UseOrderedListResult<T extends { id: string }> {
  items: T[];
  orderedItems: T[];
  reorder: (newOrder: string[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing ordered lists with persistence
 * Automatically sorts items by saved order
 */
export function useOrderedList<T extends { id: string }>(
  fetchItems: () => Promise<T[]>,
  fetchOrder: () => Promise<string[]>,
  saveOrder: (order: string[]) => Promise<void>
): UseOrderedListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedItems, fetchedOrder] = await Promise.all([
        fetchItems(),
        fetchOrder(),
      ]);
      setItems(fetchedItems);
      setOrder(fetchedOrder);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      logger.error('useOrderedList error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, fetchOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reorder = useCallback(
    async (newOrder: string[]) => {
      try {
        // Update local state immediately for responsive UI
        setOrder(newOrder);
        // Persist to database
        await saveOrder(newOrder);
      } catch (err) {
        // Revert on error
        await loadData();
        const errorMessage = err instanceof Error ? err.message : 'Failed to save order';
        setError(errorMessage);
        throw err;
      }
    },
    [saveOrder, loadData]
  );

  // Compute ordered items
  const orderedItems = order.length > 0 ? sortByOrder(items, order) : items;

  return {
    items,
    orderedItems,
    reorder,
    isLoading,
    error,
  };
}
