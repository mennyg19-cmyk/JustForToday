import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import {
  CheckCircle,
  Edit2,
  RotateCcw,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { DraggableList, type DraggableItem } from '@/components/DraggableList';
import { SECTIONS, THEME_OPTIONS } from '../constants';
import type { AppVisibility, SectionId } from '@/lib/database/schema';

const cardClass = 'bg-card rounded-xl p-4 border border-border';

interface Props {
  themeMode: string;
  compactView: boolean;
  dashboardGrouped: boolean;
  orderEditMode: boolean;
  iconColors: Record<string, string>;
  switchColors: { trackColor: { false: string; true: string }; thumbColor: string };
  effectiveVisibility: AppVisibility;
  orderedSections: (typeof SECTIONS)[number][];
  orderedSectionIds: SectionId[];
  sectionGroups: Record<SectionId, { title: string; moduleIds: (keyof AppVisibility)[] }>;
  sectionVisibility: Record<string, boolean>;
  dashboardOrder: string[];
  onThemeSelect: (mode: (typeof THEME_OPTIONS)[number]['mode']) => void;
  onToggleCompactView: (value: boolean) => void;
  onDashboardGroupedChange: (value: boolean) => void;
  onSetOrderEditMode: (value: boolean) => void;
  onToggleVisibility: (id: keyof AppVisibility) => void;
  onSectionVisibilityChange: (id: SectionId, value: boolean) => void;
  onDashboardReorder: (order: string[]) => void;
  onSectionOrderReorder: (order: string[]) => void;
  onSectionModulesReorder: (sectionId: SectionId, order: string[]) => void;
  onOpenModuleSettings: (moduleId: (typeof SECTIONS)[number]['id'], label: string) => void;
  onResetDefaults: () => void;
}

export function AppearanceSection({
  themeMode,
  compactView,
  dashboardGrouped,
  orderEditMode,
  iconColors,
  switchColors,
  effectiveVisibility,
  orderedSections,
  orderedSectionIds,
  sectionGroups,
  sectionVisibility,
  dashboardOrder,
  onThemeSelect,
  onToggleCompactView,
  onDashboardGroupedChange,
  onSetOrderEditMode,
  onToggleVisibility,
  onSectionVisibilityChange,
  onDashboardReorder,
  onSectionOrderReorder,
  onSectionModulesReorder,
  onOpenModuleSettings,
  onResetDefaults,
}: Props) {
  const sectionById = new Map(SECTIONS.map((s) => [s.id, s]));

  return (
    <CollapsibleSection
      title="Appearance"
      subtitle="Theme, dashboard layout, display options"
      icon={<SettingsIcon size={20} color={iconColors.primary} />}
    >
      <View className="gap-4">
        <View className="flex-row items-center justify-end">
          <TouchableOpacity
            onPress={onResetDefaults}
            activeOpacity={0.7}
            className="flex-row items-center gap-1.5 bg-muted rounded-xl px-3 py-2"
          >
            <RotateCcw size={14} color={iconColors.muted} />
            <Text className="text-muted-foreground text-sm font-semibold">Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Theme */}
        <View>
          <Text className="text-sm text-muted-foreground mb-2">Theme</Text>
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
                    <Icon size={20} color={isSelected ? iconColors.primary : iconColors.muted} />
                    <Text className={`font-semibold flex-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </Text>
                    {isSelected && <CheckCircle size={20} color={iconColors.primary} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dashboard display */}
        <View>
          <Text className="text-sm text-muted-foreground mb-2">Dashboard</Text>
          <View className={`${cardClass} gap-3`}>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">Compact cards</Text>
              <Switch value={compactView} onValueChange={onToggleCompactView} {...switchColors} />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">Group by section</Text>
              <Switch value={dashboardGrouped} onValueChange={onDashboardGroupedChange} {...switchColors} />
            </View>
          </View>
        </View>

        {/* Visible Sections */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted-foreground">Visible Sections</Text>
            {orderedSections.length > 1 && (
              <TouchableOpacity
                onPress={() => onSetOrderEditMode(!orderEditMode)}
                className={`rounded-full px-3 py-1.5 flex-row items-center gap-2 ${
                  orderEditMode ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Edit2 size={16} color={orderEditMode ? iconColors.primaryForeground : iconColors.muted} />
                <Text className={`text-sm font-semibold ${orderEditMode ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {orderEditMode ? 'Done' : 'Reorder'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View className={`${cardClass}`}>
            {orderEditMode ? (
              dashboardGrouped ? (
                <View>
                  <Text className="text-muted-foreground text-sm mb-2">Section order</Text>
                  <DraggableList
                    items={orderedSectionIds.map((sectionId) => ({
                      id: sectionId,
                      label: sectionGroups[sectionId].title,
                      data: sectionId,
                    }))}
                    editMode={true}
                    onReorder={onSectionOrderReorder}
                    renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                      const sectionId = item.data as SectionId;
                      const title = sectionGroups[sectionId]?.title ?? sectionId;
                      return (
                        <View
                          className={isDragging
                            ? 'flex-row items-center gap-2 py-3'
                            : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'}
                        >
                          <Text className="text-foreground font-bold text-base">{title}</Text>
                        </View>
                      );
                    }}
                  />
                  {orderedSectionIds.map((sectionId) => {
                    const group = sectionGroups[sectionId];
                    const moduleIdsInOrder = dashboardOrder.filter((id) =>
                      group.moduleIds.includes(id as keyof AppVisibility)
                    );
                    if (moduleIdsInOrder.length === 0) return null;
                    return (
                      <View key={sectionId} className="mt-4">
                        <Text className="text-muted-foreground text-sm mb-2">Order within {group.title}</Text>
                        <DraggableList
                          items={moduleIdsInOrder.map((id) => {
                            const sec = sectionById.get(id as keyof AppVisibility);
                            return { id, label: sec?.label ?? id, data: sec };
                          })}
                          editMode={true}
                          onReorder={(newOrder) => onSectionModulesReorder(sectionId, newOrder)}
                          renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                            const sec = item.data as (typeof SECTIONS)[0];
                            if (!sec) return null;
                            const Icon = sec.icon;
                            return (
                              <View
                                className={isDragging
                                  ? 'flex-row items-center gap-2 py-3'
                                  : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'}
                              >
                                <View className="flex-row items-center gap-3 flex-1">
                                  <Icon size={22} color={iconColors.muted} />
                                  <Text className="text-foreground font-medium">{sec.label}</Text>
                                </View>
                              </View>
                            );
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <DraggableList
                  items={orderedSections.map((s) => ({ id: s.id, label: s.label, data: s }))}
                  editMode={true}
                  onReorder={onDashboardReorder}
                  renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                    const sec = item.data as (typeof SECTIONS)[0];
                    if (!sec) return null;
                    const Icon = sec.icon;
                    return (
                      <View
                        className={isDragging
                          ? 'flex-row items-center gap-2 py-3'
                          : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'}
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <Icon size={22} color={iconColors.muted} />
                          <Text className="text-foreground font-medium">{sec.label}</Text>
                        </View>
                      </View>
                    );
                  }}
                />
              )
            ) : dashboardGrouped ? (
              orderedSectionIds.map((sectionId) => {
                const group = sectionGroups[sectionId];
                const sectionOn = sectionVisibility[sectionId];
                const moduleIds = group.moduleIds.filter((id) => orderedSections.some((s) => s.id === id));
                if (moduleIds.length === 0) return null;
                return (
                  <View key={sectionId} className="mb-4 rounded-xl border border-border overflow-hidden bg-card">
                    <View className="flex-row items-center justify-between py-2.5 px-3 bg-muted/60 border-b border-border">
                      <Text className="text-foreground font-bold text-base">{group.title}</Text>
                      <Switch
                        value={sectionOn}
                        onValueChange={(v) => onSectionVisibilityChange(sectionId, v)}
                        {...switchColors}
                      />
                    </View>
                    {sectionOn && (
                      <View className="px-2">
                        {moduleIds.map((id) => {
                          const sec = sectionById.get(id);
                          if (!sec) return null;
                          const visible = effectiveVisibility[sec.id];
                          const Icon = sec.icon;
                          return (
                            <View key={id} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
                              <View className="flex-row items-center gap-3 flex-1">
                                <Icon size={22} color={iconColors.muted} />
                                <Text className="text-foreground font-medium">{sec.label}</Text>
                              </View>
                              <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                  onPress={() => onOpenModuleSettings(sec.id, sec.label)}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                  className="p-1"
                                >
                                  <SettingsIcon size={20} color={iconColors.muted} />
                                </TouchableOpacity>
                                <Switch value={visible} onValueChange={() => onToggleVisibility(sec.id)} {...switchColors} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View className="pl-0">
                {orderedSections.map((sec) => {
                  const visible = effectiveVisibility[sec.id];
                  const Icon = sec.icon;
                  return (
                    <View key={sec.id} className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0">
                      <View className="flex-row items-center gap-3 flex-1">
                        <Icon size={22} color={iconColors.muted} />
                        <Text className="text-foreground font-medium">{sec.label}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity
                          onPress={() => onOpenModuleSettings(sec.id, sec.label)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          className="p-1"
                        >
                          <SettingsIcon size={20} color={iconColors.muted} />
                        </TouchableOpacity>
                        <Switch value={visible} onValueChange={() => onToggleVisibility(sec.id)} {...switchColors} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    </CollapsibleSection>
  );
}
