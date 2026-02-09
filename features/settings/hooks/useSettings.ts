import { useState, useCallback, useEffect } from 'react';
import type {
  AppGoals,
  AppVisibility,
  SectionVisibility,
  ModuleSettingsMap,
  SectionId,
  ModuleId,
} from '@/lib/database/schema';
import type { ThemeMode } from '@/lib/settings';
import {
  getAppVisibility,
  saveAppVisibility,
  getSectionVisibility,
  saveSectionVisibility,
  getModuleSettings,
  saveModuleSettings,
  setModuleTrackingStartDate,
  setModuleCountInScore,
  getThemeMode,
  saveThemeMode,
  getDashboardOrder,
  saveDashboardOrder,
  getDashboardSectionOrder,
  saveDashboardSectionOrder,
  getDashboardGrouped,
  saveDashboardGrouped,
  getGoals,
  saveGoals,
  resetDisplayDefaults,
} from '@/lib/settings';
import { clearAllData, exportToFile, importFromFile } from '@/lib/dataManagement';
import { SECTIONS, SECTION_GROUPS, DEFAULT_GOALS } from '../constants';

const DEFAULT_ORDER: (keyof AppVisibility)[] = SECTIONS.map((s) => s.id);

const DEFAULT_VISIBILITY: AppVisibility = {
  habits: true,
  sobriety: true,
  daily_renewal: true,
  fasting: true,
  inventory: true,
  steps: true,
  workouts: true,
  gratitude: true,
  stoic: true,
};

const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  health: true,
  sobriety: true,
  daily_practice: true,
};

const DEFAULT_SECTION_ORDER: SectionId[] = ['sobriety', 'daily_practice', 'health'];

const SETTINGS_LOAD_TIMEOUT_MS = 8000;

