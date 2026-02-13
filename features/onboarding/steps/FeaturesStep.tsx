import React, { useState, useCallback } from 'react';
import { View, Text, Switch } from 'react-native';
import { OnboardingStep } from '../components/OnboardingStep';
import { AlertCircle } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import { MODULES } from '@/lib/modules';
import type { AppVisibility } from '@/lib/database/schema';
import { saveAppVisibility, getAppVisibility } from '@/lib/settings/database';
import { logger } from '@/lib/logger';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

/** Default visibility: recovery-core tools ON, others OFF. */
function getDefaultToolState(): Record<keyof AppVisibility, boolean> {
  const defaults: Record<string, boolean> = {};
  const recoveryCore = new Set(['sobriety', 'daily_renewal', 'step10', 'step11']);
  for (const m of MODULES) {
    defaults[m.id] = recoveryCore.has(m.id as string);
  }
  return defaults as Record<keyof AppVisibility, boolean>;
}

export function FeaturesStep({ onNext, onBack, onSkip }: StepProps) {
  const iconColors = useIconColors();
  const [tools, setTools] = useState<Record<keyof AppVisibility, boolean>>(getDefaultToolState);
  const [saving, setSaving] = useState(false);

  const toggleTool = useCallback((id: keyof AppVisibility) => {
    setTools((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleNext = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Merge with existing visibility (in case there are defaults already set)
      const existing = await getAppVisibility();
      const merged = { ...existing, ...tools };
      await saveAppVisibility(merged as AppVisibility);
    } catch (err) {
      logger.error('Failed to save tool selections:', err);
    }
    onNext();
  }, [saving, tools, onNext]);

  return (
    <OnboardingStep onNext={handleNext} onBack={onBack} onSkip={onSkip} nextLabel="Continue">
      <View className="gap-6">
        <Text className="text-3xl font-bold text-foreground text-center">
          Choose Your Tools
        </Text>

        <Text className="text-base text-muted-foreground text-center leading-7">
          You can always change these later in Settings.{'\n'}Start with what feels right.
        </Text>

        {/* Tool switches */}
        <View className="gap-1 pt-2">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <View
                key={mod.id}
                className="flex-row items-center justify-between py-3 px-1 border-b border-border/50"
              >
                <View className="flex-row items-center gap-3 flex-1">
                  <Icon size={20} color={iconColors.primary} />
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">
                      {mod.label}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {mod.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={tools[mod.id]}
                  onValueChange={() => toggleTool(mod.id)}
                  trackColor={{ false: '#767577', true: iconColors.primary }}
                />
              </View>
            );
          })}
        </View>

        {/* Hard Moment — always available */}
        <View className="flex-row items-center gap-3 py-3 px-1 bg-muted/30 rounded-xl mt-2">
          <AlertCircle size={20} color={iconColors.primary} />
          <View className="flex-1">
            <Text className="text-base font-medium text-foreground">
              Hard Moment
            </Text>
            <Text className="text-xs text-muted-foreground">
              Always available — when you need it most
            </Text>
          </View>
          <Text className="text-xs text-primary font-medium">Always On</Text>
        </View>
      </View>
    </OnboardingStep>
  );
}
