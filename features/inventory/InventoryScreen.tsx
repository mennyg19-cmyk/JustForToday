import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Copy, HelpCircle, Pencil, Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIconColors } from '@/lib/iconTheme';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';
import { useInventory } from './hooks/useInventory';
import { HelperModal } from './components/HelperModal';
import { BigBookPassageView } from './components/BigBookPassage';
import { getPassage } from './bigBook';
import type { InventoryEntry } from '@/lib/database/schema';
import type { MorningInventoryData, NightlyInventoryData } from './types';
import type { HelperType } from '@/lib/step10Data';
import {
  AFFECTS,
  DEFECTS,
  ASSETS,
  DEFECT_TO_ASSET,
} from '@/lib/step10Data';

type Tab = 'morning' | 'nightly' | 'step10';

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const today = new Date();
  return (
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate()
  );
}

function parseMorningNotes(notes: string | undefined): MorningInventoryData {
  if (!notes?.trim()) return {};
  try {
    const parsed = JSON.parse(notes) as MorningInventoryData;
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    // Legacy: plain string = askFor
  }
  return { askFor: notes };
}

const emptyStep10Payload = (type: Tab): Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  type,
  who: '',
  whatHappened: '',
  affects: [],
  defects: [],
  assets: [],
  seventhStepPrayer: '', // required by schema; only used for step10
  prayed: false,
  amendsNeeded: false,
  amendsTo: '',
  helpWho: '',
  shareWith: '',
  notes: undefined,
});

