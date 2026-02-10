/**
 * GroundingExercise — breathing, encouraging tools, thought writing,
 * and grounding readings for Hard Moment mode.
 *
 * Breathing: 4 seconds in → 4 seconds hold → 4 seconds out → repeat.
 * Each phase shows a countdown to the next transition.
 * The breathing exercise is presented alongside the other tools.
 *
 * Tools: tappable cards. When tapped, an encouraging message appears
 * for that specific tool. Tools with helper content (like reading)
 * show additional options loaded from the managed reading list.
 *
 * Thoughts: the user can write freely. Ephemeral by default, optionally saved.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Wind,
  Droplets,
  TreePine,
  Music,
  Coffee,
  BookOpen,
  Phone,
  ChevronRight,
  Settings,
} from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getVisibleReadings,
  getReaderRoute,
  type GroundingReading,
} from '@/lib/groundingReadings';

type BreathPhase = 'in' | 'hold' | 'out';

const PHASE_DURATION_SEC = 4;
const PHASE_DURATION_MS = PHASE_DURATION_SEC * 1000;

const PHASE_LABELS: Record<BreathPhase, string> = {
  in: 'Breathe in',
  hold: 'Hold',
  out: 'Breathe out',
};

const PHASE_ORDER: BreathPhase[] = ['in', 'hold', 'out'];

const SAVED_THOUGHTS_KEY = 'lifetrack_hard_moment_thoughts';

/**
 * Encouraging messages shown when a tool is tapped.
 * Each message is specific to the action — warm, concrete, no lecturing.
 */
interface ToolDef {
  id: string;
  label: string;
  icon: typeof Wind;
  message: string;
  /** If true, tapping opens the breathing exercise instead of a message. */
  isBreathing?: boolean;
  /** If true, tool has sub-options (e.g. reading material). */
  hasOptions?: boolean;
}

const TOOLS: ToolDef[] = [
  {
    id: 'breathe',
    label: 'Breathing exercise',
    icon: Wind,
    message: '',
    isBreathing: true,
  },
  {
    id: 'walk',
    label: 'Go for a walk',
    icon: TreePine,
    message: 'Great \u2014 let\u2019s go for a ten-minute walk to clear our thoughts. Leave your phone if you can.',
  },
  {
    id: 'water',
    label: 'Get a drink of water',
    icon: Droplets,
    message: 'Good call. Get up, fill a glass slowly, and drink it. Focus on the feeling.',
  },
  {
    id: 'warm_drink',
    label: 'Make a warm drink',
    icon: Coffee,
    message: 'Perfect. Make something warm \u2014 tea, coffee, whatever feels right. Take your time with it.',
  },
  {
    id: 'listen',
    label: 'Listen to something calming',
    icon: Music,
    message: 'Put on something calm \u2014 a podcast, music, nature sounds. Let your mind follow the sound instead of the craving.',
  },
  {
    id: 'read',
    label: 'Read something grounding',
    icon: BookOpen,
    message: 'Reading can pull you out of the moment. Pick something that speaks to you.',
    hasOptions: true,
  },
  {
    id: 'fresh_air',
    label: 'Step outside for fresh air',
    icon: Wind,
    message: 'Step outside, even for two minutes. Feel the air. Look at something far away. You\u2019re still here.',
  },
  {
    id: 'call',
    label: 'Call someone you trust',
    icon: Phone,
    message: 'Reaching out takes courage. You don\u2019t have to go through this alone.',
  },
];

