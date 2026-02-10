import type { ComponentType } from 'react';
import type { ThemeMode } from '@/lib/settings';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { MODULES, getSectionGroups } from '@/lib/modules';
import type { AppVisibility } from '@/lib/database/schema';

export interface SectionConfig {
  id: keyof AppVisibility;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}

export const SECTION_GROUPS = getSectionGroups();

export const SECTIONS: SectionConfig[] = MODULES.map((m) => ({
  id: m.id,
  label: m.label,
  description: m.description,
  icon: m.icon,
}));

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

// Re-export from canonical location so existing feature imports still work
export { DEFAULT_GOALS } from '@/lib/constants';
