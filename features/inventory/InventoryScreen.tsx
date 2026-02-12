/**
 * InventoryScreen — Step 10 personal inventory.
 *
 * Two sub-tabs:
 *   - Resentment (Step 10 resentment form)
 *   - Fear (Step 10 fear inventory)
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
import * as Clipboard from 'expo-clipboard';
import { Copy, HelpCircle, Pencil, Trash2, Plus, X } from 'lucide-react-native';
import { usePrivacyLock } from '@/hooks/usePrivacyLock';
import { SavedSection } from './components/SavedSection';
import { emptyPayload } from './helpers';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
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
import type { HelperType } from './step10Data';
import { AFFECTS, DEFECTS, ASSETS, DEFECT_TO_ASSET } from './step10Data';
import { useRouter, useLocalSearchParams } from 'expo-router';

type Tab = 'resentment' | 'fear';

export function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const scrollRef = useRef<ScrollView | null>(null);
  const privacyLock = usePrivacyLock();
  const {
    step10Entries,
    fearEntries,
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

  const [activeTab, setActiveTab] = useState<Tab>('resentment');

  // Step 10 form state
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

  // Fear form state
  const [fearWhat, setFearWhat] = useState('');
  const [fearLayers, setFearLayers] = useState<string[]>(['']);
  const [fearAffects, setFearAffects] = useState<string[]>([]);
  const [fearDefects, setFearDefects] = useState<string[]>([]);
  const [fearAssets, setFearAssets] = useState<string[]>([]);
  const [fearPrayed, setFearPrayed] = useState(false);
  const [fearEditingEntryId, setFearEditingEntryId] = useState<string | null>(null);
  const [fearHelpWho, setFearHelpWho] = useState('');
  const [fearShareWith, setFearShareWith] = useState('');
  const [fearNotes, setFearNotes] = useState('');

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

  const generatedFearPrayer = useMemo(() => {
    const defectsText = fearDefects.length > 0 ? fearDefects.join(', ') : 'my defects';
    const assetsText = fearAssets.length > 0 ? fearAssets.join(', ') : 'your character assets';
    return [
      'I ask myself, why do I have this fear? Isn\'t it because self-reliance has failed me? Self-reliance was good as far as it went, but it didn\'t go far enough. I am now on a different basis — the basis of trusting and relying upon God. I trust infinite God rather than my finite self.',
      '',
      'I ask You, God, to remove my fear and direct my attention to what You would have me be.',
      '',
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
  }, [fearDefects, fearAssets]);

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

  const toggleFearDefect = (defect: string) => {
    if (fearDefects.includes(defect)) {
      setFearDefects(fearDefects.filter((d) => d !== defect));
      return;
    }
    setFearDefects([...fearDefects, defect]);
    const mapped = DEFECT_TO_ASSET[defect];
    if (mapped && !fearAssets.includes(mapped)) setFearAssets([...fearAssets, mapped]);
  };

  const updateFearLayer = (index: number, value: string) => {
    setFearLayers((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  const addFearLayer = () => {
    setFearLayers((prev) => [...prev, '']);
  };

  const removeFearLayer = (index: number) => {
    setFearLayers((prev) => prev.filter((_, i) => i !== index));
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
        await addEntry({ ...emptyPayload('step10'), ...payload });
        resetStep10Form();
      }
    } catch (_e) {
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
    } catch (_e) {
      Alert.alert('Failed to delete');
    }
  };

  // --- Fear form handlers ---

  const resetFearForm = () => {
    setFearWhat('');
    setFearLayers(['']);
    setFearAffects([]);
    setFearDefects([]);
    setFearAssets([]);
    setFearPrayed(false);
    setFearEditingEntryId(null);
    setFearHelpWho('');
    setFearShareWith('');
    setFearNotes('');
  };

  const handleSaveFear = async () => {
    if (!fearWhat.trim()) {
      Alert.alert('Please enter what you are afraid of');
      return;
    }
    const nonEmptyLayers = fearLayers.filter((l) => l.trim());
    if (nonEmptyLayers.length === 0) {
      Alert.alert('Please enter at least one underlying fear');
      return;
    }
    try {
      const payload = {
        who: fearWhat.trim(),
        whatHappened: JSON.stringify(nonEmptyLayers.map((l) => l.trim())),
        affects: fearAffects,
        defects: fearDefects,
        assets: fearAssets,
        seventhStepPrayer: generatedFearPrayer.trim(),
        prayed: fearPrayed,
        amendsNeeded: false,
        amendsTo: '',
        helpWho: fearHelpWho.trim(),
        shareWith: fearShareWith.trim(),
        notes: fearNotes.trim() || undefined,
      };
      if (fearEditingEntryId) {
        await updateEntry(fearEditingEntryId, payload);
        resetFearForm();
      } else {
        await addEntry({ ...emptyPayload('fear'), ...payload });
        resetFearForm();
      }
    } catch (_e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEditFear = (entry: InventoryEntry) => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setFearEditingEntryId(entry.id);
    setFearWhat(entry.who);
    // Parse fear layers from JSON array stored in whatHappened
    try {
      const parsed = JSON.parse(entry.whatHappened);
      setFearLayers(Array.isArray(parsed) ? parsed : [entry.whatHappened]);
    } catch {
      setFearLayers([entry.whatHappened]);
    }
    setFearAffects(entry.affects ?? []);
    setFearDefects(entry.defects ?? []);
    setFearAssets(entry.assets ?? []);
    setFearPrayed(entry.prayed);
    setFearHelpWho(entry.helpWho ?? '');
    setFearShareWith(entry.shareWith ?? '');
    setFearNotes(entry.notes ?? '');
  };

  const parseFearLayers = (entry: InventoryEntry): string[] => {
    try {
      const parsed = JSON.parse(entry.whatHappened);
      return Array.isArray(parsed) ? parsed : [entry.whatHappened];
    } catch {
      return [entry.whatHappened];
    }
  };

  const formatFearEntryForCopy = (entry: InventoryEntry) => {
    const layers = parseFearLayers(entry);
    const layerLines = layers.map((l, i) =>
      layers.length === 1 ? `2. Underlying fear: ${l}` : `2${String.fromCharCode(97 + i)}. ${i === 0 ? 'Underlying fear' : 'And then what?'}: ${l}`
    );
    return [
      'Fear Inventory',
      `Date: ${new Date(entry.createdAt).toLocaleString()}`,
      '',
      `1. What am I afraid of: ${entry.who}`,
      ...layerLines,
      `3. Affects: ${(entry.affects ?? []).join(', ') || '—'}`,
      `4. Character defects: ${(entry.defects ?? []).join(', ') || '—'}`,
      `5. Character assets: ${(entry.assets ?? []).join(', ') || '—'}`,
      `6. Prayed: ${entry.prayed ? 'Yes' : 'No'}`,
      `7. Who can you help now?: ${entry.helpWho || '—'}`,
      `8. Share with: ${entry.shareWith || '—'}`,
      `9. Notes: ${entry.notes || '—'}`,
    ].join('\n');
  };

  const handleCopyFear = (entry: InventoryEntry) =>
    handleCopyToClipboard(formatFearEntryForCopy(entry));

  const formatFearDraftForCopy = () => {
    const nonEmptyLayers = fearLayers.filter((l) => l.trim());
    const layerLines = nonEmptyLayers.length > 0
      ? nonEmptyLayers.map((l, i) =>
          nonEmptyLayers.length === 1 ? `2. Underlying fear: ${l.trim()}` : `2${String.fromCharCode(97 + i)}. ${i === 0 ? 'Underlying fear' : 'And then what?'}: ${l.trim()}`
        )
      : ['2. Underlying fear: —'];
    return [
      'Fear Inventory (Draft)',
      `Date: ${new Date().toLocaleString()}`,
      '',
      `1. What am I afraid of: ${fearWhat.trim() || '—'}`,
      ...layerLines,
      `3. Affects: ${fearAffects.join(', ') || '—'}`,
      `4. Character defects: ${fearDefects.join(', ') || '—'}`,
      `5. Character assets: ${fearAssets.join(', ') || '—'}`,
      `6. Prayed: ${fearPrayed ? 'Yes' : 'No'}`,
      `7. Who can you help now?: ${fearHelpWho.trim() || '—'}`,
      `8. Share with: ${fearShareWith.trim() || '—'}`,
      `9. Notes: ${fearNotes.trim() || '—'}`,
    ].join('\n');
  };

  const handleCopyFearDraft = () => handleCopyToClipboard(formatFearDraftForCopy());

  // --- Shared clipboard handler ---

  const handleCopyToClipboard = async (text: string, successMessage = 'Copied to clipboard') => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert(successMessage);
    } catch (_e) {
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

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Step 10" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <View className="flex-row border-b border-border px-6">
        {(['resentment', 'fear'] as const).map((tab) => (
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
              {tab === 'resentment' ? 'Resentment' : 'Fear'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="p-6 gap-4">
          {activeTab === 'resentment' && (
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

              <SavedSection
                title="Saved Inventories"
                emptyMessage="No saved inventories yet."
                hasEntries={step10Entries.length > 0}
                privacyLock={privacyLock}
                iconColors={iconColors}
              >
                {step10Entries.map((entry) => (
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
                ))}
              </SavedSection>
            </>
          )}

          {activeTab === 'fear' && (
            <>
              {fearEditingEntryId ? (
                <View className="rounded-2xl p-4 bg-muted/40 border border-border mb-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-semibold text-foreground">Edit your entry now</Text>
                      <Text className="text-sm text-muted-foreground mt-1">Update fields below, then tap Update Inventory.</Text>
                    </View>
                    <TouchableOpacity onPress={resetFearForm} className="px-3 py-2 border border-border rounded-lg">
                      <Text className="text-foreground font-semibold">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
              <ModalSection>
                <ModalLabel>1. What am I afraid of?</ModalLabel>
                <ModalInput value={fearWhat} onChangeText={setFearWhat} placeholder="Person, situation, outcome, etc." />
              </ModalSection>

              <ModalSection>
                <ModalLabel>2. What is the underlying fear?</ModalLabel>
                <Text className="text-xs text-muted-foreground mb-3">
                  Try to get to the root. What would happen if this fear came true? Keep asking yourself "And then what?" to dig deeper.
                </Text>
                {fearLayers.map((layer, index) => (
                  <View key={index} className="mb-2">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xs font-semibold text-muted-foreground">
                        {index === 0 ? 'If this fear came true…' : `And then what? (Level ${index + 1})`}
                      </Text>
                      {index > 0 && (
                        <TouchableOpacity onPress={() => removeFearLayer(index)} className="p-1">
                          <X size={14} color={iconColors.destructive} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ModalInput
                      value={layer}
                      onChangeText={(v) => updateFearLayer(index, v)}
                      placeholder={index === 0 ? 'What would happen?' : 'And then what would happen?'}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={addFearLayer}
                  className="flex-row items-center justify-center gap-2 mt-1 py-2 border border-dashed border-border rounded-lg"
                >
                  <Plus size={16} color={iconColors.primary} />
                  <Text className="text-primary font-semibold text-sm">Dig deeper — And then what?</Text>
                </TouchableOpacity>
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
                      onPress={() => toggleSelection(item, fearAffects, setFearAffects)}
                      className={`px-3 py-2 rounded-full border ${fearAffects.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
                    >
                      <Text className={fearAffects.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>

              <ModalSection>
                <View className="flex-row items-center justify-between mb-2">
                  <ModalLabel className="mb-0">4. Character defects</ModalLabel>
                  <TouchableOpacity onPress={() => { setHelperType('defects'); setHelperVisible(true); }} className="p-1">
                    <HelpCircle size={18} color={iconColors.primary} />
                  </TouchableOpacity>
                </View>
                <Text className="text-xs text-muted-foreground mb-2">
                  What defects of mine either put me in a position where this fear exists, or will come out as a result?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DEFECTS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => toggleFearDefect(item)}
                      className={`px-3 py-2 rounded-full border ${fearDefects.includes(item) ? 'bg-destructive border-destructive' : 'border-border'}`}
                    >
                      <Text className={fearDefects.includes(item) ? 'text-destructive-foreground' : 'text-foreground'}>{item}</Text>
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
                      onPress={() => toggleSelection(item, fearAssets, setFearAssets)}
                      className={`px-3 py-2 rounded-full border ${fearAssets.includes(item) ? 'bg-primary border-primary' : 'border-border'}`}
                    >
                      <Text className={fearAssets.includes(item) ? 'text-primary-foreground' : 'text-foreground'}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ModalSection>

              <ModalSection>
                <ModalLabel>6. Fear prayer + 7th-step prayer</ModalLabel>
                <View className="bg-input rounded-xl px-4 py-3 border border-modal-border">
                  <Text className="text-foreground leading-5">{generatedFearPrayer}</Text>
                </View>
                <View className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-foreground">Did you pray?</Text>
                    <Switch value={fearPrayed} onValueChange={setFearPrayed} {...switchColors} />
                  </View>
                </View>
              </ModalSection>

              <ModalSection>
                <ModalLabel>7. Who can you help now?</ModalLabel>
                <ModalInput value={fearHelpWho} onChangeText={setFearHelpWho} placeholder="Someone you can help or pray for" />
              </ModalSection>

              <ModalSection>
                <ModalLabel>8. Share</ModalLabel>
                <ModalInput value={fearShareWith} onChangeText={setFearShareWith} placeholder="Who will you share this with?" />
                <TouchableOpacity onPress={handleCopyFearDraft} className="mt-3 flex-row items-center justify-center gap-2 border border-border rounded-lg p-2">
                  <Copy size={16} color={iconColors.primary} />
                  <Text className="text-foreground font-semibold">Copy for sharing</Text>
                </TouchableOpacity>
              </ModalSection>

              <ModalSection last>
                <ModalLabel>9. Notes</ModalLabel>
                <ModalInput value={fearNotes} onChangeText={setFearNotes} placeholder="Optional notes" multiline />
              </ModalSection>

              <ModalButtonRow>
                <ModalButton onPress={handleSaveFear} variant="primary">
                  {fearEditingEntryId ? 'Update Inventory' : 'Save Inventory'}
                </ModalButton>
                <ModalButton onPress={resetFearForm} variant="secondary">
                  {fearEditingEntryId ? 'Cancel' : 'Clear'}
                </ModalButton>
              </ModalButtonRow>

              <SavedSection
                title="Saved Fear Inventories"
                emptyMessage="No saved fear inventories yet."
                hasEntries={fearEntries.length > 0}
                privacyLock={privacyLock}
                iconColors={iconColors}
              >
                {fearEntries.map((entry) => {
                  const layers = parseFearLayers(entry);
                  return (
                    <View key={entry.id} className="p-3 rounded-lg border border-border">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-foreground font-semibold" numberOfLines={1} style={{ flex: 1 }}>{entry.who}</Text>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity onPress={() => handleEditFear(entry)} className="p-1">
                            <Pencil size={16} color={iconColors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleCopyFear(entry)} className="p-1">
                            <Copy size={16} color={iconColors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteEntry(entry.id, () => { if (fearEditingEntryId === entry.id) resetFearForm(); })} className="p-1">
                            <Trash2 size={16} color={iconColors.destructive} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text className="text-xs text-muted-foreground mb-2">{new Date(entry.createdAt).toLocaleString()}</Text>
                      <Text className="text-sm text-foreground" numberOfLines={2}>{layers[0]}</Text>
                      {layers.length > 1 && (
                        <Text className="text-xs text-muted-foreground mt-1">{layers.length} fear layers</Text>
                      )}
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
                  );
                })}
              </SavedSection>
            </>
          )}
        </View>
      </ScrollView>

      <HelperModal
        visible={helperVisible}
        onClose={() => setHelperVisible(false)}
        helperType={helperType}
        selectedValues={
          activeTab === 'fear'
            ? helperType === 'affects' ? fearAffects : helperType === 'defects' ? fearDefects : fearAssets
            : helperType === 'affects' ? affects : helperType === 'defects' ? defects : assets
        }
        onSelectItem={(item) => {
          if (activeTab === 'fear') {
            if (helperType === 'affects') toggleSelection(item, fearAffects, setFearAffects);
            else if (helperType === 'defects') toggleFearDefect(item);
            else toggleSelection(item, fearAssets, setFearAssets);
          } else {
            if (helperType === 'affects') toggleSelection(item, affects, setAffects);
            else if (helperType === 'defects') toggleDefect(item);
            else toggleSelection(item, assets, setAssets);
          }
        }}
      />
    </SafeAreaView>
  );
}
