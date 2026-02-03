import type { ComponentType } from 'react';
import type { AppVisibility } from '@/lib/database/schema';
import {
  CheckCircle,
  Target,
  Clock,
  Calendar,
  Footprints,
  Heart,
  BookOpen,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native';
import type { ThemeMode } from '@/lib/settings';

export interface SectionConfig {
  id: keyof AppVisibility;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}

export const SECTIONS: SectionConfig[] = [
  { id: 'habits', label: 'Habits', description: 'Track and build daily habits', icon: CheckCircle },
  { id: 'sobriety', label: 'Sobriety', description: 'Track recovery journey', icon: Target },
  { id: 'fasting', label: 'Fasting', description: 'Intermittent fasting tracking', icon: Clock },
  { id: 'inventory', label: 'Step 10 Inventory', description: 'Daily reflections & inventory', icon: Calendar },
  { id: 'steps', label: 'Steps & Exercise', description: 'Daily step count & activity', icon: Footprints },
  { id: 'gratitude', label: 'Gratitude Journal', description: 'Daily gratitude entries', icon: Heart },
  { id: 'stoic', label: 'Stoic', description: 'Stoic reflections and practices', icon: BookOpen },
];

export interface ThemeOption {
  mode: ThemeMode;
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Smartphone },
];

export const DEFAULT_GOALS = {
  stepsGoal: 10000,
  fastingHoursGoal: 16,
  inventoriesPerDayGoal: 2,
} as const;