export function useSettings() {
  const [visibility, setVisibility] = useState<AppVisibility | null>(null);
  const [sectionVisibility, setSectionVisibilityState] = useState<SectionVisibility | null>(null);
  const [moduleSettings, setModuleSettingsState] = useState<ModuleSettingsMap | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(DEFAULT_SECTION_ORDER);
  const [dashboardGrouped, setDashboardGroupedState] = useState<boolean>(false);
  const [goals, setGoals] = useState<AppGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Load timed out')), SETTINGS_LOAD_TIMEOUT_MS);
    });
    const fetchPromise = (async () => {
      const [vis, secVis, modSet, mode, order, secOrder, grouped, g] = await Promise.all([
        getAppVisibility(),
        getSectionVisibility(),
        getModuleSettings(),
        getThemeMode(),
        getDashboardOrder(),
        getDashboardSectionOrder(),
        getDashboardGrouped(),
        getGoals(),
      ]);
      return { vis, secVis, modSet, mode, order, secOrder, grouped, g };
    })();
    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      setVisibility(result.vis);
      setSectionVisibilityState(result.secVis);
      setModuleSettingsState(result.modSet);
      setThemeMode(result.mode);
      setDashboardOrder(result.order?.length ? result.order : [...DEFAULT_ORDER]);
      setSectionOrder(
        result.secOrder?.length === 3
          ? (result.secOrder as SectionId[])
          : DEFAULT_SECTION_ORDER
      );
      setDashboardGroupedState(result.grouped ?? false);
      setGoals(result.g);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setVisibility((v) => v ?? DEFAULT_VISIBILITY);
      setSectionVisibilityState((s) => s ?? DEFAULT_SECTION_VISIBILITY);
      setModuleSettingsState((m) => m ?? {});
      setGoals((g) => g ?? { ...DEFAULT_GOALS });
      setDashboardOrder((o) => (o?.length ? o : [...DEFAULT_ORDER]));
      setSectionOrder((s) => (s?.length === 3 ? s : DEFAULT_SECTION_ORDER));
      setDashboardGroupedState((g) => g ?? false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleVisibility = useCallback(
    async (moduleId: keyof AppVisibility) => {
      if (!visibility) return;
      const updated = { ...visibility, [moduleId]: !visibility[moduleId] };
      setVisibility(updated);
      await saveAppVisibility(updated);
    },
    [visibility]
  );

  const handleSectionVisibilityChange = useCallback(
    async (sectionId: SectionId, value: boolean) => {
      if (!sectionVisibility) return;
      const updated = { ...sectionVisibility, [sectionId]: value };
      setSectionVisibilityState(updated);
      await saveSectionVisibility(updated);
    },
    [sectionVisibility]
  );

  const handleResetModuleTrackingStartDate = useCallback(
    async (moduleId: ModuleId) => {
      const today = new Date().toISOString().slice(0, 10);
      setModuleSettingsState((prev) => ({
        ...prev,
        [moduleId]: { ...prev?.[moduleId], trackingStartDate: today },
      }));
      await setModuleTrackingStartDate(moduleId, today);
    },
    []
  );

  const handleSetModuleTrackingStartDate = useCallback(
    async (moduleId: ModuleId, dateKey: string | null) => {
      setModuleSettingsState((prev) => ({
        ...prev,
        [moduleId]: { ...prev?.[moduleId], trackingStartDate: dateKey ?? undefined },
      }));
      await setModuleTrackingStartDate(moduleId, dateKey);
    },
    []
  );

  const handleSetModuleCountInScore = useCallback(
    async (moduleId: ModuleId, countInScore: boolean) => {
      setModuleSettingsState((prev) => ({
        ...prev,
        [moduleId]: { ...prev?.[moduleId], countInScore },
      }));
      await setModuleCountInScore(moduleId, countInScore);
    },
    []
  );

  const handleThemeChange = useCallback(async (mode: ThemeMode) => {
    setThemeMode(mode);
    await saveThemeMode(mode);
  }, []);

  const handleDashboardReorder = useCallback(async (newOrder: string[]) => {
    setDashboardOrder(newOrder);
    await saveDashboardOrder(newOrder);
  }, []);

  const handleDashboardGroupedChange = useCallback(async (grouped: boolean) => {
    setDashboardGroupedState(grouped);
    await saveDashboardGrouped(grouped);
  }, []);

  const handleSectionOrderReorder = useCallback(async (newOrder: string[]) => {
    const valid = newOrder.filter((id): id is SectionId =>
      DEFAULT_SECTION_ORDER.includes(id as SectionId)
    );
    if (valid.length !== 3) return;
    setSectionOrder(valid);
    await saveDashboardSectionOrder(valid);
  }, []);

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

  const handleSectionModulesReorder = useCallback(
    async (sectionId: SectionId, newOrder: string[]) => {
      const sectionIds = sectionOrder.length === 3 ? sectionOrder : DEFAULT_SECTION_ORDER;
      const newFlat = sectionIds.flatMap((sid) =>
        sid === sectionId ? newOrder : orderedIds.filter((id) => SECTION_GROUPS[sid].moduleIds.includes(id as keyof AppVisibility))
      );
      setDashboardOrder(newFlat);
      await saveDashboardOrder(newFlat);
    },
    [sectionOrder, orderedIds]
  );

  const handleGoalsChange = useCallback((updates: Partial<AppGoals>) => {
    setGoals((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const persistGoals = useCallback(async () => {
    if (goals) await saveGoals(goals);
  }, [goals]);

  const handleExport = useCallback(async () => {
    await exportToFile();
  }, []);

  const handleImport = useCallback(async (): Promise<boolean> => {
    return importFromFile();
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearAllData();
    await fetchSettings();
  }, [fetchSettings]);

  /** Reset all display settings (theme, compact, grouped, ordering) to factory defaults. */
  const handleResetDefaults = useCallback(async () => {
    await resetDisplayDefaults();
    await fetchSettings();
  }, [fetchSettings]);

  return {
    visibility,
    sectionVisibility: sectionVisibility ?? DEFAULT_SECTION_VISIBILITY,
    moduleSettings: moduleSettings ?? {},
    themeMode,
    dashboardOrder: orderedIds,
    dashboardGrouped: dashboardGrouped ?? false,
    goals,
    loading,
    error,
    fetchSettings,
    handleToggleVisibility,
    handleSectionVisibilityChange,
    handleResetModuleTrackingStartDate,
    handleSetModuleTrackingStartDate,
    handleSetModuleCountInScore,
    handleThemeChange,
    handleDashboardReorder,
    handleSectionOrderReorder,
    handleSectionModulesReorder,
    handleDashboardGroupedChange,
    handleGoalsChange,
    persistGoals,
    handleExport,
    handleImport,
    handleClearAll,
    handleResetDefaults,
    orderedSections,
    orderedSectionIds:
      sectionOrder.length === 3 ? sectionOrder : DEFAULT_SECTION_ORDER,
    sectionGroups: SECTION_GROUPS,
  };
}