export function InventoryScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const {
    entries,
    step10Entries,
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

  const [activeTab, setActiveTab] = useState<Tab>('morning');

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

  // Step 10
  const [who, setWho] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [affects, setAffects] = useState<string[]>([]);
  const [defects, setDefects] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [prayed, setPrayed] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [amendsNeeded, setAmendsNeeded] = useState(false);
  const [amendsTo, setAmendsTo] = useState('');
  const [helpWho, setHelpWho] = useState('');
  const [shareWith, setShareWith] = useState('');
  const [notes, setNotes] = useState('');
  const [helperVisible, setHelperVisible] = useState(false);
  const [helperType, setHelperType] = useState<HelperType>('affects');

  const generatedPrayer = useMemo(() => {
    const defectsText = defects.length > 0 ? defects.join(', ') : 'my defects';
    const assetsText = assets.length > 0 ? assets.join(', ') : 'your character assets';
    return [
      "My Creator, I'm now willing that you have all of me, good and bad.",
      '',
      'I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows.',
      '',
      'In particular,',
      '',
      `Please take away my: ${defectsText}`,
      '',
      `and replace them with: ${assetsText}`,
      '',
      'Grant me strength, as I go out from here, to do thy bidding. Amen!',
    ].join('\n');
  }, [defects, assets]);

  const toggleSelection = (value: string, current: string[], setFn: (v: string[]) => void) => {
    if (current.includes(value)) setFn(current.filter((v) => v !== value));
    else setFn([...current, value]);
  };

  const toggleDefect = (defect: string) => {
    if (defects.includes(defect)) {
      setDefects(defects.filter((d) => d !== defect));
      return;
    }
    setDefects([...defects, defect]);
    const mapped = DEFECT_TO_ASSET[defect];
    if (mapped && !assets.includes(mapped)) setAssets([...assets, mapped]);
  };

  const resetStep10Form = () => {
    setWho('');
    setWhatHappened('');
    setAffects([]);
    setDefects([]);
    setAssets([]);
    setPrayed(false);
    setEditingEntryId(null);
    setAmendsNeeded(false);
    setAmendsTo('');
    setHelpWho('');
    setShareWith('');
    setNotes('');
  };

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
      const notes = morningPlans.trim() || morningNotes.trim() ? JSON.stringify(morningData) : undefined;
      if (morningEntryToday && editingMorning) {
        await updateEntry(morningEntryToday.id, { prayed: morningPrayed, notes });
        setEditingMorning(false);
      } else {
        await addEntry({
          ...emptyStep10Payload('morning'),
          prayed: morningPrayed,
          notes,
        });
      }
      setMorningPrayed(false);
      setMorningPlans('');
      setMorningNotes('');
    } catch (e) {
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
        await addEntry({
          ...emptyStep10Payload('nightly'),
          prayed: nightlyPrayed,
          notes: JSON.stringify(nightlyData),
        });
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
    } catch (e) {
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

  const handleSaveStep10 = async () => {
    if (!who.trim()) {
      Alert.alert('Please enter who you are upset at');
      return;
    }
    if (!whatHappened.trim()) {
      Alert.alert('Please enter what happened');
      return;
    }
    try {
      const payload = {
        who: who.trim(),
        whatHappened: whatHappened.trim(),
        affects,
        defects,
        assets,
        seventhStepPrayer: generatedPrayer.trim(),
        prayed,
        amendsNeeded,
        amendsTo: amendsTo.trim(),
        helpWho: helpWho.trim(),
        shareWith: shareWith.trim(),
        notes: notes.trim() || undefined,
      };
      if (editingEntryId) {
        await updateEntry(editingEntryId, payload);
        resetStep10Form();
      } else {
        await addEntry({ ...emptyStep10Payload('step10'), ...payload });
        resetStep10Form();
      }
    } catch (e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = (entry: InventoryEntry) => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setEditingEntryId(entry.id);
    setWho(entry.who);
    setWhatHappened(entry.whatHappened);
    setAffects(entry.affects ?? []);
    setDefects(entry.defects ?? []);
    setAssets(entry.assets ?? []);
    setPrayed(entry.prayed);
    setAmendsNeeded(entry.amendsNeeded);
    setAmendsTo(entry.amendsTo ?? '');
    setHelpWho(entry.helpWho ?? '');
    setShareWith(entry.shareWith ?? '');
    setNotes(entry.notes ?? '');
  };

  const handleDeleteEntry = async (entryId: string, onAfterDelete?: () => void) => {
    try {
      await removeEntry(entryId);
      onAfterDelete?.();
    } catch (e) {
      Alert.alert('Failed to delete');
    }
  };

  const handleCopyToClipboard = async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(successMessage);
    } catch (e) {
      Alert.alert('Copy failed');
    }
  };

  const formatEntryForCopy = (entry: InventoryEntry) =>
    [
      'Step 10 Inventory',
      `Date: ${new Date(entry.createdAt).toLocaleString()}`,
      '',
      `1. Who: ${entry.who}`,
      `2. What happened: ${entry.whatHappened}`,
      `3. Affects: ${(entry.affects ?? []).join(', ') || '—'}`,
      `4. My part (defects): ${(entry.defects ?? []).join(', ') || '—'}`,
      `5. Character assets: ${(entry.assets ?? []).join(', ') || '—'}`,
      `6. Prayed: ${entry.prayed ? 'Yes' : 'No'}`,
      `7. Amends needed: ${entry.amendsNeeded ? 'Yes' : 'No'}`,
      `   Amends to: ${entry.amendsTo || '—'}`,
      `8. Who can you help now?: ${entry.helpWho || '—'}`,
      `9. Share with: ${entry.shareWith || '—'}`,
      `10. Notes: ${entry.notes || '—'}`,
    ].join('\n');

  const handleCopy = (entry: InventoryEntry) =>
    handleCopyToClipboard(formatEntryForCopy(entry));

  const formatDraftForCopy = () =>
    [
      'Step 10 Inventory (Draft)',
      `Date: ${new Date().toLocaleString()}`,
      '',
      `1. Who: ${who.trim() || '—'}`,
      `2. What happened: ${whatHappened.trim() || '—'}`,
      `3. Affects: ${affects.join(', ') || '—'}`,
      `4. My part (defects): ${defects.join(', ') || '—'}`,
      `5. Character assets: ${assets.join(', ') || '—'}`,
      `6. Prayed: ${prayed ? 'Yes' : 'No'}`,
      `7. Amends needed: ${amendsNeeded ? 'Yes' : 'No'}`,
      `   Amends to: ${amendsTo.trim() || '—'}`,
      `8. Who can you help now?: ${helpWho.trim() || '—'}`,
      `9. Share with: ${shareWith.trim() || '—'}`,
      `10. Notes: ${notes.trim() || '—'}`,
    ].join('\n');

  const handleCopyDraft = () => handleCopyToClipboard(formatDraftForCopy());

  /** Done card for morning/nightly when today's entry exists and not editing. */
  const renderDoneCard = (title: string, subtitle: string, onEdit: () => void) => (
    <View className="rounded-2xl p-5 bg-card border border-border">
      <Text className="text-lg font-bold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted-foreground mb-4">{subtitle}</Text>
      <ModalButton onPress={onEdit} variant="primary">Edit</ModalButton>
    </View>
  );

  /** Wrapper for "Saved X inventories" sections: same card style and empty state. */
  const renderSavedSection = (
    title: string,
    emptyMessage: string,
    hasEntries: boolean,
    children: React.ReactNode
  ) => (
    <View className="rounded-2xl p-4 bg-card border border-border mt-4">
      <Text className="text-base font-semibold text-foreground mb-3">{title}</Text>
      {!hasEntries ? (
        <Text className="text-sm text-muted-foreground">{emptyMessage}</Text>
      ) : (
        <View className="gap-3">{children}</View>
      )}
    </View>
  );

  /** Nightly question: label + Yes/No inline, details input only when Yes (Step 10 style). */
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={iconColors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <AppHeader title="Inventory" rightSlot={<ThemeToggle />} />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-foreground font-semibold mb-2">Failed to load</Text>
          <Text className="text-muted-foreground text-center">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Inventory" rightSlot={<ThemeToggle />} />

      <View className="flex-row border-b border-border px-6">
        {(['morning', 'nightly', 'step10'] as const).map((tab) => (
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
              {tab === 'step10' ? 'Step 10' : tab === 'morning' ? 'Morning' : 'Nightly'}
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
                renderDoneCard(
                  'Morning inventory complete',
                  "You've completed your morning inventory for today.",
                  handleEditMorning
                )
              ) : (
                <>
                  <ModalSection>
                    <View className="flex-row items-center justify-between">
                      <ModalLabel className="mb-0">Did you pray and meditate?</ModalLabel>
                      <Switch value={morningPrayed} onValueChange={setMorningPrayed} {...switchColors} />
                    </View>
                  </ModalSection>
                  <ModalSection>
                    <ModalLabel>Today’s plans</ModalLabel>
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
              {renderSavedSection(
                'Saved morning inventories',
                'No saved morning inventories yet.',
                morningEntries.length > 0,
                morningEntries.map((entry) => {
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
                })
              )}
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
                renderDoneCard(
                  'Nightly inventory complete',
                  "You've completed your nightly inventory for today.",
                  handleEditNightly
                )
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
                  <ModalButtonRow>
                    <ModalButton onPress={handleSaveNightly} variant="primary">Save Nightly</ModalButton>
                    <ModalButton
                      onPress={() => {
                        if (editingNightly) {
                          setEditingNightly(false);
                        } else {
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
              {renderSavedSection(
                'Saved nightly inventories',
                'No saved nightly inventories yet.',
                nightlyEntries.length > 0,
                nightlyEntries.map((entry) => (
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
                ))
              )}
            </>
          )}

          {activeTab === 'step10' && (
            <>
              {editingEntryId ? (
                <View className="rounded-2xl p-4 bg-muted/40 border border-border mb-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-semibold text-foreground">Edit your entry now</Text>
                      <Text className="text-sm text-muted-foreground mt-1">Update fields below, then tap Update Inventory.</Text>
                    </View>
                    <TouchableOpacity onPress={resetStep10Form} className="px-3 py-2 border border-border rounded-lg">
                      <Text className="text-foreground font-semibold">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              {getPassage('step10') && (
                <BigBookPassageView passage={getPassage('step10')!} />
              )}

              <ModalSection>
                <ModalLabel>1. Who are you upset at?</ModalLabel>
                <ModalInput value={who} onChangeText={setWho} placeholder="Person, situation, yourself, etc." />
              </ModalSection>
              <ModalSection>
                <ModalLabel>2. What happened?</ModalLabel>
                <ModalInput value={whatHappened} onChangeText={setWhatHappened} placeholder="19 words or less" />
              </ModalSection>
              <ModalSection>
                <View className="flex-row items-center justify-between mb-2">
                  <ModalLabel className="mb-0">3. Affects my…</ModalLabel>
                  <TouchableOpacity onPress={() => { setHelperType('affects'); setHelperVisible(true); }} className="p-1">
                    <HelpCircle size={18} color={iconColors.primary} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {AFFECTS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleSelection(item, affects, setAffects)}
                      className={`px-3 py-2 rounded-full border ${affects.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
                    >
                      <Text className={affects.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>
              <ModalSection>
                <View className="flex-row items-center justify-between mb-2">
                  <ModalLabel className="mb-0">4. My part (defects)</ModalLabel>
                  <TouchableOpacity onPress={() => { setHelperType('defects'); setHelperVisible(true); }} className="p-1">
                    <HelpCircle size={18} color={iconColors.primary} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {DEFECTS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleDefect(item)}
                      className={`px-3 py-2 rounded-full border ${defects.includes(item) ? 'bg-destructive border-destructive' : 'border-border'}`}
                    >
                      <Text className={defects.includes(item) ? 'text-destructive-foreground' : 'text-foreground'}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>
              <ModalSection>
                <View className="flex-row items-center justify-between mb-2">
                  <ModalLabel className="mb-0">5. Character assets</ModalLabel>
                  <TouchableOpacity onPress={() => { setHelperType('assets'); setHelperVisible(true); }} className="p-1">
                    <HelpCircle size={18} color={iconColors.primary} />
                  </TouchableOpacity>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {ASSETS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleSelection(item, assets, setAssets)}
                      className={`px-3 py-2 rounded-full border ${assets.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
                    >
                      <Text className={assets.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>
              <ModalSection>
                <ModalLabel>6. 7th-step prayer</ModalLabel>
                <View className="bg-input rounded-xl px-4 py-3 border border-modal-border">
                  <Text className="text-foreground leading-5">{generatedPrayer}</Text>
                </View>
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">Did you pray?</Text>
                    <Switch value={prayed} onValueChange={setPrayed} {...switchColors} />
                  </View>
                </View>
              </ModalSection>
              <ModalSection>
                <View className="flex-row items-center justify-between mb-2">
                  <ModalLabel className="mb-0">7. Amends</ModalLabel>
                  <Switch value={amendsNeeded} onValueChange={setAmendsNeeded} {...switchColors} />
                </View>
                {amendsNeeded && (
                  <ModalInput value={amendsTo} onChangeText={setAmendsTo} placeholder="Who and how?" />
                )}
              </ModalSection>
              <ModalSection>
                <ModalLabel>8. Who can you help now?</ModalLabel>
                <ModalInput value={helpWho} onChangeText={setHelpWho} placeholder="Someone you can help or pray for" />
              </ModalSection>
              <ModalSection>
                <ModalLabel>9. Share</ModalLabel>
                <ModalInput value={shareWith} onChangeText={setShareWith} placeholder="Who will you share this with?" />
                <TouchableOpacity onPress={handleCopyDraft} className="mt-3 flex-row items-center justify-center gap-2 border border-border rounded-lg p-2">
                  <Copy size={16} color={iconColors.primary} />
                  <Text className="text-foreground font-semibold">Copy for sharing</Text>
                </TouchableOpacity>
              </ModalSection>
              <ModalSection last>
                <ModalLabel>10. Notes</ModalLabel>
                <ModalInput value={notes} onChangeText={setNotes} placeholder="Optional notes" multiline />
              </ModalSection>
              <ModalButtonRow>
                <ModalButton onPress={handleSaveStep10} variant="primary">
                  {editingEntryId ? 'Update Inventory' : 'Save Inventory'}
                </ModalButton>
                <ModalButton onPress={resetStep10Form} variant="secondary">
                  {editingEntryId ? 'Cancel' : 'Clear'}
                </ModalButton>
              </ModalButtonRow>

              {renderSavedSection(
                'Saved Inventories',
                'No saved inventories yet.',
                step10Entries.length > 0,
                step10Entries.map((entry) => (
                  <View key={entry.id} className="p-3 rounded-lg border border-border">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-foreground font-semibold">{entry.who}</Text>
                      <View className="flex-row items-center gap-2">
                        <TouchableOpacity onPress={() => handleEdit(entry)} className="p-1">
                          <Pencil size={16} color={iconColors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleCopy(entry)} className="p-1">
                          <Copy size={16} color={iconColors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteEntry(entry.id, () => { if (editingEntryId === entry.id) resetStep10Form(); })} className="p-1">
                          <Trash2 size={16} color={iconColors.destructive} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-xs text-muted-foreground mb-2">{new Date(entry.createdAt).toLocaleString()}</Text>
                    <Text className="text-sm text-foreground">{entry.whatHappened}</Text>
                    <View className="flex-row flex-wrap gap-1 mt-2">
                      {(entry.affects ?? []).slice(0, 3).map((tag) => (
                        <View key={tag} className="px-2 py-1 rounded-full bg-muted">
                          <Text className="text-xs text-muted-foreground">{tag}</Text>
                        </View>
                      ))}
                      {(entry.affects ?? []).length > 3 ? (
                        <View className="px-2 py-1 rounded-full bg-muted">
                          <Text className="text-xs text-muted-foreground">+{(entry.affects ?? []).length - 3}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      <HelperModal
        visible={helperVisible}
        onClose={() => setHelperVisible(false)}
        helperType={helperType}
        selectedValues={
          helperType === 'affects' ? affects : helperType === 'defects' ? defects : assets
        }
        onSelectItem={(item) => {
          if (helperType === 'affects') toggleSelection(item, affects, setAffects);
          else if (helperType === 'defects') toggleDefect(item);
          else toggleSelection(item, assets, setAssets);
        }}
      />
    </SafeAreaView>
  );
}
