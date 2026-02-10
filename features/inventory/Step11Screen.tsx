/**
 * Step11Screen — Morning & Nightly inventories.
 *
 * Extracted from the combined InventoryScreen so Step 11 has its own
 * dedicated route (/step11) separate from Step 10 (/inventory).
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { SavedSection } from './components/SavedSection';
import { DoneCard } from './components/DoneCard';
import { emptyPayload, parseMorningNotes } from './helpers';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors } from '@/lib/iconTheme';
import { isToday } from '@/utils/date';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';
import { useInventory } from './hooks/useInventory';
import { BigBookPassageView } from './components/BigBookPassage';
import { getPassage } from './bigBook';
import type { MorningInventoryData, NightlyInventoryData } from './types';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Tab = 'morning' | 'nightly';

export function Step11Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; tab?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const {
    morningEntries,
    nightlyEntries,
    loading,
    error,
    refresh,
    addEntry,
    updateEntry,
    removeEntry,
  } = useInventory();
  const iconColors = useIconColors();
  const switchColors = useMemo(
    () => ({
      trackColor: { false: iconColors.muted, true: iconColors.primary },
      thumbColor: iconColors.primaryForeground,
    }),
    [iconColors.muted, iconColors.primary, iconColors.primaryForeground]
  );

  const morningEntryToday = useMemo(
    () => morningEntries.find((e) => isToday(e.createdAt)),
    [morningEntries]
  );
  const nightlyEntryToday = useMemo(
    () => nightlyEntries.find((e) => isToday(e.createdAt)),
    [nightlyEntries]
  );

  const initialTab: Tab = params.tab === 'nightly' ? 'nightly' : 'morning';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Expandable Big Book passages
  const [morningPassageExpanded, setMorningPassageExpanded] = useState(false);
  const [nightlyPassageExpanded, setNightlyPassageExpanded] = useState(false);

  // Morning
  const [editingMorning, setEditingMorning] = useState(false);
  const [morningPrayed, setMorningPrayed] = useState(false);
  const [morningPlans, setMorningPlans] = useState('');
  const [morningNotes, setMorningNotes] = useState('');

  // Nightly
  const [editingNightly, setEditingNightly] = useState(false);
  const [nightlySaveForYesterday, setNightlySaveForYesterday] = useState<boolean | null>(null);
  const [nightlyResent, setNightlyResent] = useState<boolean | null>(null);
  const [nightlyResentDetails, setNightlyResentDetails] = useState('');
  const [nightlySelfish, setNightlySelfish] = useState<boolean | null>(null);
  const [nightlySelfishDetails, setNightlySelfishDetails] = useState('');
  const [nightlyDishonest, setNightlyDishonest] = useState<boolean | null>(null);
  const [nightlyDishonestDetails, setNightlyDishonestDetails] = useState('');
  const [nightlyOwingApology, setNightlyOwingApology] = useState<boolean | null>(null);
  const [nightlyOwingApologyDetails, setNightlyOwingApologyDetails] = useState('');
  const [nightlyKeptSecret, setNightlyKeptSecret] = useState<boolean | null>(null);
  const [nightlyKeptSecretDetails, setNightlyKeptSecretDetails] = useState('');
  const [nightlyKindLoving, setNightlyKindLoving] = useState<boolean | null>(null);
  const [nightlyKindLovingDetails, setNightlyKindLovingDetails] = useState('');
  const [nightlyPrayed, setNightlyPrayed] = useState(false);

  // -- Handlers --

  const handleSaveMorning = async () => {
    const hasContent = morningPrayed || morningPlans.trim() || morningNotes.trim();
    if (!hasContent) {
      Alert.alert('Please complete your morning inventory');
      return;
    }
    try {
      const morningData: MorningInventoryData = {
        plans: morningPlans.trim() || undefined,
        askFor: morningNotes.trim() || undefined,
      };
      const noteStr = morningPlans.trim() || morningNotes.trim() ? JSON.stringify(morningData) : undefined;
      if (morningEntryToday && editingMorning) {
        await updateEntry(morningEntryToday.id, { prayed: morningPrayed, notes: noteStr });
        setEditingMorning(false);
      } else {
        await addEntry({
          ...emptyPayload('morning'),
          prayed: morningPrayed,
          notes: noteStr,
        });
      }
      setMorningPrayed(false);
      setMorningPlans('');
      setMorningNotes('');
    } catch (_e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEditMorning = () => {
    if (!morningEntryToday) return;
    const data = parseMorningNotes(morningEntryToday.notes);
    setMorningPrayed(morningEntryToday.prayed);
    setMorningPlans(data.plans ?? '');
    setMorningNotes(data.askFor ?? '');
    setEditingMorning(true);
  };

  const handleSaveNightly = async () => {
    const hasAnswers =
      nightlyResent !== null ||
      nightlySelfish !== null ||
      nightlyDishonest !== null ||
      nightlyOwingApology !== null ||
      nightlyKeptSecret !== null ||
      nightlyKindLoving !== null ||
      nightlyPrayed;
    if (!hasAnswers) {
      Alert.alert('Please complete your nightly inventory');
      return;
    }
    try {
      const nightlyData: NightlyInventoryData = {
        resentful: nightlyResent,
        resentfulDetails: nightlyResentDetails,
        selfish: nightlySelfish,
        selfishDetails: nightlySelfishDetails,
        dishonest: nightlyDishonest,
        dishonestDetails: nightlyDishonestDetails,
        owingApology: nightlyOwingApology,
        owingApologyDetails: nightlyOwingApologyDetails,
        keptSecret: nightlyKeptSecret,
        keptSecretDetails: nightlyKeptSecretDetails,
        kindLoving: nightlyKindLoving,
        kindLovingDetails: nightlyKindLovingDetails,
      };
      if (nightlyEntryToday && editingNightly) {
        await updateEntry(nightlyEntryToday.id, {
          prayed: nightlyPrayed,
          notes: JSON.stringify(nightlyData),
        });
        setEditingNightly(false);
      } else {
        const now = new Date();
        const hour = now.getHours();
        const saveForYesterday = nightlySaveForYesterday ?? (hour < 16);
        const createdAtOverride =
          saveForYesterday
            ? (() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                return d.toISOString();
              })()
            : undefined;
        await addEntry(
          {
            ...emptyPayload('nightly'),
            prayed: nightlyPrayed,
            notes: JSON.stringify(nightlyData),
          },
          createdAtOverride ? { createdAt: createdAtOverride } : undefined
        );
      }
      setNightlyResent(null);
      setNightlyResentDetails('');
      setNightlySelfish(null);
      setNightlySelfishDetails('');
      setNightlyDishonest(null);
      setNightlyDishonestDetails('');
      setNightlyOwingApology(null);
      setNightlyOwingApologyDetails('');
      setNightlyKeptSecret(null);
      setNightlyKeptSecretDetails('');
      setNightlyKindLoving(null);
      setNightlyKindLovingDetails('');
      setNightlyPrayed(false);
    } catch (_e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEditNightly = () => {
    if (!nightlyEntryToday?.notes) return;
    try {
      const data = JSON.parse(nightlyEntryToday.notes) as NightlyInventoryData;
      setNightlyResent(data.resentful ?? null);
      setNightlyResentDetails(data.resentfulDetails ?? '');
      setNightlySelfish(data.selfish ?? null);
      setNightlySelfishDetails(data.selfishDetails ?? '');
      setNightlyDishonest(data.dishonest ?? null);
      setNightlyDishonestDetails(data.dishonestDetails ?? '');
      setNightlyOwingApology(data.owingApology ?? null);
      setNightlyOwingApologyDetails(data.owingApologyDetails ?? '');
      setNightlyKeptSecret(data.keptSecret ?? null);
      setNightlyKeptSecretDetails(data.keptSecretDetails ?? '');
      setNightlyKindLoving(data.kindLoving ?? null);
      setNightlyKindLovingDetails(data.kindLovingDetails ?? '');
      setNightlyPrayed(nightlyEntryToday.prayed);
      setEditingNightly(true);
    } catch {
      setEditingNightly(true);
    }
  };

  const handleDeleteEntry = async (entryId: string, onAfterDelete?: () => void) => {
    try {
      await removeEntry(entryId);
      onAfterDelete?.();
    } catch (_e) {
      Alert.alert('Failed to delete');
    }
  };

  const renderNightlyQuestion = (
    question: string,
    value: boolean | null,
    setValue: (v: boolean | null) => void,
    details: string,
    setDetails: (v: string) => void,
    detailsPlaceholder: string,
    yesIsBad = true
  ) => (
    <ModalSection>
      <ModalLabel>{question}</ModalLabel>
      <View className="flex-row gap-2 mb-2">
        <TouchableOpacity
          onPress={() => setValue(true)}
          className={`flex-1 py-3 rounded-xl border-2 ${value === true ? (yesIsBad ? 'bg-destructive border-destructive' : 'bg-primary border-primary') : 'bg-muted border-border'}`}
        >
          <Text className={`text-center font-semibold ${value === true ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setValue(false)}
          className={`flex-1 py-3 rounded-xl border-2 ${value === false ? (yesIsBad ? 'bg-primary border-primary' : 'bg-destructive border-destructive') : 'bg-muted border-border'}`}
        >
          <Text className={`text-center font-semibold ${value === false ? 'text-primary-foreground' : 'text-muted-foreground'}`}>No</Text>
        </TouchableOpacity>
      </View>
      {value === true && (
        <ModalInput
          value={details}
          onChangeText={setDetails}
          placeholder={detailsPlaceholder}
          multiline
          numberOfLines={3}
        />
      )}
    </ModalSection>
  );

  // -- Loading / error states --

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Step 11" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Step 11" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <View className="flex-row border-b border-border px-6">
        {(['morning', 'nightly'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 items-center border-b-2 ${
              activeTab === tab ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`font-semibold ${
                activeTab === tab ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {tab === 'morning' ? 'Morning' : 'Nightly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="p-6 gap-4">
          {activeTab === 'morning' && (
            <>
              {getPassage('morning') && (
                <BigBookPassageView
                  passage={getPassage('morning')!}
                  collapsed={!morningPassageExpanded}
                  onToggleCollapsed={() => setMorningPassageExpanded((prev) => !prev)}
                />
              )}
              {morningEntryToday && !editingMorning ? (
                <DoneCard
                  title="Morning inventory complete"
                  subtitle="You've completed your morning inventory for today."
                  onEdit={handleEditMorning}
                />
              ) : (
                <>
                  <ModalSection>
                    <View className="flex-row items-center justify-between">
                      <ModalLabel className="mb-0">Did you pray and meditate?</ModalLabel>
                      <Switch value={morningPrayed} onValueChange={setMorningPrayed} {...switchColors} />
                    </View>
                  </ModalSection>
                  <ModalSection>
                    <ModalLabel>Today&apos;s plans</ModalLabel>
                    <ModalInput
                      value={morningPlans}
                      onChangeText={setMorningPlans}
                      placeholder="What do you plan to do today?"
                      multiline
                      numberOfLines={3}
                    />
                  </ModalSection>
                  <ModalSection>
                    <ModalLabel>What will you ask for today?</ModalLabel>
                    <ModalInput
                      value={morningNotes}
                      onChangeText={setMorningNotes}
                      placeholder="Anticipated challenges, prayer requests, etc."
                      multiline
                      numberOfLines={4}
                    />
                  </ModalSection>
                  <ModalButtonRow>
                    <ModalButton onPress={handleSaveMorning} variant="primary">Save Morning</ModalButton>
                    <ModalButton
                      onPress={() => {
                        setMorningPrayed(false);
                        setMorningPlans('');
                        setMorningNotes('');
                        if (editingMorning) setEditingMorning(false);
                      }}
                      variant="secondary"
                    >
                      {editingMorning ? 'Cancel' : 'Clear'}
                    </ModalButton>
                  </ModalButtonRow>
                </>
              )}
              <SavedSection
                title="Saved morning inventories"
                emptyMessage="No saved morning inventories yet."
                hasEntries={morningEntries.length > 0}
                privacyLock={privacyLock}
                iconColors={iconColors}
              >
                {morningEntries.map((entry) => {
                  const data = parseMorningNotes(entry.notes);
                  const preview = [data.plans, data.askFor].filter(Boolean).join(' • ') || (entry.prayed ? 'Prayed' : '—');
                  return (
                    <View key={entry.id} className="p-3 rounded-lg border border-border flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-xs text-muted-foreground mb-1">{new Date(entry.createdAt).toLocaleString()}</Text>
                        <Text className="text-sm text-foreground" numberOfLines={2}>{preview}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteEntry(entry.id, () => { if (morningEntryToday?.id === entry.id) setEditingMorning(false); })}
                        className="p-1"
                      >
                        <Trash2 size={18} color={iconColors.destructive} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </SavedSection>
            </>
          )}

          {activeTab === 'nightly' && (
            <>
              {getPassage('nightly') && (
                <BigBookPassageView
                  passage={getPassage('nightly')!}
                  collapsed={!nightlyPassageExpanded}
                  onToggleCollapsed={() => setNightlyPassageExpanded((prev) => !prev)}
                />
              )}
              {nightlyEntryToday && !editingNightly ? (
                <DoneCard
                  title="Nightly inventory complete"
                  subtitle="You've completed your nightly inventory for today."
                  onEdit={handleEditNightly}
                />
              ) : (
                <>
                  {renderNightlyQuestion('Were we resentful?', nightlyResent, setNightlyResent, nightlyResentDetails, setNightlyResentDetails, 'What or who made us resentful? Why?')}
                  {renderNightlyQuestion('Were we selfish?', nightlySelfish, setNightlySelfish, nightlySelfishDetails, setNightlySelfishDetails, 'In what ways were we selfish?')}
                  {renderNightlyQuestion('Were we dishonest?', nightlyDishonest, setNightlyDishonest, nightlyDishonestDetails, setNightlyDishonestDetails, 'What were we dishonest about?')}
                  {renderNightlyQuestion('Do we owe an apology?', nightlyOwingApology, setNightlyOwingApology, nightlyOwingApologyDetails, setNightlyOwingApologyDetails, 'To whom do we owe an apology and why?')}
                  {renderNightlyQuestion('Did we keep something to ourselves?', nightlyKeptSecret, setNightlyKeptSecret, nightlyKeptSecretDetails, setNightlyKeptSecretDetails, 'What should we have shared? With whom?')}
                  {renderNightlyQuestion('Were we kind and loving?', nightlyKindLoving, setNightlyKindLoving, nightlyKindLovingDetails, setNightlyKindLovingDetails, 'How did we show kindness and love today?', false)}
                  <ModalSection>
                    <View className="flex-row items-center justify-between">
                      <ModalLabel className="mb-0">Did you pray?</ModalLabel>
                      <Switch value={nightlyPrayed} onValueChange={setNightlyPrayed} {...switchColors} />
                    </View>
                  </ModalSection>
                  {!editingNightly && (
                    <ModalSection>
                      <ModalLabel>Save for</ModalLabel>
                      <View className="flex-row gap-3 mt-2">
                        <TouchableOpacity
                          onPress={() => setNightlySaveForYesterday(false)}
                          className={`flex-1 py-2.5 rounded-lg border-2 ${nightlySaveForYesterday === false ? 'border-primary bg-primary/10' : 'border-border bg-muted/50'}`}
                        >
                          <Text className={`text-center font-medium ${nightlySaveForYesterday === false ? 'text-primary' : 'text-muted-foreground'}`}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setNightlySaveForYesterday(true)}
                          className={`flex-1 py-2.5 rounded-lg border-2 ${nightlySaveForYesterday !== false ? 'border-primary bg-primary/10' : 'border-border bg-muted/50'}`}
                        >
                          <Text className={`text-center font-medium ${nightlySaveForYesterday !== false ? 'text-primary' : 'text-muted-foreground'}`}>Yesterday</Text>
                        </TouchableOpacity>
                      </View>
                      <Text className="text-xs text-muted-foreground mt-1.5">
                        Before 4pm we default to Yesterday so last night&apos;s inventory counts for that day.
                      </Text>
                    </ModalSection>
                  )}
                  <ModalButtonRow>
                    <ModalButton onPress={handleSaveNightly} variant="primary">Save Nightly</ModalButton>
                    <ModalButton
                      onPress={() => {
                        if (editingNightly) {
                          setEditingNightly(false);
                        } else {
                          setNightlySaveForYesterday(null);
                          setNightlyResent(null);
                          setNightlyResentDetails('');
                          setNightlySelfish(null);
                          setNightlySelfishDetails('');
                          setNightlyDishonest(null);
                          setNightlyDishonestDetails('');
                          setNightlyOwingApology(null);
                          setNightlyOwingApologyDetails('');
                          setNightlyKeptSecret(null);
                          setNightlyKeptSecretDetails('');
                          setNightlyKindLoving(null);
                          setNightlyKindLovingDetails('');
                          setNightlyPrayed(false);
                        }
                      }}
                      variant="secondary"
                    >
                      {editingNightly ? 'Cancel' : 'Clear'}
                    </ModalButton>
                  </ModalButtonRow>
                </>
              )}
              <SavedSection
                title="Saved nightly inventories"
                emptyMessage="No saved nightly inventories yet."
                hasEntries={nightlyEntries.length > 0}
                privacyLock={privacyLock}
                iconColors={iconColors}
              >
                {nightlyEntries.map((entry) => (
                  <View key={entry.id} className="p-3 rounded-lg border border-border flex-row items-center justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs text-muted-foreground mb-1">{new Date(entry.createdAt).toLocaleString()}</Text>
                      <Text className="text-sm text-foreground">{entry.prayed ? 'Prayed' : '—'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteEntry(entry.id, () => { if (nightlyEntryToday?.id === entry.id) setEditingNightly(false); })}
                      className="p-1"
                    >
                      <Trash2 size={18} color={iconColors.destructive} />
                    </TouchableOpacity>
                  </View>
                ))}
              </SavedSection>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
