import { useState, useCallback, useEffect } from 'react';
import type { SobrietyCounter } from '@/lib/database/schema';
import {
  getSobrietyCounters,
  createSobrietyCounter,
  toggleSobrietyDay,
  updateSobrietyCounter,
  deleteSobrietyCounter,
  saveSobrietyCountersOrder,
  setLastDailyRenewal,
} from '../database';
import { formatDateKey } from '@/utils/date';

export function useSobriety() {
  const [counters, setCounters] = useState<SobrietyCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await getSobrietyCounters();
      setCounters(list);
    } catch (err) {
      console.error('Failed to fetch sobriety counters:', err);
      setError(err instanceof Error ? err.message : 'Failed to load counters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const addCounter = useCallback(
    async (
      displayName: string,
      actualName?: string,
      notes?: string,
      startDateISO?: string
    ) => {
      const created = await createSobrietyCounter(
        displayName.trim(),
        actualName?.trim() || undefined,
        notes?.trim() || undefined,
        startDateISO
      );
      setCounters((prev) => [...prev, created]);
      return created;
    },
    []
  );

  const toggleDay = useCallback(
    async (counterId: string, dateKey: string): Promise<SobrietyCounter> => {
      const updated = await toggleSobrietyDay(counterId, dateKey);
      const newValue = updated.allHistory[dateKey];

      setCounters((prev) =>
        prev.map((c) => (c.id === counterId ? updated : c))
      );

      if (newValue === false) {
        const date = new Date(dateKey + 'T00:00:00');
        const now = new Date();
        const newStart = new Date(date);
        newStart.setHours(
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        );
        const withNewStart = await updateSobrietyCounter(counterId, {
          currentStreakStart: newStart.toISOString(),
        });
        setCounters((prev) =>
          prev.map((c) => (c.id === counterId ? withNewStart : c))
        );
        return withNewStart;
      }
      return updated;
    },
    []
  );

  const updateCounter = useCallback(
    async (
      counterId: string,
      updates: Partial<Pick<SobrietyCounter, 'displayName' | 'actualName' | 'currentStreakStart' | 'notes'>>
    ) => {
      const updated = await updateSobrietyCounter(counterId, updates as any);
      setCounters((prev) =>
        prev.map((c) => (c.id === counterId ? updated : c))
      );
      return updated;
    },
    []
  );

  const resetToNow = useCallback(async (counterId: string) => {
    const updated = await updateSobrietyCounter(counterId, {
      currentStreakStart: new Date().toISOString(),
    });
    setCounters((prev) =>
      prev.map((c) => (c.id === counterId ? updated : c))
    );
    return updated;
  }, []);

  const removeCounter = useCallback(async (counterId: string) => {
    await deleteSobrietyCounter(counterId);
    setCounters((prev) => prev.filter((c) => c.id !== counterId));
  }, []);

  const reorder = useCallback(async (newOrder: string[]) => {
    const orderMap = new Map(newOrder.map((id, i) => [id, i]));
    setCounters((prev) =>
      [...prev].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999))
    );
    await saveSobrietyCountersOrder(newOrder);
  }, []);

  /** Returns time since start (from last relapse or set start date/time). Includes formatted timer string. */
  function calculateTimeSince(startDate: string) {
    const start = new Date(startDate);
    const now = currentTime;
    let diffMs = now.getTime() - start.getTime();
    if (diffMs < 0) diffMs = 0;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    // Y/M/D by date math (so < 1 year => start with months)
    let cur = new Date(start.getTime());
    let years = 0;
    while (true) {
      const next = new Date(cur);
      next.setFullYear(next.getFullYear() + 1);
      if (next > now) break;
      cur = next;
      years++;
    }
    let months = 0;
    while (true) {
      const next = new Date(cur);
      next.setMonth(next.getMonth() + 1);
      if (next > now) break;
      cur = next;
      months++;
    }
    const remainingDays = Math.floor((now.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
    const timePart = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const parts: string[] = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0 || years > 0) parts.push(`${months}m`);
    parts.push(`${remainingDays}d`);
    parts.push(timePart);
    const formattedTimer = parts.join(' ');

    return {
      days,
      hours,
      minutes,
      seconds,
      years,
      months,
      remainingDays,
      formattedTimer,
    };
  }

  const renewDailyCommitment = useCallback(async (counterId: string) => {
    const iso = new Date().toISOString();
    const updated = await setLastDailyRenewal(counterId, iso);
    setCounters((prev) => prev.map((c) => (c.id === counterId ? updated : c)));
    return updated;
  }, []);

  return {
    counters,
    loading,
    error,
    refresh,
    addCounter,
    toggleDay,
    updateCounter,
    resetToNow,
    removeCounter,
    reorder,
    calculateTimeSince,
    currentTime,
    renewDailyCommitment,
  };
}
