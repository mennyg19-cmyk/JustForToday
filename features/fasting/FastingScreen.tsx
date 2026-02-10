import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timer, Pencil, Trash2 } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { LoadingView } from '@/components/common/LoadingView';
import { ErrorView } from '@/components/common/ErrorView';
import { useIconColors } from '@/lib/iconTheme';
import { useFasting } from './hooks/useFasting';
import {
  formatDurationHours,
  formatDurationMinutes,
  formatDurationSeconds,
  formatDateTimeDisplay,
  formatTimeDisplay,
  minutesBetween,
  secondsSince,
} from './utils';
import type { FastingSession } from '@/lib/database/schema';
import { ModalSurface } from '@/components/ModalSurface';
import { AddPastSessionModal } from './components/AddPastSessionModal';
import { EditSessionModal } from './components/EditSessionModal';
import { useRouter, useLocalSearchParams } from 'expo-router';

/** Card container: consistent with other screens (gratitude, inventory). */
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-2xl p-4 bg-card border border-border ${className}`.trim()}>
      {children}
    </View>
  );
}

export function FastingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const iconColors = useIconColors();
  const {
    sessions,
    activeSession,
    loading,
    error,
    refresh,
    startFast,
    endFast,
    addPastSession,
    updateSession,
    deleteSession,
  } = useFasting();

  const [tick, setTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showAddPast, setShowAddPast] = useState(false);
  const [editSession, setEditSession] = useState<FastingSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<FastingSession | null>(null);

  // Live-update elapsed time while fasting
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const elapsedSeconds = activeSession ? secondsSince(activeSession.startAt) : 0;
  const elapsedFormatted = formatDurationSeconds(Math.max(0, elapsedSeconds));

  const todayHours = useMemo(() => {
    const now = Date.now();
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const dayStart = new Date(y, m, d).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    let total = 0;
    for (const s of sessions) {
      const start = new Date(s.startAt).getTime();
      const end = s.endAt ? new Date(s.endAt).getTime() : now;
      const overlapStart = Math.max(start, dayStart);
      const overlapEnd = Math.min(end, dayEnd);
      if (overlapEnd > overlapStart) {
        total += (overlapEnd - overlapStart) / (1000 * 60 * 60);
      }
    }
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, tick]);

  const handleStartFast = useCallback(async () => {
    setSubmitting(true);
    try {
      await startFast();
    } catch (e) {
      Alert.alert('Failed to start fast');
    } finally {
      setSubmitting(false);
    }
  }, [startFast]);

  const handleEndFast = useCallback(
    async (session: FastingSession) => {
      setSubmitting(true);
      try {
        await endFast(session.id);
      } catch (e) {
        Alert.alert('Failed to end fast');
      } finally {
        setSubmitting(false);
      }
    },
    [endFast]
  );

  const handleAddPastSession = useCallback(
    async (startAt: string, endAt: string) => {
      await addPastSession(startAt, endAt);
      setShowAddPast(false);
    },
    [addPastSession]
  );

  const handleSaveEdit = useCallback(
    async (
      sessionId: string,
      updates: { startAt?: string; endAt?: string | null }
    ) => {
      await updateSession(sessionId, updates);
      setEditSession(null);
    },
    [updateSession]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete.id);
      setSessionToDelete(null);
    } catch (e) {
      Alert.alert('Failed to delete');
    }
  }, [sessionToDelete, deleteSession]);

  if (loading) return <LoadingView />;

  if (error) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
        <AppHeader title="Fasting" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />
        <ErrorView message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Fasting" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refresh}
            tintColor={iconColors.primary}
          />
        }
      >
        {/* Active Fast */}
        <Card className="mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Timer size={18} color={iconColors.primary} />
            <Text className="text-base font-semibold text-foreground">Active Fast</Text>
          </View>
          {activeSession ? (
            <>
              <Text className="text-2xl font-bold text-foreground mb-1">{elapsedFormatted}</Text>
              <Text className="text-sm text-muted-foreground mb-2">
                Started {formatTimeDisplay(activeSession.startAt)}
              </Text>
              <View className="flex-row gap-2 mb-2">
                <ModalButton
                  variant="primary"
                  onPress={() => handleEndFast(activeSession)}
                  disabled={submitting}
                  loading={submitting}
                >
                  End Fast
                </ModalButton>
                <ModalButton
                  variant="secondary"
                  onPress={() => setEditSession(activeSession)}
                >
                  Edit start time
                </ModalButton>
              </View>
            </>
          ) : (
            <Text className="text-sm text-muted-foreground">
              No active fast. Start one below.
            </Text>
          )}
        </Card>

        {/* Quick Actions */}
        {!activeSession && (
          <Card className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">Quick Actions</Text>
            <View className="gap-3">
              <ModalButton
                variant="primary"
                onPress={handleStartFast}
                disabled={submitting}
                loading={submitting}
              >
                Start Fast
              </ModalButton>
              <ModalButton
                variant="secondary"
                onPress={() => setShowAddPast(true)}
              >
                Add past session
              </ModalButton>
            </View>
          </Card>
        )}

        {/* Today's total */}
        {(todayHours > 0 || activeSession) && (
          <Card className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-1">Today</Text>
            <Text className="text-sm text-muted-foreground">
              {formatDurationHours(todayHours)} fasted so far
            </Text>
          </Card>
        )}

        {/* Recent sessions */}
        {sessions.filter((s) => s.endAt).length > 0 && (
          <Card>
            <Text className="text-base font-semibold text-foreground mb-3">Recent sessions</Text>
            <View className="gap-2">
              {sessions.filter((s) => s.endAt).slice(0, 10).map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0"
                >
                  <View className="flex-1">
                    <Text className="text-sm text-foreground">
                      {formatDateTimeDisplay(session.startAt)} → {session.endAt && formatTimeDisplay(session.endAt)}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatDurationMinutes(minutesBetween(session.startAt, session.endAt!))}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setEditSession(session)}
                      className="p-2"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Pencil size={18} color={iconColors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSessionToDelete(session)}
                      className="p-2"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Trash2 size={18} color={iconColors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      <AddPastSessionModal
        visible={showAddPast}
        onClose={() => setShowAddPast(false)}
        onSubmit={handleAddPastSession}
      />
      <EditSessionModal
        session={editSession}
        visible={editSession !== null}
        onClose={() => setEditSession(null)}
        onSave={handleSaveEdit}
      />

      <ModalSurface
        visible={sessionToDelete !== null}
        onRequestClose={() => setSessionToDelete(null)}
        contentClassName="p-6"
      >
        {sessionToDelete && (
          <>
            <Text className="text-xl font-bold text-modal-content-foreground mb-2">
              Delete session
            </Text>
            <Text className="text-modal-content-foreground mb-4">
              Remove this fasting session? This cannot be undone.
            </Text>
            <ModalButtonRow>
              <ModalButton variant="secondary" onPress={() => setSessionToDelete(null)}>
                Cancel
              </ModalButton>
              <ModalButton variant="destructive" onPress={handleConfirmDelete}>
                Delete
              </ModalButton>
            </ModalButtonRow>
          </>
        )}
      </ModalSurface>
    </SafeAreaView>
  );
}
