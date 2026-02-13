import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  ModalLabel,
  ModalInput,
  ModalSection,
  ModalButton,
  ModalButtonRow,
  ModalTitle,
} from '@/components/ModalContent';
import { ModalSurface } from '@/components/ModalSurface';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors } from '@/lib/iconTheme';
import { isToday } from '@/utils/date';
import { useGratitude } from './hooks/useGratitude';
import { checkSimilarGratitude } from './similarity';
import type { GratitudeEntry } from '@/lib/database/schema';
import { useBackToAnalytics } from '@/hooks/useBackToAnalytics';

/** Single delete helper: remove entry and optionally run callback (e.g. clear form). */
function useDeleteEntry(
  removeEntry: (id: string) => Promise<void>,
  onAfterDelete?: (entryId: string) => void
) {
  return useCallback(
    async (entryId: string) => {
      try {
        await removeEntry(entryId);
        onAfterDelete?.(entryId);
      } catch (e) {
        Alert.alert('Failed to delete');
      }
    },
    [removeEntry, onAfterDelete]
  );
}

/** Section wrapper: title + empty state or list (theme-based). */
function renderSection(
  title: string,
  emptyMessage: string,
  hasEntries: boolean,
  children: React.ReactNode
) {
  return (
    <View className="rounded-2xl p-4 bg-card border border-border mt-4">
      <Text className="text-base font-semibold text-foreground mb-3">{title}</Text>
      {!hasEntries ? (
        <Text className="text-sm text-muted-foreground">{emptyMessage}</Text>
      ) : (
        <View className="gap-3">{children}</View>
      )}
    </View>
  );
}

