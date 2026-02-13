/**
 * NightlyForm — Nightly reflection form for Step 11.
 *
 * Extracted from Step11Screen for separation of concerns.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { SavedSection } from './SavedSection';
import { DoneCard } from './DoneCard';
import { BigBookPassageView } from './BigBookPassage';
import { emptyPayload } from '../helpers';
import { getPassage } from '../bigBook';
import { isToday } from '@/utils/date';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButtonRow,
  ModalButton,
} from '@/components/ModalContent';
import type { InventoryEntry } from '@/lib/database/schema';
import type { NightlyInventoryData } from '../types';
import type { usePrivacyLock } from '@/hooks/usePrivacyLock';
import type { useIconColors } from '@/lib/iconTheme';

export interface NightlyFormProps {
  nightlyEntries: InventoryEntry[];
  switchColors: {
    trackColor: { false: string; true: string };
    thumbColor: string;
  };
  iconColors: ReturnType<typeof useIconColors>;
  privacyLock: ReturnType<typeof usePrivacyLock>;
  addEntry: (
    entry: Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>,
    options?: { createdAt?: string },
  ) => Promise<unknown>;
  updateEntry: (
    entryId: string,
    updates: Partial<Omit<InventoryEntry, 'id' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<unknown>;
  removeEntry: (entryId: string) => Promise<void>;
}

export function NightlyForm({
  nightlyEntries,
  switchColors,
  iconColors,
  privacyLock,
  addEntry,
  updateEntry,
  removeEntry,
}: NightlyFormProps) {
  const nightlyEntryToday = useMemo(
    () => nightlyEntries.find((e) => isToday(e.createdAt)),
    [nightlyEntries],
  );

  const [passageExpanded, setPassageExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveForYesterday, setSaveForYesterday] = useState<boolean | null>(
    null,
  );
  const [resent, setResent] = useState<boolean | null>(null);
  const [resentDetails, setResentDetails] = useState('');
  const [selfish, setSelfish] = useState<boolean | null>(null);
  const [selfishDetails, setSelfishDetails] = useState('');
  const [dishonest, setDishonest] = useState<boolean | null>(null);
  const [dishonestDetails, setDishonestDetails] = useState('');
  const [owingApology, setOwingApology] = useState<boolean | null>(null);
  const [owingApologyDetails, setOwingApologyDetails] = useState('');
  const [keptSecret, setKeptSecret] = useState<boolean | null>(null);
  const [keptSecretDetails, setKeptSecretDetails] = useState('');
  const [kindLoving, setKindLoving] = useState<boolean | null>(null);
  const [kindLovingDetails, setKindLovingDetails] = useState('');
  const [prayed, setPrayed] = useState(false);

  const resetForm = () => {
    setSaveForYesterday(null);
    setResent(null);
    setResentDetails('');
    setSelfish(null);
    setSelfishDetails('');
    setDishonest(null);
    setDishonestDetails('');
    setOwingApology(null);
    setOwingApologyDetails('');
    setKeptSecret(null);
    setKeptSecretDetails('');
    setKindLoving(null);
    setKindLovingDetails('');
    setPrayed(false);
  };

  const handleSave = async () => {
    const hasAnswers =
      resent !== null ||
      selfish !== null ||
      dishonest !== null ||
      owingApology !== null ||
      keptSecret !== null ||
      kindLoving !== null ||
      prayed;
    if (!hasAnswers) {
      Alert.alert('Please complete your nightly inventory');
      return;
    }
    try {
      const nightlyData: NightlyInventoryData = {
        resentful: resent,
        resentfulDetails: resentDetails,
        selfish,
        selfishDetails,
        dishonest,
        dishonestDetails,
        owingApology,
        owingApologyDetails,
        keptSecret,
        keptSecretDetails,
        kindLoving,
        kindLovingDetails,
      };
      if (nightlyEntryToday && editing) {
        await updateEntry(nightlyEntryToday.id, {
          prayed,
          notes: JSON.stringify(nightlyData),
        });
        setEditing(false);
      } else {
        const now = new Date();
        const hour = now.getHours();
        const saveYesterday = saveForYesterday ?? hour < 16;
        const createdAtOverride = saveYesterday
          ? (() => {
              const d = new Date();
              d.setDate(d.getDate() - 1);
              return d.toISOString();
            })()
          : undefined;
        await addEntry(
          {
            ...emptyPayload('nightly'),
            prayed,
            notes: JSON.stringify(nightlyData),
          },
          createdAtOverride ? { createdAt: createdAtOverride } : undefined,
        );
      }
      resetForm();
    } catch (_e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = () => {
    if (!nightlyEntryToday?.notes) return;
    try {
      const data = JSON.parse(
        nightlyEntryToday.notes,
      ) as NightlyInventoryData;
      setResent(data.resentful ?? null);
      setResentDetails(data.resentfulDetails ?? '');
      setSelfish(data.selfish ?? null);
      setSelfishDetails(data.selfishDetails ?? '');
      setDishonest(data.dishonest ?? null);
      setDishonestDetails(data.dishonestDetails ?? '');
      setOwingApology(data.owingApology ?? null);
      setOwingApologyDetails(data.owingApologyDetails ?? '');
      setKeptSecret(data.keptSecret ?? null);
      setKeptSecretDetails(data.keptSecretDetails ?? '');
      setKindLoving(data.kindLoving ?? null);
      setKindLovingDetails(data.kindLovingDetails ?? '');
      setPrayed(nightlyEntryToday.prayed);
      setEditing(true);
    } catch {
      setEditing(true);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await removeEntry(entryId);
      if (nightlyEntryToday?.id === entryId) setEditing(false);
    } catch (_e) {
      Alert.alert('Failed to delete');
    }
  };

  const renderQuestion = (
    question: string,
    value: boolean | null,
    setValue: (v: boolean | null) => void,
    details: string,
    setDetails: (v: string) => void,
    detailsPlaceholder: string,
    yesIsBad = true,
  ) => (
    <ModalSection>
      <ModalLabel>{question}</ModalLabel>
      <View className="flex-row gap-2 mb-2">
        <TouchableOpacity
          onPress={() => setValue(true)}
          className={`flex-1 py-3 rounded-xl border-2 ${
            value === true
              ? yesIsBad
                ? 'bg-destructive border-destructive'
                : 'bg-primary border-primary'
              : 'bg-muted border-border'
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              value === true
                ? 'text-primary-foreground'
                : 'text-muted-foreground'
            }`}
          >
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setValue(false)}
          className={`flex-1 py-3 rounded-xl border-2 ${
            value === false
              ? yesIsBad
                ? 'bg-primary border-primary'
                : 'bg-destructive border-destructive'
              : 'bg-muted border-border'
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              value === false
                ? 'text-primary-foreground'
                : 'text-muted-foreground'
            }`}
          >
            No
          </Text>
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

  return (
    <>
      {getPassage('nightly') && (
        <BigBookPassageView
          passage={getPassage('nightly')!}
          collapsed={!passageExpanded}
          onToggleCollapsed={() => setPassageExpanded((prev) => !prev)}
        />
      )}
      {nightlyEntryToday && !editing ? (
        <DoneCard
          title="Nightly inventory complete"
          subtitle="You've completed your nightly inventory for today."
          onEdit={handleEdit}
        />
      ) : (
        <>
          {renderQuestion(
            'Were we resentful?',
            resent,
            setResent,
            resentDetails,
            setResentDetails,
            'What or who made us resentful? Why?',
          )}
          {renderQuestion(
            'Were we selfish?',
            selfish,
            setSelfish,
            selfishDetails,
            setSelfishDetails,
            'In what ways were we selfish?',
          )}
          {renderQuestion(
            'Were we dishonest?',
            dishonest,
            setDishonest,
            dishonestDetails,
            setDishonestDetails,
            'What were we dishonest about?',
          )}
          {renderQuestion(
            'Do we owe an apology?',
            owingApology,
            setOwingApology,
            owingApologyDetails,
            setOwingApologyDetails,
            'To whom do we owe an apology and why?',
          )}
          {renderQuestion(
            'Did we keep something to ourselves?',
            keptSecret,
            setKeptSecret,
            keptSecretDetails,
            setKeptSecretDetails,
            'What should we have shared? With whom?',
          )}
          {renderQuestion(
            'Were we kind and loving?',
            kindLoving,
            setKindLoving,
            kindLovingDetails,
            setKindLovingDetails,
            'How did we show kindness and love today?',
            false,
          )}
          <ModalSection>
            <View className="flex-row items-center justify-between">
              <ModalLabel className="mb-0">Did you pray?</ModalLabel>
              <Switch
                value={prayed}
                onValueChange={setPrayed}
                {...switchColors}
              />
            </View>
          </ModalSection>
          {!editing && (
            <ModalSection>
              <ModalLabel>Save for</ModalLabel>
              <View className="flex-row gap-3 mt-2">
                <TouchableOpacity
                  onPress={() => setSaveForYesterday(false)}
                  className={`flex-1 py-2.5 rounded-lg border-2 ${
                    saveForYesterday === false
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      saveForYesterday === false
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSaveForYesterday(true)}
                  className={`flex-1 py-2.5 rounded-lg border-2 ${
                    saveForYesterday !== false
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/50'
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      saveForYesterday !== false
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-muted-foreground mt-1.5">
                Before 4pm we default to Yesterday so last night&apos;s
                inventory counts for that day.
              </Text>
            </ModalSection>
          )}
          <ModalButtonRow>
            <ModalButton onPress={handleSave} variant="primary">
              Save Nightly
            </ModalButton>
            <ModalButton
              onPress={() => {
                if (editing) {
                  setEditing(false);
                } else {
                  resetForm();
                }
              }}
              variant="secondary"
            >
              {editing ? 'Cancel' : 'Clear'}
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
          <View
            key={entry.id}
            className="p-3 rounded-lg border border-border flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-xs text-muted-foreground mb-1">
                {new Date(entry.createdAt).toLocaleString()}
              </Text>
              <Text className="text-sm text-foreground">
                {entry.prayed ? 'Prayed' : '—'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(entry.id)}
              className="p-1"
            >
              <Trash2 size={18} color={iconColors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
      </SavedSection>
    </>
  );
}