export function GroundingExercise() {
  const router = useRouter();
  const [showBreathing, setShowBreathing] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [showReadingOptions, setShowReadingOptions] = useState(false);
  const [thought, setThought] = useState('');
  const [readings, setReadings] = useState<GroundingReading[]>([]);
  const iconColors = useIconColors();

  // Load visible readings when the reading tool is activated
  useEffect(() => {
    if (showReadingOptions) {
      getVisibleReadings().then(setReadings).catch(() => {});
    }
  }, [showReadingOptions]);

  const handleToolTap = useCallback((tool: ToolDef) => {
    if (tool.isBreathing) {
      setShowBreathing(true);
      setActiveTool(null);
      setShowReadingOptions(false);
      return;
    }
    if (tool.hasOptions) {
      setShowReadingOptions(true);
      setActiveTool(tool.id);
      return;
    }
    setActiveTool(tool.id);
    setShowReadingOptions(false);
  }, []);

  const handleDismissMessage = useCallback(() => {
    setActiveTool(null);
    setShowReadingOptions(false);
  }, []);

  const handleOpenReading = useCallback((reading: GroundingReading) => {
    router.push(getReaderRoute(reading));
  }, [router]);

  /** Save the current thought to AsyncStorage. */
  const handleSaveThought = useCallback(async () => {
    const trimmed = thought.trim();
    if (!trimmed) return;
    try {
      const raw = await AsyncStorage.getItem(SAVED_THOUGHTS_KEY);
      const existing: { text: string; date: string }[] = raw ? JSON.parse(raw) : [];
      existing.unshift({ text: trimmed, date: new Date().toISOString() });
      await AsyncStorage.setItem(SAVED_THOUGHTS_KEY, JSON.stringify(existing.slice(0, 20)));
      Alert.alert('Saved', 'Your thought has been saved privately.');
      setThought('');
    } catch {
      Alert.alert('Error', 'Could not save your thought.');
    }
  }, [thought]);

  const activeToolDef = TOOLS.find((t) => t.id === activeTool);

  return (
    <View className="gap-6">
      {/* ---------------------------------------------------------------- */}
      {/* Active tool message — shown when a tool is tapped               */}
      {/* ---------------------------------------------------------------- */}
      {activeTool && activeToolDef && !activeToolDef.isBreathing && (
        <View className="bg-primary/10 border border-primary/20 rounded-2xl p-5 gap-3">
          <Text className="text-foreground text-base leading-6">
            {activeToolDef.message}
          </Text>

          {/* Reading options — loaded from managed list */}
          {showReadingOptions && (
            <View className="gap-2 mt-2">
              {readings.length === 0 ? (
                <Text className="text-muted-foreground text-sm text-center py-2">
                  No readings available. Add some in Settings.
                </Text>
              ) : (
                readings.map((reading) => (
                  <TouchableOpacity
                    key={reading.id}
                    onPress={() => handleOpenReading(reading)}
                    activeOpacity={0.7}
                    className="bg-card border border-border rounded-xl p-3 flex-row items-center gap-3"
                  >
                    <BookOpen size={18} color={iconColors.primary} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold text-sm">
                        {reading.title}
                      </Text>
                      {reading.subtitle ? (
                        <Text className="text-muted-foreground text-xs">
                          {reading.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <ChevronRight size={16} color={iconColors.muted} />
                  </TouchableOpacity>
                ))
              )}

              {/* Link to settings for managing readings */}
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                activeOpacity={0.7}
                className="flex-row items-center justify-center gap-1.5 py-2 mt-1"
              >
                <Settings size={13} color={iconColors.muted} />
                <Text className="text-muted-foreground text-xs">
                  Add or edit readings in Settings
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDismissMessage}
            activeOpacity={0.7}
            className="self-center mt-1"
          >
            <Text className="text-muted-foreground text-sm">Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Breathing exercise — inline when active                         */}
      {/* ---------------------------------------------------------------- */}
      {showBreathing && (
        <BreathingTimer onStop={() => setShowBreathing(false)} />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* All tools — breathing alongside other actions                   */}
      {/* ---------------------------------------------------------------- */}
      <View className="gap-3">
        <Text className="text-foreground font-bold text-base">
          Something to try right now
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id || (tool.isBreathing && showBreathing);
            return (
              <TouchableOpacity
                key={tool.id}
                onPress={() => handleToolTap(tool)}
                activeOpacity={0.7}
                className={`border rounded-xl py-3 px-4 flex-row items-center gap-2 ${
                  isActive
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-card border-border'
                }`}
              >
                <Icon size={16} color={isActive ? iconColors.primary : iconColors.muted} />
                <Text className={`text-sm ${isActive ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {tool.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ---------------------------------------------------------------- */}
      {/* Thought writing — ephemeral by default, optionally saved         */}
      {/* ---------------------------------------------------------------- */}
      <View className="gap-2">
        <Text className="text-foreground font-bold text-base">
          Write what you're feeling
        </Text>
        <TextInput
          value={thought}
          onChangeText={setThought}
          placeholder="Anything at all..."
          placeholderTextColor={iconColors.muted}
          multiline
          className="bg-input text-input-foreground rounded-xl p-4 min-h-[100px] text-base"
          style={{ textAlignVertical: 'top' }}
        />
        {thought.trim().length > 0 && (
          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              onPress={handleSaveThought}
              activeOpacity={0.7}
              className="bg-muted rounded-lg py-2 px-4"
            >
              <Text className="text-muted-foreground text-sm font-semibold">
                Save this privately
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setThought('')}
              activeOpacity={0.7}
              className="rounded-lg py-2 px-4"
            >
              <Text className="text-muted-foreground text-sm">
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BreathingTimer — animated circle with per-phase countdown
// ---------------------------------------------------------------------------

function BreathingTimer({ onStop }: { onStop: () => void }) {
  const [phase, setPhase] = useState<BreathPhase>('in');
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(PHASE_DURATION_SEC);
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const targetScale = phase === 'out' ? 0.6 : 1.0;
    const easing = phase === 'hold' ? Easing.linear : Easing.inOut(Easing.ease);

    Animated.timing(scaleAnim, {
      toValue: targetScale,
      duration: PHASE_DURATION_MS,
      easing,
      useNativeDriver: true,
    }).start();

    setCountdown(PHASE_DURATION_SEC);

    const phaseTimer = setTimeout(() => {
      const currentIdx = PHASE_ORDER.indexOf(phase);
      const nextIdx = (currentIdx + 1) % PHASE_ORDER.length;
      setPhase(PHASE_ORDER[nextIdx]);
      if (nextIdx === 0) setCycleCount((c) => c + 1);
    }, PHASE_DURATION_MS);

    return () => clearTimeout(phaseTimer);
  }, [phase, scaleAnim]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  return (
    <View className="items-center gap-5 py-6 bg-card rounded-2xl border border-border">
      <Animated.View
        style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(212, 178, 106, 0.2)',
          transform: [{ scale: scaleAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: 'rgba(212, 178, 106, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: 'rgba(212, 178, 106, 0.9)' }}>
            {countdown}
          </Text>
        </View>
      </Animated.View>

      <Text className="text-foreground font-bold text-xl">
        {PHASE_LABELS[phase]}
      </Text>

      <Text className="text-muted-foreground text-sm">
        {cycleCount > 0
          ? `${cycleCount} cycle${cycleCount === 1 ? '' : 's'} completed`
          : 'Follow the rhythm'}
      </Text>

      <TouchableOpacity
        onPress={onStop}
        activeOpacity={0.7}
        className="bg-muted rounded-lg py-2 px-6 mt-1"
      >
        <Text className="text-muted-foreground font-semibold text-sm">
          Stop
        </Text>
      </TouchableOpacity>
    </View>
  );
}