/** Format for duplicate alert: "Sunday Feb 1, 2025" */
function formatGratitudeDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function GratitudeScreen() {
  const backToAnalytics = useBackToAnalytics();
  const iconColors = useIconColors();
  const { entries, loading, error, refresh, addEntry, updateEntry, removeEntry } = useGratitude();
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    dateStr: string;
    entryToEdit: { id: string; text: string; createdAt: string } | null;
    pendingText: string;
  } | null>(null);

  const entriesToday = useMemo(() => entries.filter((e) => isToday(e.createdAt)), [entries]);
  const hasGratitudeToday = entriesToday.length > 0;

  const handleDeleteEntry = useDeleteEntry(removeEntry);

  const performAdd = useCallback(
    async (text: string) => {
      setSubmitting(true);
      try {
        await addEntry(text);
        setDraft('');
      } catch (e) {
        Alert.alert('Failed to add');
      } finally {
        setSubmitting(false);
    }
    },
    [addEntry]
  );

  const performUpdate = useCallback(
    async (entryId: string, text: string) => {
      setSubmitting(true);
      try {
        await updateEntry(entryId, text);
        setDraft('');
        setEditingEntryId(null);
      } catch (e) {
        Alert.alert('Failed to update');
      } finally {
        setSubmitting(false);
      }
    },
    [updateEntry]
  );

  const handleSubmit = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;

    if (editingEntryId) {
      await performUpdate(editingEntryId, text);
      return;
    }

    setSubmitting(true);
    try {
      // Use current entries so we always have the latest list (avoids stale closure)
      const currentPastEntries = entries.map((e) => ({
        text: e.text,
        id: e.id,
        createdAt: e.createdAt,
      }));
      const similar = await checkSimilarGratitude(text, currentPastEntries);
      if (similar.similar) {
        setSubmitting(false);
        const match = similar.matchingEntry ?? entries.find((e) => e.text?.trim() === similar.matchingText?.trim());
        const dateStr = match ? formatGratitudeDate(match.createdAt) : 'a previous day';
        const entryToEdit = similar.matchingEntry ?? match ?? null;
        setDuplicateModal({
          dateStr,
          entryToEdit: entryToEdit ? { id: entryToEdit.id, text: entryToEdit.text, createdAt: entryToEdit.createdAt } : null,
          pendingText: text,
        });
        return;
      }
      await performAdd(text);
    } finally {
      setSubmitting(false);
    }
  }, [
    draft,
    editingEntryId,
    entries,
    performAdd,
    performUpdate,
  ]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Gratitude" rightSlot={<ThemeToggle />} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Gratitude" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={iconColors.primary} />
        }
      >
        <View className="mb-4">
          <Text className="text-sm text-muted-foreground">
            Keep a running list of what you’re grateful for. Add one gratitude per day (no more than five)—it’s not a contest to write a long list in one go. The point is to be consistent and find the little things to be grateful for.
          </Text>
        </View>
        {hasGratitudeToday && !showAddForm && (
          <View className="rounded-2xl p-5 bg-card border border-border mb-4">
            <Text className="text-lg font-bold text-foreground mb-1">Gratitude added for today</Text>
            <Text className="text-sm text-muted-foreground mb-3">
              You've added {entriesToday.length} {entriesToday.length === 1 ? 'entry' : 'entries'} today.
            </Text>
            <View className="gap-2 mb-4">
              {entriesToday.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onDelete={() => handleDeleteEntry(entry.id)}
                  destructiveColor={iconColors.destructive}
                />
              ))}
            </View>
            <ModalButton
              onPress={() => {
                setEditingEntryId(null);
                setDraft('');
                setShowAddForm(true);
              }}
              variant="primary"
            >
              Add another
            </ModalButton>
          </View>
        )}

        {(showAddForm || !hasGratitudeToday) && (
        <ModalSection>
          <ModalLabel>What are you grateful for?</ModalLabel>
          <ModalInput
            value={draft}
            onChangeText={setDraft}
            placeholder="e.g. My health, a good conversation…"
            multiline
            numberOfLines={2}
          />
          <View className="mt-3 flex-row gap-3">
            <View className="flex-1">
              <ModalButton
                onPress={handleSubmit}
                variant="primary"
                disabled={submitting || !draft.trim()}
                loading={submitting}
              >
                {editingEntryId ? 'Update' : 'Add to list'}
              </ModalButton>
            </View>
            {(hasGratitudeToday && showAddForm) || editingEntryId ? (
              <ModalButton
                onPress={() => {
                  setShowAddForm(false);
                  setEditingEntryId(null);
                  setDraft('');
                }}
                variant="secondary"
              >
                Cancel
              </ModalButton>
            ) : null}
          </View>
        </ModalSection>
        )}

        {renderSection(
          'Your list',
          'No entries yet. Add something you’re grateful for above.',
          entries.length > 0,
          entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onDelete={() => handleDeleteEntry(entry.id)}
              destructiveColor={iconColors.destructive}
            />
          ))
        )}
      </ScrollView>

      <ModalSurface
        visible={duplicateModal !== null}
        onRequestClose={() => setDuplicateModal(null)}
        contentClassName="p-6 max-h-[85%]"
        keyboardAvoid={false}
      >
        {duplicateModal && (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <ModalTitle className="mb-2">Similar entry</ModalTitle>
            <Text className="text-modal-content-foreground mb-2">
              You entered this gratitude on {duplicateModal.dateStr}. Is this different?
            </Text>
            {duplicateModal.entryToEdit && (
              <View className="rounded-lg bg-muted/50 border border-modal-border p-3 mb-4">
                <Text className="text-xs text-muted-foreground mb-1">Previous entry</Text>
                <Text className="text-sm text-modal-content-foreground" numberOfLines={10}>
                  {duplicateModal.entryToEdit.text}
                </Text>
              </View>
            )}
            <ModalButtonRow className="flex-col gap-2">
              <ModalButton
                variant="primary"
                onPress={() => {
                  const { pendingText } = duplicateModal;
                  setDuplicateModal(null);
                  performAdd(pendingText);
                }}
              >
                Add anyway
              </ModalButton>
              {duplicateModal.entryToEdit && (
                <ModalButton
                  variant="secondary"
                  onPress={() => {
                    setDraft(duplicateModal!.entryToEdit!.text);
                    setEditingEntryId(duplicateModal!.entryToEdit!.id);
                    setDuplicateModal(null);
                  }}
                >
                  Edit previous entry
                </ModalButton>
              )}
              <ModalButton variant="secondary" onPress={() => setDuplicateModal(null)}>
                Edit what I wrote
              </ModalButton>
            </ModalButtonRow>
          </ScrollView>
        )}
      </ModalSurface>
    </SafeAreaView>
  );
}

function EntryRow({
  entry,
  onDelete,
  destructiveColor,
}: {
  entry: GratitudeEntry;
  onDelete: () => void;
  destructiveColor: string;
}) {
  return (
    <View className="p-3 rounded-lg border border-border flex-row items-center justify-between">
      <View className="flex-1 mr-2">
        <Text className="text-sm text-foreground" numberOfLines={3}>
          {entry.text}
        </Text>
        <Text className="text-xs text-muted-foreground mt-1">
          {new Date(entry.createdAt).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} className="p-1">
        <Trash2 size={18} color={destructiveColor} />
      </TouchableOpacity>
    </View>
  );
}
