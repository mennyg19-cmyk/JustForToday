import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BookOpen, ChevronLeft, ChevronRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { getStoicWeek, type StoicPart } from './handbookData';
import {
  getStoicEntriesForWeek,
  setStoicEntry,
  getStoicEntriesHistory,
  type StoicEntry,
  type StoicDayKey,
} from './database';
import { getStoicCurrentWeekNumber } from './weekUtils';
import { LessonContent } from './LessonContent';
import { ModalSurface } from '@/components/ModalSurface';
import { ModalButton, ModalButtonRow } from '@/components/ModalContent';
import { CalendarGrid } from '@/components/CalendarGrid';
import {
  getStoicWeekMode,
  setStoicWeekMode,
  getStoicStartDate,
  setStoicStartDate,
  type StoicWeekMode,
} from '@/lib/settings/database';
import { formatDateKey, formatDateDisplay } from '@/utils/date';
import { useRouter, useLocalSearchParams } from 'expo-router';

const DAY_KEYS: { key: StoicDayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
];

const WEEK_DAYS_WITH_REVIEW: { key: StoicDayKey; label: string; isReview: boolean }[] = [
  ...DAY_KEYS.map((d) => ({ ...d, isReview: false })),
  { key: 'review', label: 'Sunday (Review)', isReview: true },
];

function getTodayDayKey(): StoicDayKey {
  const day = new Date().getDay();
  if (day === 0) return 'review';
  return DAY_KEYS[day - 1].key;
}

function getDayKeyOrder(dayKey: StoicDayKey): number {
  const i = DAY_KEYS.findIndex((d) => d.key === dayKey);
  return i >= 0 ? i : 6;
}

const PART_ORDER: StoicPart[] = ['desire', 'action', 'assent'];
const PART_LABELS: Record<StoicPart, string> = {
  desire: 'Discipline of Desire',
  action: 'Discipline of Action',
  assent: 'Discipline of Assent',
};

/** Group history by part, then by week within each part. */
function groupHistoryByPartAndWeek(entries: StoicEntry[]): { part: StoicPart; partLabel: string; weeks: { weekNumber: number; entries: StoicEntry[] }[] }[] {
  const byPart = new Map<StoicPart, Map<number, StoicEntry[]>>();
  for (const entry of entries) {
    const weekData = getStoicWeek(entry.weekNumber);
    const part = weekData?.part ?? 'desire';
    if (!byPart.has(part)) byPart.set(part, new Map());
    const weekMap = byPart.get(part)!;
    if (!weekMap.has(entry.weekNumber)) weekMap.set(entry.weekNumber, []);
    weekMap.get(entry.weekNumber)!.push(entry);
  }
  return PART_ORDER.filter((p) => byPart.has(p)).map((part) => {
    const weekMap = byPart.get(part)!;
    const weeks = Array.from(weekMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNumber, entries]) => ({ weekNumber, entries }));
    return { part, partLabel: PART_LABELS[part], weeks };
  });
}

