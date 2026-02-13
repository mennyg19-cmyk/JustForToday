/**
 * MorningForm — Morning reflection form for Step 11.
 *
 * Extracted from Step11Screen for separation of concerns.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { SavedSection } from './SavedSection';
import { DoneCard } from './DoneCard';
import { BigBookPassageView } from './BigBookPassage';
import { emptyPayload, parseMorningNotes } from '../helpers';
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
import type { MorningInventoryData } from '../types';
import type { usePrivacyLock } from '@/hooks/usePrivacyLock';
import type { useIconColors } from '@/lib/iconTheme';

export interface MorningFormProps {
  morningEntries: InventoryEntry[];
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

export function MorningForm({
  morningEntries,
  switchColors,
  iconColors,
  privacyLock,
  addEntry,
  updateEntry,
  removeEntry,
}: MorningFormProps) {
  const morningEntryToday = useMemo(
    () => morningEntries.find((e) => isToday(e.createdAt)),
    [morningEntries],
  );

  const [passageExpanded, setPassageExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [prayed, setPrayed] = useState(false);
  const [plans, setPlans] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    const hasContent = prayed || plans.trim() || notes.trim();
    if (!hasContent) {
      Alert.alert('Please complete your morning inventory');
      return;
    }
    try {
      const morningData: MorningInventoryData = {
        plans: plans.trim() || undefined,
        askFor: notes.trim() || undefined,
      };
      const noteStr =
        plans.trim() || notes.trim()
          ? JSON.stringify(morningData)
          : undefined;
      if (morningEntryToday && editing) {
        await updateEntry(morningEntryToday.id, {
          prayed,
          notes: noteStr,
        });
        setEditing(false);
      } else {
        await addEntry({
          ...emptyPayload('morning'),
          prayed,
          notes: noteStr,
        });
      }
      setPrayed(false);
      setPlans('');
      setNotes('');
    } catch (_e) {
      Alert.alert('Failed to save');
    }
  };

  const handleEdit = () => {
    if (!morningEntryToday) return;
    const data = parseMorningNotes(morningEntryToday.notes);
    setPrayed(morningEntryToday.prayed);
    setPlans(data.plans ?? '');
    setNotes(data.askFor ?? '');
    setEditing(true);
  };

  const handleDelete = async (entryId: string) => {
    try {
      await removeEntry(entryId);
      if (morningEntryToday?.id === entryId) setEditing(false);
    } catch (_e) {
      Alert.alert('Failed to delete');
    }
  };

  return (
    <>
      {getPassage('morning') && (
        <BigBookPassageView
          passage={getPassage('morning')!}
          collapsed={!passageExpanded}
          onToggleCollapsed={() => setPassageExpanded((prev) => !prev)}
        />
      )}
      {morningEntryToday && !editing ? (
        <DoneCard
          title="Morning inventory complete"
          subtitle="You've completed your morning inventory for today."
          onEdit={handleEdit}
        />
      ) : (
        <>
          <ModalSection>
            <View className="flex-row items-center justify-between">
              <ModalLabel className="mb-0">
                Did you pray and meditate?
              </ModalLabel>
              <Switch
                value={prayed}
                onValueChange={setPrayed}
                {...switchColors}
              />
            </View>
          </ModalSection>
          <ModalSection>
            <ModalLabel>Today&apos;s plans</ModalLabel>
            <ModalInput
              value={plans}
              onChangeText={setPlans}
              placeholder="What do you plan to do today?"
              multiline
              numberOfLines={3}
            />
          </ModalSection>
          <ModalSection>
            <ModalLabel>What will you ask for today?</ModalLabel>
            <ModalInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anticipated challenges, prayer requests, etc."
              multiline
              numberOfLines={4}
            />
          </ModalSection>
          <ModalButtonRow>
            <ModalButton onPress={handleSave} variant="primary">
              Save Morning
            </ModalButton>
            <ModalButton
              onPress={() => {
                setPrayed(false);
                setPlans('');
                setNotes('');
                if (editing) setEditing(false);
              }}
              variant="secondary"
            >
              {editing ? 'Cancel' : 'Clear'}
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
          const preview =
            [data.plans, data.askFor].filter(Boolean).join(' • ') ||
            (entry.prayed ? 'Prayed' : '—');
          return (
            <View
              key={entry.id}
              className="p-3 rounded-lg border border-border flex-row items-center justify-between"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs text-muted-foreground mb-1">
                  {new Date(entry.createdAt).toLocaleString()}
                </Text>
                <Text className="text-sm text-foreground" numberOfLines={2}>
                  {preview}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(entry.id)}
                className="p-1"
              >
                <Trash2 size={18} color={iconColors.destructive} />
              </TouchableOpacity>
            </View>
          );
        })}
      </SavedSection>
    </>
  );
}
