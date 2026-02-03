import { useState, useCallback, useEffect } from 'react';
import type { AppGoals, AppVisibility } from '@/lib/database/schema';
import type { ThemeMode } from '@/lib/settings';
import {
  getAppVisibility,
  saveAppVisibility,
  getThemeMode,
  saveThemeMode,
  getDashboardOrder,
  saveDashboardOrder,
  getGoals,
  saveGoals,
} from '@/lib/settings';
import { clearAllData, exportToICloud, importFromICloud } from '@/lib/dataManagement';
import { SECTIONS } from '../constants';

const DEFAULT_ORDER: (keyof AppVisibility)[] = SECTIONS.map((s) => s.id);

export function useSettings() {
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
  const [goals, setGoals] = useState<AppGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const [vis, mode, order, g] = await Promise.all([
        getAppVisibility(),
        getThemeMode(),
        getDashboardOrder(),
        getGoals(),
      ]);
      setVisibility(vis);
      setThemeMode(mode);
      setDashboardOrder(order?.length ? order : [...DEFAULT_ORDER]);
      setGoals(g);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleVisibility = useCallback(
    async (sectionId: keyof AppVisibility) => {
      if (!visibility) return;
      const updated = { ...visibility, [sectionId]: !visibility[sectionId] };
      setVisibility(updated);
      await saveAppVisibility(updated);
    },
    [visibility]
  );

  const handleThemeChange = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await saveThemeMode(mode);
  }, []);

  const handleDashboardReorder = useCallback(async (newOrder: string[]) => {
    setDashboardOrder(newOrder);
    await saveDashboardOrder(newOrder);
  }, []);

  const handleGoalsChange = useCallback((updates: Partial<AppGoals>) => {
    setGoals((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const persistGoals = useCallback(async () => {
    if (goals) await saveGoals(goals);
  }, [goals]);

  const handleExport = useCallback(async () => {
    await exportToICloud();
  }, []);

  const handleImport = useCallback(async (): Promise<boolean> => {
    return importFromICloud();
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearAllData();
    await fetchSettings();
  }, [fetchSettings]);

  const sectionById = new Map(SECTIONS.map((s) => [s.id, s]));
  const orderedIds =
    dashboardOrder.length > 0
      ? [
          ...dashboardOrder.filter((id) => sectionById.has(id as keyof AppVisibility)),
          ...SECTIONS.filter((s) => !dashboardOrder.includes(s.id)).map((s) => s.id),
        ]
      : DEFAULT_ORDER;
  const orderedSections = orderedIds
    .map((id) => sectionById.get(id as keyof AppVisibility))
    .filter(Boolean) as typeof SECTIONS;

  return {
    visibility,
    themeMode,
    dashboardOrder: orderedIds,
    goals,
    loading,
    error,
    fetchSettings,
    handleToggleVisibility,
    handleThemeChange,
    handleDashboardReorder,
    handleGoalsChange,
    persistGoals,
    handleExport,
    handleImport,
    handleClearAll,
    orderedSections,
  };
}