export function StoicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const backToAnalytics = params.from === 'analytics' ? () => router.replace('/analytics') : undefined;
  const iconColors = useIconColors();
  const [weekNumber, setWeekNumber] = useState(1);
  const [entries, setEntries] = useState<StoicEntry[]>([]);
  const [history, setHistory] = useState<StoicEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [weekMode, setWeekMode] = useState<StoicWeekMode>('calendar');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const draftRef = useRef<string>('');

  const weekData = getStoicWeek(weekNumber);
  const todayKey = getTodayDayKey();
  const isReviewDay = todayKey === 'review';

  const loadSettings = useCallback(async () => {
    const [mode, start] = await Promise.all([getStoicWeekMode(), getStoicStartDate()]);
    setWeekMode(mode);
    setStartDate(start);
  }, []);

  const loadWeek = useCallback(async (week: number) => {
    setLoading(true);
    try {
      const [list, hist] = await Promise.all([
        getStoicEntriesForWeek(week),
        getStoicEntriesHistory(),
      ]);
      setEntries(list);
      setHistory(hist);
    } catch (e) {
      console.error('Stoic load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const initCurrentWeek = useCallback(async () => {
    const current = await getStoicCurrentWeekNumber();
    setWeekNumber(current);
    return current;
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    let cancelled = false;
    initCurrentWeek().then((w) => {
      if (!cancelled) {
        setWeekNumber(w);
        loadWeek(w);
      }
    });
    return () => { cancelled = true; };
  }, [initCurrentWeek, loadWeek]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSettings();
    const current = await getStoicCurrentWeekNumber();
    setWeekNumber(current);
    loadWeek(current);
  }, [loadSettings, loadWeek]);

  const updateEntry = useCallback(
    async (dayKey: StoicDayKey, content: string, useful?: boolean) => {
      const prev = entries.find((e) => e.dayKey === dayKey);
      const newUseful = useful ?? prev?.useful ?? false;
      setEntries((prevList) =>
        prevList.map((e) =>
          e.dayKey === dayKey
            ? { ...e, content, useful: newUseful, updatedAt: new Date().toISOString() }
            : e
        )
      );
      setSaving(dayKey);
      try {
        await setStoicEntry(weekNumber, dayKey, content, newUseful);
        const hist = await getStoicEntriesHistory();
        setHistory(hist);
      } catch (e) {
        console.error('Stoic save failed:', e);
      } finally {
        setSaving(null);
      }
    },
    [weekNumber, entries]
  );

  const handleReviewUseful = useCallback(
    (value: boolean) => {
      const review = entries.find((e) => e.dayKey === 'review');
      updateEntry('review', review?.content ?? '', value);
    },
    [entries, updateEntry]
  );

  const handleModeChange = useCallback(
    async (mode: StoicWeekMode) => {
      setWeekMode(mode);
      await setStoicWeekMode(mode);
      const current = await getStoicCurrentWeekNumber();
      setWeekNumber(current);
      loadWeek(current);
    },
    [loadWeek]
  );

  const handleStartDateConfirm = useCallback(() => {
    const key = formatDateKey(pickerDate);
    setStartDate(key);
    setStoicStartDate(key);
    setShowDatePicker(false);
    initCurrentWeek().then((w) => {
      setWeekNumber(w);
      loadWeek(w);
    });
  }, [pickerDate, initCurrentWeek, loadWeek]);

  const todayEntry = entries.find((e) => e.dayKey === todayKey);
  const reviewEntry = entries.find((e) => e.dayKey === 'review');

  const switchColors = useMemo(
    () => ({
      trackColor: { false: iconColors.muted, true: iconColors.primary },
      thumbColor: iconColors.primaryForeground,
    }),
    [iconColors]
  );

  const canPrev = weekNumber > 1;
  const canNext = weekNumber < 52;

  const handleWeekChange = useCallback(
    (delta: number) => {
      const next = weekNumber + delta;
      if (next >= 1 && next <= 52) {
        setWeekNumber(next);
        loadWeek(next);
      }
    },
    [weekNumber, loadWeek]
  );

  const cardClass = 'rounded-2xl p-4 bg-card border border-border mb-4';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="Stoic Handbook" rightSlot={<ThemeToggle />} onBackPress={backToAnalytics} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={iconColors.primary} />
        }
      >
        {/* Schedule: week mode + start date */}
        <View className={`${cardClass} mb-4`}>
          <Text className="text-base font-semibold text-foreground mb-2">Stoic schedule</Text>
          <Text className="text-sm text-muted-foreground mb-3">
            Week 1 can follow the calendar year or your personal start date.
          </Text>
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              onPress={() => handleModeChange('calendar')}
              className={`flex-1 py-2.5 rounded-xl border-2 ${
                weekMode === 'calendar' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  weekMode === 'calendar' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Weeks of the year
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleModeChange('personal')}
              className={`flex-1 py-2.5 rounded-xl border-2 ${
                weekMode === 'personal' ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
              }`}
            >
              <Text
                className={`text-center text-sm font-medium ${
                  weekMode === 'personal' ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                From start date
              </Text>
            </TouchableOpacity>
          </View>
          {weekMode === 'personal' && (
            <TouchableOpacity
              onPress={() => {
                setPickerDate(startDate ? new Date(startDate + 'T00:00:00') : new Date());
                setShowDatePicker(true);
              }}
              className="flex-row items-center gap-2 py-2 rounded-xl bg-muted/30 border border-border"
            >
              <Calendar size={20} color={iconColors.primary} />
              <Text className="text-sm text-foreground flex-1">
                {startDate ? formatDateDisplay(startDate) : 'Pick start date'}
              </Text>
              <ChevronRight size={18} color={iconColors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Week selector */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={() => canPrev && handleWeekChange(-1)}
            disabled={!canPrev}
            className="p-2 rounded-lg bg-card border border-border"
          >
            <ChevronLeft size={24} color={canPrev ? iconColors.primary : iconColors.muted} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Week {weekNumber} of 52</Text>
          <TouchableOpacity
            onPress={() => canNext && handleWeekChange(1)}
            disabled={!canNext}
            className="p-2 rounded-lg bg-card border border-border"
          >
            <ChevronRight size={24} color={canNext ? iconColors.primary : iconColors.muted} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color={iconColors.primary} />
          </View>
        ) : (
          <>
            {/* Weekly reading */}
            {weekData && (
              <View className={cardClass}>
                <View className="flex-row items-center gap-2 mb-2">
                  <BookOpen size={20} color={iconColors.primary} />
                  <Text className="text-base font-semibold text-foreground">Weekly reading</Text>
                </View>
                <Text className="text-xs text-muted-foreground uppercase mb-2">
                  {weekData.part} · Week {weekData.week}
                </Text>
                <Text className="text-lg font-semibold text-foreground mb-3">{weekData.title}</Text>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 360 }} showsVerticalScrollIndicator>
                  <LessonContent lesson={weekData.lesson} />
                </ScrollView>
              </View>
            )}

            {/* This week: all 7 days (Mon–Sat + Sunday Review); today editable, others read-only or "Not done" */}
            <View className={cardClass}>
              <Text className="text-base font-semibold text-foreground mb-3">This week</Text>
              <Text className="text-sm text-muted-foreground mb-3">
                Practice each day. Only today is editable.
              </Text>
              {WEEK_DAYS_WITH_REVIEW.map(({ key, label, isReview }) => {
                const entry = entries.find((e) => e.dayKey === key);
                const isToday = todayKey === key;
                const hasContent = Boolean(entry?.content.trim());
                return (
                  <View key={key} className="mb-4 last:mb-0">
                    <Text className="text-xs font-medium text-muted-foreground mb-1">
                      {label}
                      {isToday && ' · Today'}
                    </Text>
                    {isToday ? (
                      <>
                        <TextInput
                          className="rounded-xl border border-border bg-background text-foreground p-3 text-sm min-h-[100px]"
                          placeholder={isReview ? 'Your weekly review…' : 'Your reflection…'}
                          placeholderTextColor={iconColors.muted}
                          multiline
                          value={entry?.content ?? ''}
                          onChangeText={(text) => {
                            draftRef.current = text;
                            setEntries((prev) =>
                              prev.map((e) => (e.dayKey === key ? { ...e, content: text } : e))
                            );
                          }}
                          onBlur={() =>
                            updateEntry(key, draftRef.current || entry?.content || '')
                          }
                        />
                        <TouchableOpacity
                          onPress={() =>
                            updateEntry(key, draftRef.current ?? entry?.content ?? '')
                          }
                          disabled={saving === key}
                          className="mt-2 self-start py-1.5 px-0"
                          activeOpacity={0.7}
                        >
                          <Text className="text-sm font-medium text-primary">
                            {saving === key ? 'Saving…' : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : hasContent ? (
                      <Text className="text-sm text-foreground bg-muted/30 rounded-xl p-3">
                        {entry!.content}
                      </Text>
                    ) : (
                      <Text className="text-sm text-muted-foreground italic rounded-xl p-3 bg-muted/20">
                        Not done
                      </Text>
                    )}
                    {isReview && (
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-sm text-foreground">This exercise was useful</Text>
                        <Switch
                          value={reviewEntry?.useful ?? false}
                          onValueChange={handleReviewUseful}
                          disabled={!isReviewDay}
                          {...switchColors}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* History */}
            <View className={cardClass}>
              <TouchableOpacity
                onPress={() => setHistoryExpanded(!historyExpanded)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-base font-semibold text-foreground">Entire history</Text>
                {historyExpanded ? (
                  <ChevronUp size={20} color={iconColors.muted} />
                ) : (
                  <ChevronDown size={20} color={iconColors.muted} />
                )}
              </TouchableOpacity>
              {historyExpanded && (
                <View className="mt-3 border-t border-border pt-3">
                  {history.length === 0 ? (
                    <Text className="text-sm text-muted-foreground">No entries yet.</Text>
                  ) : (
                    <View className="gap-4">
                      {groupHistoryByPartAndWeek(history).map(({ part, partLabel, weeks }) => (
                        <View key={part}>
                          <Text className="text-sm font-semibold text-foreground uppercase tracking-wide mb-2">
                            {partLabel}
                          </Text>
                          <View className="gap-3 pl-2 border-l-2 border-border">
                            {weeks.map(({ weekNumber, entries: weekEntries }) => (
                              <View key={weekNumber} className="gap-2">
                                <Text className="text-xs font-medium text-muted-foreground">
                                  Week {weekNumber}
                                </Text>
                                {weekEntries.map((entry, idx) => (
                                  <View
                                    key={`${entry.weekNumber}-${entry.dayKey}-${idx}`}
                                    className="pb-2 border-b border-border last:border-b-0"
                                  >
                                    <Text className="text-xs text-muted-foreground mb-0.5">
                                      {entry.dayKey === 'review' ? 'Review' : DAY_KEYS.find((d) => d.key === entry.dayKey)?.label}
                                    </Text>
                                    <Text className="text-sm text-foreground" numberOfLines={4}>
                                      {entry.content || '(No text)'}
                                    </Text>
                                    {entry.useful && (
                                      <Text className="text-xs text-primary mt-1">Marked useful</Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <ModalSurface visible={showDatePicker} onRequestClose={() => setShowDatePicker(false)}>
        <View className="p-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Handbook start date</Text>
          <CalendarGrid
            monthDate={pickerDate}
            onChangeMonth={setPickerDate}
            renderDay={(date) => {
              const isSelected =
                pickerDate.getDate() === date.getDate() &&
                pickerDate.getMonth() === date.getMonth() &&
                pickerDate.getFullYear() === date.getFullYear();
              return (
                <TouchableOpacity
                  onPress={() => setPickerDate(date)}
                  className="w-[14.28%] aspect-square p-1"
                >
                  <View
                    className={`flex-1 rounded-lg items-center justify-center ${
                      isSelected ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <ModalButtonRow>
            <ModalButton onPress={() => setShowDatePicker(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onPress={handleStartDateConfirm}>Done</ModalButton>
          </ModalButtonRow>
        </View>
      </ModalSurface>
    </SafeAreaView>
  );
}

