import { CheckCircle, Target, Calendar, Clock, Footprints, Dumbbell, Heart, BookOpen, RotateCcw, ClipboardList } from 'lucide-react-native';
import type { DashboardData } from './dashboard';
import { formatCompact, formatStepsLeft } from '@/utils/format';

/** Card id -> image source for full (expanded) dashboard cards. Static require for Metro. */
export const CARD_IMAGES: Record<string, number> = {
  habits: require('@/assets/images/habits.jpg'),
  daily_renewal: require('@/assets/images/timer.jpeg'),
  sobriety: require('@/assets/images/sobriety.jpg'),
  fasting: require('@/assets/images/fasting.jpeg'),
  inventory: require('@/assets/images/step11.jpg'),
  step10: require('@/assets/images/inventory.jpg'),
  steps: require('@/assets/images/steps.jpeg'),
  workouts: require('@/assets/images/workout.jpeg'),
  gratitude: require('@/assets/images/gratitude.jpeg'),
  stoic: require('@/assets/images/stoic.jpeg'),
};

export type CardConfig = {
  id: string;
  title: string;
  href: string;
  icon: typeof CheckCircle;
  /** Flat background color for the icon banner area (dark mode). */
  bannerColorDark: string;
  /** Flat background color for the icon banner area (light mode). */
  bannerColorLight: string;
  iconColorLight: string;
  badgeColorLight: string;
  textColorLight: string;
  badgeColorDark: string;
  textColorDark: string;
  getSubtitle: (data: DashboardData) => string;
  getBadgeText: (data: DashboardData) => string;
};

/**
 * Dashboard card configurations.
 * All cards use flat muted colors — no gradients, no bright tones.
 * Badge colors use the primary brass/amber with low opacity.
 */
