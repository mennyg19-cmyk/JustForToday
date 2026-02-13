/**
 * Single source of truth for app modules.
 * When adding a module: add here, then add to schema AppVisibility, cardConfigs, routes, and analytics DRILLDOWN_ROWS if needed.
 */

import type { ComponentType } from 'react';
import type { AppVisibility, SectionId } from '@/lib/database/schema';
import {
  CheckCircle,
  Target,
  Clock,
  Footprints,
  Heart,
  BookOpen,
  RotateCcw,
  Calendar,
  Dumbbell,
  ClipboardList,
} from 'lucide-react-native';

export interface ModuleDef {
  id: keyof AppVisibility;
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  sectionId: SectionId;
}

export const MODULES: ModuleDef[] = [
  { id: 'sobriety', label: 'Sobriety', description: 'Track recovery journey', href: '/sobriety', icon: Target, sectionId: 'sobriety' },
  { id: 'step10', label: 'Step 10', description: 'Spot-check personal inventory', href: '/inventory', icon: ClipboardList, sectionId: 'sobriety' },
  { id: 'step11', label: 'Step 11', description: 'Morning & nightly reflections', href: '/step11', icon: Calendar, sectionId: 'sobriety' },
  { id: 'daily_renewal', label: 'Daily Renewal', description: '24-hour commitment timers', href: '/daily-renewal', icon: RotateCcw, sectionId: 'sobriety' },
  { id: 'habits', label: 'Habits', description: 'Track and build daily habits', href: '/habits', icon: CheckCircle, sectionId: 'daily_practice' },
  { id: 'gratitude', label: 'Gratitude Journal', description: 'Daily gratitude entries', href: '/gratitude', icon: Heart, sectionId: 'daily_practice' },
  { id: 'stoic', label: 'Stoic Handbook', description: 'Stoic reflections and practices', href: '/stoic', icon: BookOpen, sectionId: 'daily_practice' },
  { id: 'steps', label: 'Steps', description: 'Daily step count', href: '/steps', icon: Footprints, sectionId: 'health' },
  { id: 'workouts', label: 'Workouts', description: 'Exercise & activity', href: '/workouts', icon: Dumbbell, sectionId: 'health' },
  { id: 'fasting', label: 'Fasting', description: 'Intermittent fasting tracking', href: '/fasting', icon: Clock, sectionId: 'health' },
];

const SECTION_TITLES: Record<SectionId, string> = {
  health: 'Health',
  sobriety: 'Sobriety',
  daily_practice: 'Daily Practice',
};

/** Default dashboard order (matches MODULES order). */
export const DEFAULT_DASHBOARD_ORDER: (keyof AppVisibility)[] = MODULES.map((m) => m.id);

/** Default section order: Sobriety first, then Daily Practice, then Health. */
export const DEFAULT_SECTION_ORDER: SectionId[] = ['sobriety', 'daily_practice', 'health'];

/** Section groups derived from MODULES. Use for settings and dashboard grouping. */
export function getSectionGroups(): Record<
  SectionId,
  { title: string; moduleIds: (keyof AppVisibility)[] }
> {
  const groups: Record<SectionId, { title: string; moduleIds: (keyof AppVisibility)[] }> = {
    health: { title: SECTION_TITLES.health, moduleIds: [] },
    sobriety: { title: SECTION_TITLES.sobriety, moduleIds: [] },
    daily_practice: { title: SECTION_TITLES.daily_practice, moduleIds: [] },
  };
  for (const m of MODULES) {
    groups[m.sectionId].moduleIds.push(m.id);
  }
  return groups;
}

/** id -> href for analytics and links. */
export const MODULE_HREFS: Record<keyof AppVisibility, string> = Object.fromEntries(
  MODULES.map((m) => [m.id, m.href])
) as Record<keyof AppVisibility, string>;
