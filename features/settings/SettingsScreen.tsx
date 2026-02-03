import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  CheckCircle,
  Download,
  Upload,
  Trash2,
  Edit2,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButton } from '@/components/ModalContent';
import { DraggableList, type DraggableItem } from '@/components/DraggableList';
import { useIconColors } from '@/lib/iconTheme';
import { useSettings } from './hooks/useSettings';
import { SECTIONS, THEME_OPTIONS, DEFAULT_GOALS } from './constants';

/** Reusable card style for settings rows */
const cardClass = 'bg-card rounded-xl p-4 border border-border';

export function SettingsScreen() {
  const { setColorScheme } = useColorScheme();
  const iconColors = useIconColors();
  const {
    visibility,
    themeMode,
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
  } = useSettings();

  const [orderEditMode, setOrderEditMode] = useState(false);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const switchColors = useMemo(
    () => ({
      trackColor: { false: iconColors.muted, true: iconColors.primary },
      thumbColor: iconColors.primaryForeground,
    }),
    [iconColors]
  );

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [fetchSettings])
  );

  const onThemeSelect = useCallback(
    async (mode: (typeof THEME_OPTIONS)[number]['mode']) => {
      await handleThemeChange(mode);
      setColorScheme(mode === 'system' ? undefined : mode);
    },
    [handleThemeChange, setColorScheme]
  );

  const onExport = useCallback(async () => {
    try {
      await handleExport();
      setActionMessage({ type: 'success', text: 'Data exported to iCloud' });
    } catch {
      setActionMessage({ type: 'error', text: 'Export failed' });
    }
  }, [handleExport]);

  const onImportConfirm = useCallback(async () => {
    setConfirmImport(false);
    try {
      const updated = await handleImport();
      setActionMessage({
        type: 'success',
        text: updated ? 'Data restored from iCloud. Restart the app to see changes.' : 'No newer backup found in iCloud.',
      });
    } catch {
      setActionMessage({ type: 'error', text: 'Import failed' });
    }
  }, [handleImport]);

  const onClearConfirm = useCallback(async () => {
    setConfirmClear(false);
    try {
      await handleClearAll();
      setActionMessage({ type: 'success', text: 'All data cleared' });
    } catch {
      setActionMessage({ type: 'error', text: 'Failed to clear data' });
    }
  }, [handleClearAll]);

  if (loading || !visibility || !goals) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Settings" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Settings" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground font-semibold mb-2">Failed to load</Text>
          <Text className="text-muted-foreground text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Settings" rightSlot={<ThemeToggle />} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
      >
        {/* Message toast */}
        {actionMessage && (
          <View
            className={`mb-4 rounded-xl p-3 ${
              actionMessage.type === 'success' ? 'bg-primary/20' : 'bg-destructive/20'
            }`}
          >
            <Text
              className={
                actionMessage.type === 'success' ? 'text-primary' : 'text-destructive'
              }
            >
              {actionMessage.text}
            </Text>
            <TouchableOpacity
              onPress={() => setActionMessage(null)}
              className="mt-1"
            >
              <Text className="text-sm text-muted-foreground">Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Theme */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-1">Theme</Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Choose your preferred theme
          </Text>
          <View className="gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.mode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  onPress={() => onThemeSelect(option.mode)}
                  activeOpacity={0.7}
                >
                  <View
                    className={`${cardClass} flex-row items-center gap-3 ${
                      isSelected ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <Icon
                      size={20}
                      color={isSelected ? iconColors.primary : iconColors.muted}
                    />
                    <Text
                      className={`font-semibold flex-1 ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <CheckCircle size={20} color={iconColors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Visible Sections */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold text-foreground">Visible Sections</Text>
            {orderedSections.length > 1 && (
              <TouchableOpacity
                onPress={() => setOrderEditMode(!orderEditMode)}
                className={`rounded-full px-3 py-1.5 flex-row items-center gap-2 ${
                  orderEditMode ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Edit2
                  size={16}
                  color={orderEditMode ? iconColors.primaryForeground : iconColors.muted}
                />
                <Text
                  className={`text-sm font-semibold ${
                    orderEditMode ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {orderEditMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-sm text-muted-foreground mb-3">
            Choose which parts of the app to show
          </Text>
          <DraggableList
            items={orderedSections.map((s) => ({
              id: s.id,
              label: s.label,
              data: s,
            }))}
            editMode={orderEditMode}
            onReorder={handleDashboardReorder}
            renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
              const section = item.data as (typeof SECTIONS)[0];
              const visible = visibility[section.id];
              const Icon = section.icon;
              return (
                <TouchableOpacity
                  onPress={() => handleToggleVisibility(section.id)}
                  activeOpacity={0.7}
                  disabled={isDragging}
                >
                  <View
                    className={
                      isDragging ? 'flex-row items-center gap-2' : `${cardClass} flex-row items-center justify-between`
                    }
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Icon size={24} color={iconColors.muted} />
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">
                          {section.label}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {section.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={visible}
                      onValueChange={() => handleToggleVisibility(section.id)}
                      {...switchColors}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Goals */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setGoalsExpanded(!goalsExpanded)}
            activeOpacity={0.7}
            className={`${cardClass} flex-row items-center justify-between`}
          >
            <Text className="text-foreground font-semibold">Goals</Text>
            <Text className="text-foreground text-xl">{goalsExpanded ? '−' : '+'}</Text>
          </TouchableOpacity>
          {goalsExpanded && (
            <View className="gap-3 mt-3">
              <GoalInput
                label="Daily steps goal"
                value={goals.stepsGoal}
                onChange={(v) => handleGoalsChange({ stepsGoal: v })}
                onBlur={persistGoals}
                placeholder={String(DEFAULT_GOALS.stepsGoal)}
                iconColors={iconColors}
              />
              <GoalInput
                label="Daily fasting hours goal"
                value={goals.fastingHoursGoal}
                onChange={(v) => handleGoalsChange({ fastingHoursGoal: v })}
                onBlur={persistGoals}
                placeholder={String(DEFAULT_GOALS.fastingHoursGoal)}
                iconColors={iconColors}
              />
              <GoalInput
                label="Daily Step 10 inventories goal"
                value={goals.inventoriesPerDayGoal}
                onChange={(v) => handleGoalsChange({ inventoriesPerDayGoal: v })}
                onBlur={persistGoals}
                placeholder={String(DEFAULT_GOALS.inventoriesPerDayGoal)}
                iconColors={iconColors}
              />
            </View>
          )}
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Data Management</Text>
          <View className="gap-2">
            <TouchableOpacity
              onPress={onExport}
              activeOpacity={0.7}
              className={`${cardClass} flex-row items-center gap-3`}
            >
              <Download size={24} color={iconColors.primary} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Export to iCloud</Text>
                <Text className="text-xs text-muted-foreground">
                  Backup database to iCloud Drive
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmImport(true)}
              activeOpacity={0.7}
              className={`${cardClass} flex-row items-center gap-3`}
            >
              <Upload size={24} color={iconColors.primary} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Restore from iCloud</Text>
                <Text className="text-xs text-muted-foreground">
                  Replace local data with iCloud backup
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setConfirmClear(true)}
              activeOpacity={0.7}
              className="bg-card rounded-xl p-4 border border-destructive/50 flex-row items-center gap-3"
            >
              <Trash2 size={24} color={iconColors.destructive} />
              <View className="flex-1">
                <Text className="text-destructive font-semibold">Clear All Data</Text>
                <Text className="text-xs text-destructive/80">
                  Permanently delete everything (cannot undo)
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View>
          <Text className="text-lg font-bold text-foreground mb-3">About</Text>
          <View className={`${cardClass}`}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground">App Version</Text>
              <Text className="text-foreground font-semibold">2.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-muted-foreground">Build</Text>
              <Text className="text-foreground font-semibold">Feb 2026</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Import confirmation */}
      <ModalSurface
        visible={confirmImport}
        onRequestClose={() => setConfirmImport(false)}
        contentClassName="p-6"
      >
        <Text className="text-lg font-bold text-foreground mb-2">Restore from iCloud</Text>
        <Text className="text-foreground mb-4">
          This will replace your current data with the backup from iCloud. Continue?
        </Text>
        <View className="gap-3">
          <ModalButton variant="secondary" onPress={() => setConfirmImport(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onPress={onImportConfirm}>
            Restore
          </ModalButton>
        </View>
      </ModalSurface>

      {/* Clear confirmation */}
      <ModalSurface
        visible={confirmClear}
        onRequestClose={() => setConfirmClear(false)}
        contentClassName="p-6"
      >
        <Text className="text-lg font-bold text-foreground mb-2">Clear All Data</Text>
        <Text className="text-foreground mb-4">
          This will permanently delete all your data. This cannot be undone. Continue?
        </Text>
        <View className="gap-3">
          <ModalButton variant="secondary" onPress={() => setConfirmClear(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="destructive" onPress={onClearConfirm}>
            Delete All
          </ModalButton>
        </View>
      </ModalSurface>
    </SafeAreaView>
  );
}

function GoalInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  iconColors,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  onBlur: () => void;
  placeholder: string;
  iconColors: { muted: string };
}) {
  return (
    <View className={`${cardClass}`}>
      <Text className="text-foreground font-semibold mb-2">{label}</Text>
      <TextInput
        className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
        value={value ? String(value) : ''}
        onChangeText={(text) => {
          const n = parseInt(text.replace(/\D/g, ''), 10);
          onChange(Number.isNaN(n) ? 0 : n);
        }}
        onBlur={onBlur}
        keyboardType="number-pad"
        placeholder={placeholder}
        placeholderTextColor={iconColors.muted}
      />
    </View>
  );
}