export const getCardConfigs = (_dailyProgress: DashboardData): Record<string, CardConfig> => ({
  habits: {
    id: 'habits',
    title: 'Habits',
    href: '/habits',
    icon: CheckCircle,
    bannerColorDark: '#2A2418',
    bannerColorLight: '#F5EFE0',
    iconColorLight: '#8C7030',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => {
      if (!data.hasHabits) return 'No habits added';
      return data.habitsCompleted === data.habitsTotal
        ? 'All habits done'
        : `${formatCompact(data.habitsCompleted)}/${formatCompact(data.habitsTotal)} complete`;
    },
    getBadgeText: (data) =>
      !data.hasHabits ? '—' : `${formatCompact(data.habitsCompleted)}/${formatCompact(data.habitsTotal)}`,
  },
  daily_renewal: {
    id: 'daily_renewal',
    title: 'Daily Renewal',
    href: '/daily-renewal',
    icon: RotateCcw,
    bannerColorDark: '#1E1A12',
    bannerColorLight: '#F0EAD8',
    iconColorLight: '#8C7030',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: () => 'One day at a time',
    getBadgeText: (data) =>
      !data.hasSobrietyCounters ? '—' : data.dailyRenewalCountdown,
  },
  sobriety: {
    id: 'sobriety',
    title: 'Sobriety',
    href: '/sobriety',
    icon: Target,
    bannerColorDark: '#1E1A12',
    bannerColorLight: '#F0EAD8',
    iconColorLight: '#8C7030',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) =>
      !data.hasSobrietyCounters ? 'No trackers added' : 'Sober today',
    getBadgeText: (data) =>
      !data.hasSobrietyCounters ? '—' : `${formatCompact(data.sobrietyDays)}d`,
  },
  fasting: {
    id: 'fasting',
    title: 'Fasting',
    href: '/fasting',
    icon: Clock,
    bannerColorDark: '#241C10',
    bannerColorLight: '#F5EDD8',
    iconColorLight: '#A07830',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => `${formatCompact(data.fastingHours)}h fasted today`,
    getBadgeText: (data) =>
      data.fastingHoursGoal > 0
        ? `${formatCompact(data.fastingHours)}/${formatCompact(data.fastingHoursGoal)}h`
        : `${formatCompact(data.fastingHours)}h`,
  },
  step10: {
    id: 'step10',
    title: 'Step 10',
    href: '/inventory',
    icon: ClipboardList,
    bannerColorDark: '#1A2014',
    bannerColorLight: '#EEF2E4',
    iconColorLight: '#6A7A40',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => {
      if (data.inventoryCount === 0) return 'Not started';
      return 'Spot-check inventory';
    },
    getBadgeText: (data) => formatCompact(data.inventoryCount),
  },
  step11: {
    id: 'step11',
    title: 'Step 11',
    href: '/step11',
    icon: Calendar,
    bannerColorDark: '#1A2014',
    bannerColorLight: '#EEF2E4',
    iconColorLight: '#6A7A40',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => {
      if (data.inventoryCount === 0) return 'Not started';
      if (data.inventoriesPerDayGoal > 0 && data.inventoryCount >= data.inventoriesPerDayGoal)
        return 'All completed';
      return 'Started';
    },
    getBadgeText: (data) =>
      data.inventoriesPerDayGoal > 0
        ? `${formatCompact(data.inventoryCount)}/${formatCompact(data.inventoriesPerDayGoal)}`
        : formatCompact(data.inventoryCount),
  },
  steps: {
    id: 'steps',
    title: 'Steps',
    href: '/steps',
    icon: Footprints,
    bannerColorDark: '#1C1A14',
    bannerColorLight: '#F0EDE0',
    iconColorLight: '#8A7A50',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => {
      const stepsLeft = Math.max(0, data.stepsGoal - data.stepsCount);
      if (data.stepsGoal > 0) {
        return `${formatCompact(stepsLeft)} steps left`;
      }
      return `${formatCompact(data.stepsCount)} steps`;
    },
    getBadgeText: (data) => {
      const stepsLeft = Math.max(0, data.stepsGoal - data.stepsCount);
      return data.stepsGoal > 0 ? formatStepsLeft(stepsLeft) : formatCompact(data.stepsCount);
    },
  },
  workouts: {
    id: 'workouts',
    title: 'Workouts',
    href: '/workouts',
    icon: Dumbbell,
    bannerColorDark: '#1A1810',
    bannerColorLight: '#F2EEE0',
    iconColorLight: '#8A7A48',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) =>
      data.workoutsGoal > 0
        ? `${data.workoutsCount}/${data.workoutsGoal} workouts today`
        : data.workoutsCount > 0
          ? `${data.workoutsCount} workout${data.workoutsCount === 1 ? '' : 's'} today`
          : 'No workouts yet',
    getBadgeText: (data) =>
      data.workoutsGoal > 0
        ? `${data.workoutsCount}/${data.workoutsGoal}`
        : data.workoutsCount > 0
          ? String(data.workoutsCount)
          : '—',
  },
  gratitude: {
    id: 'gratitude',
    title: 'Gratitude',
    href: '/gratitude',
    icon: Heart,
    bannerColorDark: '#241A14',
    bannerColorLight: '#F5ECE4',
    iconColorLight: '#A07048',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) => {
      if (data.gratitudeCount === 0) return 'No entries yet';
      if (data.gratitudesPerDayGoal > 0 && data.gratitudeCount >= data.gratitudesPerDayGoal)
        return 'Goal met';
      return `${formatCompact(data.gratitudeCount)} ${data.gratitudeCount === 1 ? 'entry' : 'entries'}`;
    },
    getBadgeText: (data) =>
      data.gratitudesPerDayGoal > 0
        ? `${formatCompact(data.gratitudeCount)}/${formatCompact(data.gratitudesPerDayGoal)}`
        : formatCompact(data.gratitudeCount),
  },
  stoic: {
    id: 'stoic',
    title: 'Stoic Handbook',
    href: '/stoic',
    icon: BookOpen,
    bannerColorDark: '#201A10',
    bannerColorLight: '#F5EEDC',
    iconColorLight: '#8C7030',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-primary/15',
    textColorDark: 'text-primary',
    getSubtitle: (data) =>
      data.stoicReflectionDoneToday ? "Today's reflection done" : 'Weekly reflections',
    getBadgeText: (data) => (data.stoicReflectionDoneToday ? 'Done' : '—'),
  },
});
