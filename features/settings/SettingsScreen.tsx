/**
 * SettingsScreen — orchestrates all settings sections and modals.
 *
 * State and handlers live here. UI rendering is delegated to:
 *   - ProfileSection, AppearanceSection, DataSection, AboutSection
 *   - SettingsModals (all 8 modals in one file)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import { useSettings } from './hooks/useSettings';
import { SECTIONS, THEME_OPTIONS, DEFAULT_GOALS } from './constants';
import type { TrustedContact } from '@/lib/database/schema';
import { getUserProfile, saveUserProfile, type UserProfile } from '@/lib/settings/database';
import { getCompactViewMode, setCompactViewMode } from '@/lib/settings/database';
import {
  getCloudSyncEnabled,
  setCloudSyncEnabled,
  getSafFolderUri,
} from '@/lib/settings/database';
import { enableSync, disableSync, forceSync } from '@/lib/sync';
import { getLastSyncTimestamp } from '@/lib/sync/cloudProvider';
import { useContacts } from '@/features/hardMoment/hooks/useContacts';
import {
  getReadings,
  toggleReadingVisibility,
  addReadingFromPicker,
  removeReading,
  type GroundingReading,
} from '@/lib/groundingReadings';
import { exportToFile } from '@/lib/dataManagement';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { getPrivacyLockEnabled, setPrivacyLockEnabled } from '@/lib/settings/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/lib/logger';

import { ProfileSection } from './components/ProfileSection';
import { AppearanceSection } from './components/AppearanceSection';
import { DataSection } from './components/DataSection';
import { AboutSection } from './components/AboutSection';
import { SettingsModals } from './components/SettingsModals';

const THOUGHTS_KEY = 'lifetrack_hard_moment_thoughts';

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

  // UI state
  const [orderEditMode, setOrderEditMode] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmResetDefaults, setConfirmResetDefaults] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [moduleSettingsModal, setModuleSettingsModal] = useState<{
    moduleId: (typeof SECTIONS)[number]['id'];
    label: string;
  } | null>(null);
  const [resetTrackingMessage, setResetTrackingMessage] = useState(false);

  // Profile
  const [profile, setProfile] = useState<UserProfile>({ name: '', birthday: '' });
  const [profileSaved, setProfileSaved] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Dashboard
  const [compactView, setCompactViewState] = useState(true);
  const [backupMode, setBackupMode] = useState<'manual' | 'auto'>('manual');

  // Cloud sync
  const [cloudSyncOn, setCloudSyncOn] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [safFolder, setSafFolder] = useState<string | null>(null);

  // Contacts
  const { contacts, canAddMore, addContact, removeContact, refresh: refreshContacts } = useContacts();
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [pendingContact, setPendingContact] = useState<{ name: string; phone: string } | null>(null);

  useEffect(() => {
    if (!pendingContact || showLabelModal) return;
    const timer = setTimeout(() => setShowLabelModal(true), 500);
    return () => clearTimeout(timer);
  }, [pendingContact, showLabelModal]);

  // Privacy
  const privacyLock = usePrivacyLock();
  const [privacyLockOn, setPrivacyLockOn] = useState(false);
  const [showThoughtsModal, setShowThoughtsModal] = useState(false);
  const [thoughtsList, setThoughtsList] = useState<Array<{ text: string; date: string }>>([]);

  // Readings
  const [showReadingsModal, setShowReadingsModal] = useState(false);
  const [readingsList, setReadingsList] = useState<GroundingReading[]>([]);
  const [showAddReadingForm, setShowAddReadingForm] = useState(false);
  const [newReadingTitle, setNewReadingTitle] = useState('');
  const [newReadingSubtitle, setNewReadingSubtitle] = useState('');

  // Story
  const [showStoryModal, setShowStoryModal] = useState(false);

  const switchColors = useMemo(
    () => ({
      trackColor: { false: iconColors.muted, true: iconColors.primary },
      thumbColor: iconColors.primaryForeground,
    }),
    [iconColors]
  );

  // ---- Data loading ----

  const loadReadings = useCallback(async () => {
    const list = await getReadings();
    setReadingsList(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
      getUserProfile().then(setProfile).catch(() => {});
      getCompactViewMode().then(setCompactViewState).catch(() => {});
      loadReadings();
      refreshContacts();
      getCloudSyncEnabled().then((on) => {
        setCloudSyncOn(on);
        if (on) setBackupMode('auto');
      }).catch(() => {});
      getLastSyncTimestamp().then(setLastSyncTime).catch(() => {});
      if (Platform.OS === 'android') {
        getSafFolderUri().then(setSafFolder).catch(() => {});
      }
      getPrivacyLockEnabled().then(setPrivacyLockOn).catch(() => {});
    }, [fetchSettings, loadReadings, refreshContacts])
  );

  // ---- Profile handlers ----

  const handleSaveProfile = useCallback(async () => {
    await saveUserProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, [profile]);

  const updateProfileField = useCallback((field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleToggleCompactView = useCallback(async (value: boolean) => {
    setCompactViewState(value);
    await setCompactViewMode(value);
  }, []);

  // ---- Theme handler ----

  const onThemeSelect = useCallback(
    async (mode: (typeof THEME_OPTIONS)[number]['mode']) => {
      await handleThemeChange(mode);
      setColorScheme(mode);
    },
    [handleThemeChange, setColorScheme]
  );

  // ---- Cloud sync handlers ----

  const handleToggleCloudSync = useCallback(async (value: boolean) => {
    setCloudSyncOn(value);
    await setCloudSyncEnabled(value);
    if (value) {
      await enableSync();
      setActionMessage({ type: 'success', text: 'Cloud sync enabled' });
    } else {
      disableSync();
      setActionMessage({ type: 'success', text: 'Cloud sync disabled' });
    }
  }, []);

  const handleSyncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await forceSync();
      const ts = await getLastSyncTimestamp();
      setLastSyncTime(ts);
      setActionMessage({ type: 'success', text: 'Sync completed' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleChooseSafFolder = useCallback(async () => {
    try {
      const { requestSyncFolder } = await import('@/lib/sync/androidSaf');
      const uri = await requestSyncFolder();
      if (uri) {
        setSafFolder(uri);
        setActionMessage({ type: 'success', text: 'Sync folder selected' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to select folder';
      setActionMessage({ type: 'error', text: msg });
    }
  }, []);

  // ---- Export / Import / Clear handlers ----

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
        text: updated ? 'Data restored successfully. Restart the app to see changes.' : 'No file selected.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleImport]);

  const onClearBackupFirst = useCallback(async () => {
    setConfirmClear(false);
    try {
      await exportToFile();
      await handleClearAll();
      setActionMessage({ type: 'success', text: 'Backup saved, all data cleared. Restart the app.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Backup or clear failed';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleClearAll]);

  const onClearConfirm = useCallback(async () => {
    setConfirmClear(false);
    try {
      await handleClearAll();
      setActionMessage({ type: 'success', text: 'All data cleared. Restart the app.' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear data';
      setActionMessage({ type: 'error', text: msg });
    }
  }, [handleClearAll]);

  // ---- Contacts handlers ----

  const handleAddContact = useCallback(async () => {
    try {
      const Contacts = await import('expo-contacts');
      if (Platform.OS !== 'ios') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Contacts access needed', 'Allow access in Settings to add a trusted contact.');
          return;
        }
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
    } catch (err) {
      logger.error('Contact picker error:', err);
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
      Alert.alert('Remove contact?', `Remove ${contact.name} from your trusted contacts?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeContact(contact.id) },
      ]);
    },
    [removeContact]
  );

  // ---- Readings handlers ----

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
    } catch {
      Alert.alert('Error', 'Could not add the reading.');
    }
  }, [newReadingTitle, newReadingSubtitle]);

  const handleRemoveReading = useCallback(async (reading: GroundingReading) => {
    Alert.alert('Remove reading?', `Remove "${reading.title}" from your list? The file will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = await removeReading(reading.id);
          setReadingsList(updated);
        },
      },
    ]);
  }, []);

  // ---- Privacy lock handlers ----

  const loadThoughts = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(THOUGHTS_KEY);
      if (raw) {
        setThoughtsList(JSON.parse(raw) as Array<{ text: string; date: string }>);
      } else {
        setThoughtsList([]);
      }
    } catch {
      setThoughtsList([]);
    }
  }, []);

  const deleteThought = useCallback(async (index: number) => {
    try {
      const raw = await AsyncStorage.getItem(THOUGHTS_KEY);
      const list: Array<{ text: string; date: string }> = raw ? JSON.parse(raw) : [];
      list.splice(index, 1);
      await AsyncStorage.setItem(THOUGHTS_KEY, JSON.stringify(list));
      setThoughtsList(list);
    } catch {
      // Best-effort delete
    }
  }, []);

  const handleTogglePrivacyLock = useCallback(async (value: boolean) => {
    if (!value) {
      const success = await privacyLock.authenticate('Authenticate to disable privacy lock');
      if (!success) return;
    } else {
      try {
        const LA = await import('expo-local-authentication');
        const hasHardware = await LA.hasHardwareAsync();
        const isEnrolled = await LA.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert('Device Security Required', 'Please set up Face ID, Touch ID, or a device passcode in your device settings first.');
          return;
        }
      } catch {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
        return;
      }
    }
    setPrivacyLockOn(value);
    await setPrivacyLockEnabled(value);
    await privacyLock.refresh();
  }, [privacyLock]);

  const handleOpenThoughts = useCallback(async () => {
    if (privacyLock.isLocked) {
      const success = await privacyLock.authenticate('Unlock private thoughts');
      if (!success) return;
    }
    await loadThoughts();
    setShowThoughtsModal(true);
  }, [privacyLock, loadThoughts]);

  // ---- Derived state ----

  const effectiveVisibility = visibility ?? {
    habits: true, sobriety: true, daily_renewal: true, fasting: true,
    inventory: true, step10: true, steps: true, workouts: true,
    gratitude: true, stoic: true,
  };
  const effectiveGoals = goals ?? { ...DEFAULT_GOALS };

  // ---- Render ----

  if (loading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Settings" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={iconColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Settings" rightSlot={<ThemeToggle />} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View className="mb-4 rounded-xl p-3 bg-destructive/20 border border-destructive/50">
            <Text className="text-destructive font-semibold">Could not load settings</Text>
            <Text className="text-destructive/90 text-sm mt-1">{error}</Text>
            <TouchableOpacity onPress={() => fetchSettings()} className="mt-2">
              <Text className="text-sm font-medium text-primary">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {actionMessage && (
          <View className={`mb-4 rounded-xl p-3 ${actionMessage.type === 'success' ? 'bg-primary/20' : 'bg-destructive/20'}`}>
            <Text className={actionMessage.type === 'success' ? 'text-primary' : 'text-destructive'}>
              {actionMessage.text}
            </Text>
            <TouchableOpacity onPress={() => setActionMessage(null)} className="mt-1">
              <Text className="text-sm text-muted-foreground">Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <ProfileSection
          profile={profile}
          profileSaved={profileSaved}
          contacts={contacts}
          readingsList={readingsList}
          privacyLockOn={privacyLockOn}
          iconColors={iconColors}
          switchColors={switchColors}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenContacts={() => setShowContactsModal(true)}
          onOpenReadings={() => { loadReadings(); setShowReadingsModal(true); }}
          onOpenAnalytics={() => router.push('/analytics')}
          onOpenThoughts={handleOpenThoughts}
          onTogglePrivacyLock={handleTogglePrivacyLock}
        />

        <AppearanceSection
          themeMode={themeMode}
          compactView={compactView}
          dashboardGrouped={dashboardGrouped}
          orderEditMode={orderEditMode}
          iconColors={iconColors}
          switchColors={switchColors}
          effectiveVisibility={effectiveVisibility}
          orderedSections={orderedSections}
          orderedSectionIds={orderedSectionIds}
          sectionGroups={sectionGroups}
          sectionVisibility={sectionVisibility}
          dashboardOrder={dashboardOrder}
          onThemeSelect={onThemeSelect}
          onToggleCompactView={handleToggleCompactView}
          onDashboardGroupedChange={handleDashboardGroupedChange}
          onSetOrderEditMode={setOrderEditMode}
          onToggleVisibility={handleToggleVisibility}
          onSectionVisibilityChange={handleSectionVisibilityChange}
          onDashboardReorder={handleDashboardReorder}
          onSectionOrderReorder={handleSectionOrderReorder}
          onSectionModulesReorder={handleSectionModulesReorder}
          onOpenModuleSettings={(id, label) => setModuleSettingsModal({ moduleId: id, label })}
          onResetDefaults={() => setConfirmResetDefaults(true)}
        />

        <DataSection
          backupMode={backupMode}
          cloudSyncOn={cloudSyncOn}
          syncing={syncing}
          lastSyncTime={lastSyncTime}
          safFolder={safFolder}
          iconColors={iconColors}
          switchColors={switchColors}
          onSetBackupMode={setBackupMode}
          onExport={onExport}
          onImport={() => setConfirmImport(true)}
          onToggleCloudSync={handleToggleCloudSync}
          onSyncNow={handleSyncNow}
          onChooseSafFolder={handleChooseSafFolder}
          onClearAll={() => setConfirmClear(true)}
        />

        <AboutSection
          iconColors={iconColors}
          onOpenStory={() => setShowStoryModal(true)}
        />
      </ScrollView>

      <SettingsModals
        iconColors={iconColors}
        switchColors={switchColors}
        moduleSettingsModal={moduleSettingsModal}
        moduleSettings={moduleSettings}
        effectiveGoals={effectiveGoals}
        resetTrackingMessage={resetTrackingMessage}
        onCloseModuleSettings={() => { setModuleSettingsModal(null); setResetTrackingMessage(false); }}
        onResetModuleTrackingStartDate={handleResetModuleTrackingStartDate}
        onSetResetTrackingMessage={setResetTrackingMessage}
        onGoalsChange={handleGoalsChange}
        onPersistGoals={persistGoals}
        onSetModuleCountInScore={handleSetModuleCountInScore}
        confirmImport={confirmImport}
        onCloseImport={() => setConfirmImport(false)}
        onConfirmImport={onImportConfirm}
        confirmClear={confirmClear}
        onCloseClear={() => setConfirmClear(false)}
        onClearBackupFirst={onClearBackupFirst}
        onClearConfirm={onClearConfirm}
        confirmResetDefaults={confirmResetDefaults}
        onCloseResetDefaults={() => setConfirmResetDefaults(false)}
        onConfirmResetDefaults={async () => {
          setConfirmResetDefaults(false);
          await handleResetDefaults();
          setCompactViewState(true);
          setColorScheme('dark');
          setActionMessage({ type: 'success', text: 'Display settings reset to defaults' });
        }}
        showContactsModal={showContactsModal}
        contacts={contacts}
        canAddMore={canAddMore}
        onCloseContacts={() => setShowContactsModal(false)}
        onAddContact={handleAddContact}
        onRemoveContact={handleRemoveContact}
        showLabelModal={showLabelModal}
        pendingContactName={pendingContact?.name ?? ''}
        onCloseLabelModal={() => { setShowLabelModal(false); setPendingContact(null); }}
        onSaveWithLabel={handleSaveWithLabel}
        showReadingsModal={showReadingsModal}
        readingsList={readingsList}
        showAddReadingForm={showAddReadingForm}
        newReadingTitle={newReadingTitle}
        newReadingSubtitle={newReadingSubtitle}
        onCloseReadings={() => { setShowReadingsModal(false); setShowAddReadingForm(false); }}
        onToggleReadingVisibility={handleToggleReadingVisibility}
        onOpenReading={(readingId) => {
          setShowReadingsModal(false);
          setTimeout(() => router.push(`/reader?readingId=${encodeURIComponent(readingId)}`), 300);
        }}
        onRemoveReading={handleRemoveReading}
        onSetShowAddReadingForm={setShowAddReadingForm}
        onSetNewReadingTitle={setNewReadingTitle}
        onSetNewReadingSubtitle={setNewReadingSubtitle}
        onAddReading={handleAddReading}
        showProfileModal={showProfileModal}
        profile={profile}
        onCloseProfile={() => setShowProfileModal(false)}
        onUpdateProfileField={updateProfileField}
        onSaveProfile={async () => { await handleSaveProfile(); setShowProfileModal(false); }}
        showStoryModal={showStoryModal}
        onCloseStory={() => setShowStoryModal(false)}
        showThoughtsModal={showThoughtsModal}
        thoughtsList={thoughtsList}
        onCloseThoughts={() => setShowThoughtsModal(false)}
        onDeleteThought={deleteThought}
      />
    </SafeAreaView>
  );
}
