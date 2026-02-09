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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  CheckCircle,
  Download,
  Upload,
  Trash2,
  Edit2,
  Settings as SettingsIcon,
  BarChart3,
  ChevronRight,
  Save,
  RotateCcw,
  Phone,
  UserPlus,
  X,
  BookOpen,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { DraggableList, type DraggableItem } from '@/components/DraggableList';
import { useIconColors } from '@/lib/iconTheme';
import { useSettings } from './hooks/useSettings';
import { SECTIONS, THEME_OPTIONS, DEFAULT_GOALS } from './constants';
import type { AppVisibility, SectionId, TrustedContact } from '@/lib/database/schema';
import { getUserProfile, saveUserProfile, type UserProfile } from '@/lib/settings/database';
import { getCompactViewMode, setCompactViewMode } from '@/lib/settings/database';
import { useContacts } from '@/features/hardMoment/hooks/useContacts';
import {
  getReadings,
  toggleReadingVisibility,
  addReadingFromPicker,
  removeReading,
  type GroundingReading,
} from '@/lib/groundingReadings';

/** Reusable card style for settings rows */
const cardClass = 'bg-card rounded-xl p-4 border border-border';

export function SettingsScreen() {
  const router = useRouter();
  const { setColorScheme } = useColorScheme();
  const iconColors = useIconColors();
  const {
    visibility,
    sectionVisibility,
    moduleSettings,
    themeMode,
    goals,
    loading,
    error,
    fetchSettings,
    handleToggleVisibility,
    handleSectionVisibilityChange,
    handleResetModuleTrackingStartDate,
    handleSetModuleCountInScore,
    handleThemeChange,
    handleDashboardReorder,
    handleSectionOrderReorder,
    handleSectionModulesReorder,
    handleDashboardGroupedChange,
    dashboardGrouped,
    orderedSectionIds,
    dashboardOrder,
    handleGoalsChange,
    persistGoals,
    handleExport,
    handleImport,
    handleClearAll,
    handleResetDefaults,
    orderedSections,
    sectionGroups,
  } = useSettings();

  const [orderEditMode, setOrderEditMode] = useState(false);
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [moduleSettingsModal, setModuleSettingsModal] = useState<{
    moduleId: (typeof SECTIONS)[number]['id'];
    label: string;
  } | null>(null);
  const [resetTrackingMessage, setResetTrackingMessage] = useState(false);

  // -- Profile state --
  const [profile, setProfile] = useState<UserProfile>({ name: '', birthday: '' });
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // -- Dashboard compact view --
  const [compactView, setCompactViewState] = useState(true);

  // -- Trusted contacts (managed here so they live in the Profile section) --
  const { contacts, canAddMore, addContact, removeContact } = useContacts();
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [pendingContact, setPendingContact] = useState<{ name: string; phone: string } | null>(null);
  const [confirmResetDefaults, setConfirmResetDefaults] = useState(false);

  // -- Story modal --
  const [showStoryModal, setShowStoryModal] = useState(false);

  // -- Grounding Readings --
  const [showReadingsModal, setShowReadingsModal] = useState(false);
  const [readingsList, setReadingsList] = useState<GroundingReading[]>([]);
  const [showAddReadingForm, setShowAddReadingForm] = useState(false);
  const [newReadingTitle, setNewReadingTitle] = useState('');
  const [newReadingSubtitle, setNewReadingSubtitle] = useState('');

  const handleShowStory = useCallback(() => {
    setShowStoryModal(true);
  }, []);

  const loadReadings = useCallback(async () => {
    const list = await getReadings();
    setReadingsList(list);
  }, []);

  const handleToggleReadingVisibility = useCallback(async (id: string) => {
    const updated = await toggleReadingVisibility(id);
    setReadingsList(updated);
  }, []);

  const handleAddReading = useCallback(async () => {
    const title = newReadingTitle.trim();
    if (!title) {
      Alert.alert('Title required', 'Please enter a title for the reading.');
      return;
    }
    try {
      const updated = await addReadingFromPicker(title, newReadingSubtitle.trim());
      if (updated) {
        setReadingsList(updated);
        setNewReadingTitle('');
        setNewReadingSubtitle('');
        setShowAddReadingForm(false);
      }
      // null means user cancelled the picker — do nothing
    } catch {
      Alert.alert('Error', 'Could not add the reading.');
    }
  }, [newReadingTitle, newReadingSubtitle]);

  const handleRemoveReading = useCallback(async (reading: GroundingReading) => {
    Alert.alert(
      'Remove reading?',
      `Remove "${reading.title}" from your list? The file will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updated = await removeReading(reading.id);
            setReadingsList(updated);
          },
        },
      ]
    );
  }, []);

  // -- Label suggestions for trusted contacts --
  const LABEL_SUGGESTIONS = ['Sponsor', 'Friend', 'Family', 'Therapist', 'Other'];

  const handleAddContact = useCallback(async () => {
    try {
      const Contacts = await import('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Contacts access needed', 'Allow access in Settings to add a trusted contact.');
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (!contact) return;
      const phone = contact.phoneNumbers?.[0]?.number;
      if (!phone) {
        Alert.alert('No phone number', 'This contact doesn\u2019t have a phone number.');
        return;
      }
      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Unknown';
      setPendingContact({ name, phone });
      setShowLabelModal(true);
    } catch (err) {
      console.error('Contact picker error:', err);
      Alert.alert('Error', 'Could not open contacts.');
    }
  }, []);

  const handleSaveWithLabel = useCallback(
    async (label: string) => {
      if (!pendingContact) return;
      const contact: TrustedContact = {
        id: `contact_${Date.now()}`,
        name: pendingContact.name,
        label,
        phone: pendingContact.phone,
      };
      await addContact(contact);
      setPendingContact(null);
      setShowLabelModal(false);
    },
    [pendingContact, addContact]
  );

  const handleRemoveContact = useCallback(
    (contact: TrustedContact) => {
      Alert.alert(
        'Remove contact?',
        `Remove ${contact.name} from your trusted contacts?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeContact(contact.id) },
        ]
      );
    },
    [removeContact]
  );

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
      getUserProfile().then(setProfile).catch(() => {});
      getCompactViewMode().then(setCompactViewState).catch(() => {});
      loadReadings();
    }, [fetchSettings, loadReadings])
  );

  /** Save profile and show confirmation. */
  const handleSaveProfile = useCallback(async () => {
    await saveUserProfile(profile);
    setProfileEditing(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, [profile]);

  const updateProfileField = useCallback(
    (field: keyof UserProfile, value: string) => {
      setProfile((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleToggleCompactView = useCallback(async (value: boolean) => {
    setCompactViewState(value);
    await setCompactViewMode(value);
  }, []);

  const onThemeSelect = useCallback(
    async (mode: (typeof THEME_OPTIONS)[number]['mode']) => {
      await handleThemeChange(mode);
      setColorScheme(mode);
    },
    [handleThemeChange, setColorScheme]
  );

  const onExport = useCallback(async () => {
    try {
      await handleExport();
      setActionMessage({ type: 'success', text: 'Backup file created' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleExport]);

  const onImportConfirm = useCallback(async () => {
    setConfirmImport(false);
    try {
      const updated = await handleImport();
      setActionMessage({
        type: 'success',
        text: updated
          ? 'Data restored successfully. Restart the app to see changes.'
          : 'No file selected.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleImport]);

  const onClearConfirm = useCallback(async () => {
    setConfirmClear(false);
    try {
      await handleClearAll();
      setActionMessage({ type: 'success', text: 'All data cleared' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear data';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleClearAll]);

  const effectiveVisibility = visibility ?? {
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
  const effectiveGoals = goals ?? { ...DEFAULT_GOALS };
  const sectionById = new Map(SECTIONS.map((s) => [s.id, s]));

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Settings" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColors.primary} />
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Error / timeout banner */}
        {error && (
          <View className="mb-4 rounded-xl p-3 bg-destructive/20 border border-destructive/50">
            <Text className="text-destructive font-semibold">Could not load settings</Text>
            <Text className="text-destructive/90 text-sm mt-1">{error}</Text>
            <TouchableOpacity onPress={() => fetchSettings()} className="mt-2">
              <Text className="text-sm font-medium text-primary">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

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

        {/* ------------------------------------------------------------ */}
        {/* Profile — name/birthday card with inline edit button          */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-foreground mb-1">Profile</Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Personalized greetings and encouragement
          </Text>
          {profileSaved && (
            <Text className="text-primary text-xs mb-2">Profile saved</Text>
          )}
          <View className={`${cardClass} gap-3`}>
            <View className="gap-1">
              <Text className="text-muted-foreground text-xs font-semibold">Name</Text>
              {profileEditing ? (
                <TextInput
                  value={profile.name}
                  onChangeText={(t) => updateProfileField('name', t)}
                  placeholder="Your first name"
                  placeholderTextColor={iconColors.muted}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                />
              ) : (
                <Text className="text-foreground text-sm py-2">
                  {profile.name || '—'}
                </Text>
              )}
            </View>
            <View className="gap-1">
              <Text className="text-muted-foreground text-xs font-semibold">Birthday</Text>
              {profileEditing ? (
                <TextInput
                  value={profile.birthday}
                  onChangeText={(t) => updateProfileField('birthday', t)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={iconColors.muted}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                  keyboardType="numbers-and-punctuation"
                />
              ) : (
                <Text className="text-foreground text-sm py-2">
                  {profile.birthday || '—'}
                </Text>
              )}
            </View>

            {/* Edit / Save button — inside the card, rounded, with arrow */}
            {!profileEditing ? (
              <TouchableOpacity
                onPress={() => setProfileEditing(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-2 bg-muted rounded-xl py-2.5 mt-1"
              >
                <Text className="text-muted-foreground text-sm font-semibold">Edit</Text>
                <ChevronRight size={16} color={iconColors.muted} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSaveProfile}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-2 bg-primary rounded-xl py-2.5 mt-1"
              >
                <Save size={14} color={iconColors.primaryForeground} />
                <Text className="text-primary-foreground text-sm font-semibold">Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Trusted Contacts — button opens a modal                      */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => setShowContactsModal(true)}
            activeOpacity={0.7}
            className={`${cardClass} flex-row items-center gap-3`}
          >
            <Phone size={24} color={iconColors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Trusted Contacts</Text>
              <Text className="text-xs text-muted-foreground">
                {contacts.length > 0
                  ? `${contacts.length} contact${contacts.length === 1 ? '' : 's'} saved`
                  : 'People you can call during a hard moment'}
              </Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Grounding Readings — manage the reading list                */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => { loadReadings(); setShowReadingsModal(true); }}
            activeOpacity={0.7}
            className={`${cardClass} flex-row items-center gap-3`}
          >
            <BookOpen size={24} color={iconColors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Grounding Readings</Text>
              <Text className="text-xs text-muted-foreground">
                {readingsList.filter((r) => r.visible).length} of {readingsList.length} readings visible
              </Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Analytics — tap-through to the analytics page                */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={() => router.push('/analytics')}
            activeOpacity={0.7}
            className={`${cardClass} flex-row items-center gap-3`}
          >
            <BarChart3 size={24} color={iconColors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Analytics</Text>
              <Text className="text-xs text-muted-foreground">
                View your progress heatmaps and trends
              </Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Appearance — theme + dashboard display options                */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold text-foreground">Appearance</Text>
            <TouchableOpacity
              onPress={() => setConfirmResetDefaults(true)}
              activeOpacity={0.7}
              className="flex-row items-center gap-1.5 bg-muted rounded-xl px-3 py-2"
            >
              <RotateCcw size={14} color={iconColors.muted} />
              <Text className="text-muted-foreground text-sm font-semibold">Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Theme choices */}
          <Text className="text-sm text-muted-foreground mb-3 mt-2">Theme</Text>
          <View className="gap-2 mb-4">
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

          {/* Dashboard display options */}
          <Text className="text-sm text-muted-foreground mb-3">Dashboard</Text>
          <View className={`${cardClass} gap-3`}>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">Compact cards</Text>
              <Switch
                value={compactView}
                onValueChange={handleToggleCompactView}
                {...switchColors}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">Group by section</Text>
              <Switch
                value={dashboardGrouped}
                onValueChange={handleDashboardGroupedChange}
                {...switchColors}
              />
            </View>
          </View>
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Visible Sections — collapsible                               */}
        {/* ------------------------------------------------------------ */}
        <View className={`mb-6 ${cardClass} overflow-hidden`}>
          <TouchableOpacity
            onPress={() => setSectionsExpanded(!sectionsExpanded)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between py-1"
          >
            <View className="flex-1">
              <Text className="text-foreground font-semibold">Visible Sections</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Choose which parts of the app to show
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              {sectionsExpanded && orderedSections.length > 1 && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setOrderEditMode(!orderEditMode);
                  }}
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
              <Text className="text-foreground text-xl w-6 text-center">
                {sectionsExpanded ? '−' : '+'}
              </Text>
            </View>
          </TouchableOpacity>
          {sectionsExpanded && (
            <View className="border-t border-border mt-3 pt-3">
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
                      onReorder={handleSectionOrderReorder}
                      renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                        const sectionId = item.data as SectionId;
                        const title = sectionGroups[sectionId]?.title ?? sectionId;
                        return (
                          <View
                            className={
                              isDragging
                                ? 'flex-row items-center gap-2 py-3'
                                : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'
                            }
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
                          <Text className="text-muted-foreground text-sm mb-2">
                            Order within {group.title}
                          </Text>
                          <DraggableList
                            items={moduleIdsInOrder.map((id) => {
                              const sec = sectionById.get(id as keyof AppVisibility);
                              return {
                                id,
                                label: sec?.label ?? id,
                                data: sec,
                              };
                            })}
                            editMode={true}
                            onReorder={(newOrder) => handleSectionModulesReorder(sectionId, newOrder)}
                            renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                              const sec = item.data as (typeof SECTIONS)[0];
                              if (!sec) return null;
                              const Icon = sec.icon;
                              return (
                                <View
                                  className={
                                    isDragging
                                      ? 'flex-row items-center gap-2 py-3'
                                      : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'
                                  }
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
                    onReorder={handleDashboardReorder}
                    renderItem={(item: DraggableItem, _index: number, isDragging: boolean) => {
                      const sec = item.data as (typeof SECTIONS)[0];
                      if (!sec) return null;
                      const Icon = sec.icon;
                      return (
                        <View
                          className={
                            isDragging
                              ? 'flex-row items-center gap-2 py-3'
                              : 'flex-row items-center justify-between py-3 border-b border-border last:border-b-0'
                          }
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
                    <View
                      key={sectionId}
                      className="mb-4 rounded-xl border border-border overflow-hidden bg-card"
                    >
                      <View className="flex-row items-center justify-between py-2.5 px-3 bg-muted/60 border-b border-border">
                        <Text className="text-foreground font-bold text-base">{group.title}</Text>
                        <Switch
                          value={sectionOn}
                          onValueChange={(v) => handleSectionVisibilityChange(sectionId, v)}
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
                              <View
                                key={id}
                                className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0"
                              >
                                <View className="flex-row items-center gap-3 flex-1">
                                  <Icon size={22} color={iconColors.muted} />
                                  <Text className="text-foreground font-medium">{sec.label}</Text>
                                </View>
                                <View className="flex-row items-center gap-2">
                                  <TouchableOpacity
                                    onPress={() => setModuleSettingsModal({ moduleId: sec.id, label: sec.label })}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    className="p-1"
                                  >
                                    <SettingsIcon size={20} color={iconColors.muted} />
                                  </TouchableOpacity>
                                  <Switch
                                    value={visible}
                                    onValueChange={() => handleToggleVisibility(sec.id)}
                                    {...switchColors}
                                  />
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
                      <View
                        key={sec.id}
                        className="flex-row items-center justify-between py-3 border-b border-border last:border-b-0"
                      >
                        <View className="flex-row items-center gap-3 flex-1">
                          <Icon size={22} color={iconColors.muted} />
                          <Text className="text-foreground font-medium">{sec.label}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity
                            onPress={() => setModuleSettingsModal({ moduleId: sec.id, label: sec.label })}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            className="p-1"
                          >
                            <SettingsIcon size={20} color={iconColors.muted} />
                          </TouchableOpacity>
                          <Switch
                            value={visible}
                            onValueChange={() => handleToggleVisibility(sec.id)}
                            {...switchColors}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ------------------------------------------------------------ */}
        {/* Data Management — file-based backup/restore + clear          */}
        {/* ------------------------------------------------------------ */}
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
                <Text className="text-foreground font-semibold">Export Backup</Text>
                <Text className="text-xs text-muted-foreground">
                  Save all your data as a file you can keep anywhere
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
                <Text className="text-foreground font-semibold">Restore from Backup</Text>
                <Text className="text-xs text-muted-foreground">
                  Import a previously exported backup file
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

        {/* ------------------------------------------------------------ */}
        {/* App Info                                                     */}
        {/* ------------------------------------------------------------ */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">App Info</Text>
          
          {/* The Story */}
          <TouchableOpacity
            onPress={handleShowStory}
            activeOpacity={0.7}
            className={`${cardClass} flex-row items-center gap-3 mb-3`}
          >
            <BookOpen size={24} color={iconColors.primary} />
            <View className="flex-1">
              <Text className="text-foreground font-semibold">The Story</Text>
              <Text className="text-xs text-muted-foreground">
                Why this app exists and how it was built
              </Text>
            </View>
            <ChevronRight size={20} color={iconColors.muted} />
          </TouchableOpacity>

          {/* Version and Build Info */}
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

      {/* Module settings modal (goals + tracking start date) */}
      <ModalSurface
        visible={!!moduleSettingsModal}
        onRequestClose={() => {
          setModuleSettingsModal(null);
          setResetTrackingMessage(false);
        }}
        contentClassName="p-5 w-[90%] max-w-sm max-h-[85%]"
      >
        {moduleSettingsModal && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text className="text-lg font-bold text-modal-content-foreground mb-3">
              {moduleSettingsModal.label}
            </Text>
            <View className="flex-row gap-4 mb-3">
              <View className="flex-1 py-2 border border-border rounded-lg px-3">
                <Text className="text-modal-content-foreground text-xs font-semibold mb-1">Tracking start date</Text>
                <Text className="text-modal-content-foreground/80 text-sm mb-2">
                  {moduleSettings[moduleSettingsModal.moduleId]?.trackingStartDate ?? 'Not set'}
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await handleResetModuleTrackingStartDate(moduleSettingsModal.moduleId);
                    setResetTrackingMessage(true);
                  }}
                  className="bg-primary/20 rounded-lg py-2 px-3 self-start"
                >
                  <Text className="text-primary font-medium text-sm">Reset to today</Text>
                </TouchableOpacity>
                {resetTrackingMessage && (
                  <Text className="text-modal-content-foreground/90 text-xs mt-2">
                    Fresh start for {moduleSettingsModal.label}.
                  </Text>
                )}
              </View>
              <View className="flex-1 py-2 border border-border rounded-lg px-3">
                <Text className="text-modal-content-foreground text-xs font-semibold mb-2">Goal</Text>
                {(moduleSettingsModal.moduleId === 'habits' || moduleSettingsModal.moduleId === 'steps' ||
                  moduleSettingsModal.moduleId === 'workouts' || moduleSettingsModal.moduleId === 'fasting' ||
                  moduleSettingsModal.moduleId === 'inventory' || moduleSettingsModal.moduleId === 'gratitude') ? (
                  <>
                    {moduleSettingsModal.moduleId === 'habits' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.habitsGoal ? String(effectiveGoals.habitsGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ habitsGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder="0 = all"
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                    {moduleSettingsModal.moduleId === 'steps' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.stepsGoal ? String(effectiveGoals.stepsGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ stepsGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder={String(DEFAULT_GOALS.stepsGoal)}
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                    {moduleSettingsModal.moduleId === 'workouts' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.workoutsGoal ? String(effectiveGoals.workoutsGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ workoutsGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder={String(DEFAULT_GOALS.workoutsGoal)}
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                    {moduleSettingsModal.moduleId === 'fasting' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.fastingHoursGoal ? String(effectiveGoals.fastingHoursGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ fastingHoursGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder={String(DEFAULT_GOALS.fastingHoursGoal)}
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                    {moduleSettingsModal.moduleId === 'inventory' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.inventoriesPerDayGoal ? String(effectiveGoals.inventoriesPerDayGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ inventoriesPerDayGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder={String(DEFAULT_GOALS.inventoriesPerDayGoal)}
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                    {moduleSettingsModal.moduleId === 'gratitude' && (
                      <TextInput
                        className="bg-background border border-border rounded-lg px-3 py-2 text-modal-content-foreground text-sm"
                        value={effectiveGoals.gratitudesPerDayGoal ? String(effectiveGoals.gratitudesPerDayGoal) : ''}
                        onChangeText={(t) => handleGoalsChange({ gratitudesPerDayGoal: parseInt(t.replace(/\D/g, ''), 10) || 0 })}
                        onBlur={persistGoals}
                        keyboardType="number-pad"
                        placeholder={String(DEFAULT_GOALS.gratitudesPerDayGoal)}
                        placeholderTextColor={iconColors.muted}
                      />
                    )}
                  </>
                ) : (
                  <Text className="text-modal-content-foreground/60 text-sm">—</Text>
                )}
              </View>
            </View>
            <View className="flex-row items-center justify-between py-2 mb-3 border border-border rounded-lg px-3">
              <Text className="text-modal-content-foreground text-sm flex-1">Count in daily score</Text>
              <Switch
                value={moduleSettings[moduleSettingsModal.moduleId]?.countInScore !== false}
                onValueChange={(v) => handleSetModuleCountInScore(moduleSettingsModal.moduleId, v)}
                {...switchColors}
              />
            </View>
            <Text className="text-xs text-muted-foreground mb-3">
              When off, this module stays visible but is not included in your daily progress or analytics score.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModuleSettingsModal(null);
                setResetTrackingMessage(false);
              }}
              className="bg-primary rounded-lg py-2.5"
            >
              <Text className="text-center font-semibold text-primary-foreground">Done</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </ModalSurface>

      {/* Import confirmation */}
      <ModalSurface
        visible={confirmImport}
        onRequestClose={() => setConfirmImport(false)}
        contentClassName="p-6"
      >
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Restore from Backup
        </Text>
        <Text className="text-modal-content-foreground mb-4">
          Select a previously exported backup file. This will replace your current data. Continue?
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={() => setConfirmImport(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onPress={onImportConfirm}>
            Choose File
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Clear confirmation */}
      <ModalSurface
        visible={confirmClear}
        onRequestClose={() => setConfirmClear(false)}
        contentClassName="p-6"
      >
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Clear All Data
        </Text>
        <Text className="text-modal-content-foreground mb-4">
          This will permanently delete all your data. This cannot be undone. Continue?
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={() => setConfirmClear(false)}>
            Cancel
          </ModalButton>
          <ModalButton variant="destructive" onPress={onClearConfirm}>
            Delete All
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Reset defaults confirmation */}
      <ModalSurface
        visible={confirmResetDefaults}
        onRequestClose={() => setConfirmResetDefaults(false)}
        contentClassName="p-6"
      >
        <Text className="text-xl font-bold text-modal-content-foreground mb-2">
          Reset Display Settings
        </Text>
        <Text className="text-modal-content-foreground mb-4">
          This will reset theme, card layout, and ordering to their defaults. Your data will not be affected, but this cannot be undone.
        </Text>
        <ModalButtonRow>
          <ModalButton variant="secondary" onPress={() => setConfirmResetDefaults(false)}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="primary"
            onPress={async () => {
              setConfirmResetDefaults(false);
              await handleResetDefaults();
              setCompactViewState(true);
              setColorScheme('dark');
              setActionMessage({ type: 'success', text: 'Display settings reset to defaults' });
            }}
          >
            Reset
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Trusted contacts modal */}
      <ModalSurface
        visible={showContactsModal}
        onRequestClose={() => setShowContactsModal(false)}
        contentClassName="p-6"
      >
        <Text className="text-lg font-bold text-modal-content-foreground mb-1">
          Trusted Contacts
        </Text>
        <Text className="text-modal-content-foreground/70 text-sm mb-4">
          People you can call during a hard moment. One tap to reach them.
        </Text>

        {contacts.length === 0 && (
          <Text className="text-muted-foreground text-sm mb-4">
            No contacts added yet.
          </Text>
        )}

        <View className="gap-2 mb-4">
          {contacts.map((c) => (
            <View
              key={c.id}
              className="bg-muted rounded-xl p-3 flex-row items-center gap-3"
            >
              <TouchableOpacity
                onPress={() => {
                  const url = `tel:${c.phone.replace(/[^+\d]/g, '')}`;
                  Linking.openURL(url).catch(() => {});
                }}
                className="flex-1 flex-row items-center gap-3"
              >
                <Phone size={18} color={iconColors.primary} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold text-sm">{c.name}</Text>
                  {c.label ? (
                    <Text className="text-muted-foreground text-xs">{c.label}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveContact(c)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={iconColors.muted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {canAddMore && (
          <TouchableOpacity
            onPress={handleAddContact}
            className="bg-muted rounded-xl p-3 flex-row items-center justify-center gap-2 mb-4"
          >
            <UserPlus size={16} color={iconColors.muted} />
            <Text className="text-muted-foreground font-semibold text-sm">
              Add trusted contact
            </Text>
          </TouchableOpacity>
        )}

        <ModalButtonRow>
          <ModalButton variant="primary" onPress={() => setShowContactsModal(false)}>
            Done
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Trusted contact label selection */}
      <ModalSurface
        visible={showLabelModal}
        onRequestClose={() => { setShowLabelModal(false); setPendingContact(null); }}
        contentClassName="p-6"
      >
        <Text className="text-lg font-bold text-modal-content-foreground mb-2">
          How do you know {pendingContact?.name}?
        </Text>
        <Text className="text-modal-content-foreground/70 text-sm mb-4">
          This label is just for you.
        </Text>
        <View className="gap-2 mb-4">
          {LABEL_SUGGESTIONS.map((label) => (
            <TouchableOpacity
              key={label}
              onPress={() => handleSaveWithLabel(label)}
              className="bg-muted rounded-xl py-3 px-4"
            >
              <Text className="text-foreground font-semibold text-center">{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <ModalButtonRow>
          <ModalButton
            variant="secondary"
            onPress={() => { setShowLabelModal(false); setPendingContact(null); }}
          >
            Cancel
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>

      {/* Grounding Readings management modal */}
      <ModalSurface
        visible={showReadingsModal}
        onRequestClose={() => { setShowReadingsModal(false); setShowAddReadingForm(false); }}
        contentClassName="p-6 max-h-[85%]"
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-lg font-bold text-modal-content-foreground mb-1">
            Grounding Readings
          </Text>
          <Text className="text-modal-content-foreground/70 text-sm mb-4">
            Manage your reading list for hard moments. Toggle visibility or add your own PDFs.
          </Text>

          {/* Reading list with visibility toggles */}
          <View className="gap-2 mb-4">
            {readingsList.map((reading) => (
              <View
                key={reading.id}
                className="bg-muted rounded-xl p-3 flex-row items-center gap-3"
              >
                {/* Visibility toggle */}
                <TouchableOpacity
                  onPress={() => handleToggleReadingVisibility(reading.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {reading.visible ? (
                    <Eye size={18} color={iconColors.primary} />
                  ) : (
                    <EyeOff size={18} color={iconColors.muted} />
                  )}
                </TouchableOpacity>

                {/* Title and subtitle */}
                <View className="flex-1">
                  <Text
                    className={`font-semibold text-sm ${
                      reading.visible ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {reading.title}
                  </Text>
                  {reading.subtitle ? (
                    <Text className="text-muted-foreground text-xs">{reading.subtitle}</Text>
                  ) : null}
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    {reading.type === 'local' ? 'Uploaded PDF' : 'Web link'}
                  </Text>
                </View>

                {/* Remove button — only for user-added readings */}
                {!reading.isDefault && (
                  <TouchableOpacity
                    onPress={() => handleRemoveReading(reading)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={16} color={iconColors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Add reading form */}
          {showAddReadingForm ? (
            <View className="gap-3 mb-4 p-3 bg-muted rounded-xl">
              <Text className="text-foreground font-semibold text-sm">Add a PDF</Text>
              <TextInput
                value={newReadingTitle}
                onChangeText={setNewReadingTitle}
                placeholder="Title (required)"
                placeholderTextColor={iconColors.muted}
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              />
              <TextInput
                value={newReadingSubtitle}
                onChangeText={setNewReadingSubtitle}
                placeholder="Subtitle (optional)"
                placeholderTextColor={iconColors.muted}
                className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleAddReading}
                  activeOpacity={0.7}
                  className="flex-1 bg-primary rounded-xl py-2.5 items-center"
                >
                  <Text className="text-primary-foreground font-semibold text-sm">
                    Choose PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddReadingForm(false);
                    setNewReadingTitle('');
                    setNewReadingSubtitle('');
                  }}
                  activeOpacity={0.7}
                  className="bg-background border border-border rounded-xl py-2.5 px-4 items-center"
                >
                  <Text className="text-muted-foreground font-semibold text-sm">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddReadingForm(true)}
              className="bg-muted rounded-xl p-3 flex-row items-center justify-center gap-2 mb-4"
            >
              <Plus size={16} color={iconColors.muted} />
              <Text className="text-muted-foreground font-semibold text-sm">
                Upload a PDF
              </Text>
            </TouchableOpacity>
          )}

          <ModalButtonRow>
            <ModalButton
              variant="primary"
              onPress={() => { setShowReadingsModal(false); setShowAddReadingForm(false); }}
            >
              Done
            </ModalButton>
          </ModalButtonRow>
        </ScrollView>
      </ModalSurface>

      {/* Story Modal */}
      <ModalSurface
        visible={showStoryModal}
        onRequestClose={() => setShowStoryModal(false)}
        contentClassName="p-6 w-[90%] max-w-md max-h-[80%]"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold text-modal-content-foreground mb-4">
            Just For Today
          </Text>
          <Text className="text-modal-content-foreground/90 text-base leading-7 mb-4">
            Built by Dan, in and out of recovery since 2014.
          </Text>
          <Text className="text-modal-content-foreground/90 text-base leading-7 mb-4">
            I created this app because existing recovery tools had paywalls and limitations. I needed something honest—a tool that would grow with me, not track me.
          </Text>
          <Text className="text-modal-content-foreground/90 text-base leading-7 mb-4">
            Each feature comes from real advice: my sponsor suggested stoicism, my therapist emphasized "one day at a time," and an old-timer taught me about gratitude.
          </Text>
          <Text className="text-modal-content-foreground/90 text-base leading-7 mb-4">
            This app is about presence, not performance. No nagging notifications. No guilt-inducing streaks. No judgment when you skip a day.
          </Text>
          <Text className="text-modal-content-foreground font-semibold text-base leading-7">
            Just for today. That's enough.
          </Text>
        </ScrollView>
        <ModalButtonRow>
          <ModalButton
            variant="primary"
            onPress={() => setShowStoryModal(false)}
          >
            Close
          </ModalButton>
        </ModalButtonRow>
      </ModalSurface>
    </SafeAreaView>
  );
}
