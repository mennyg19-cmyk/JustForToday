import { CheckCircle, Target, Calendar, Clock, Footprints, Heart, BookOpen } from 'lucide-react-native';
import type { DashboardData } from './dashboard';

export type CardConfig = {
  id: string;
  title: string;
  href: string;
  icon: typeof CheckCircle;
  gradientDark: readonly [string, string];
  gradientLight: readonly [string, string];
  iconColorLight: string;
  badgeColorLight: string;
  textColorLight: string;
  badgeColorDark: string;
  textColorDark: string;
  getSubtitle: (data: DashboardData) => string;
  getBadgeText: (data: DashboardData) => string;
};

export const getCardConfigs = (dailyProgress: DashboardData): Record<string, CardConfig> => ({
  habits: {
    id: 'habits',
    title: 'Habits',
    href: '/habits',
    icon: CheckCircle,
    gradientDark: ['#2B1B5A', '#1A1038'] as const,
    gradientLight: ['#DDD6FE', '#EDE9FE'] as const,
    iconColorLight: '#5B21B6',
    badgeColorLight: 'bg-primary/20',
    textColorLight: 'text-primary',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) => {
      if (!data.hasHabits) return 'No habits added';
      return data.habitsCompleted === data.habitsTotal
        ? '✓ All habits done'
        : `${data.habitsCompleted}/${data.habitsTotal} complete`;
    },
    getBadgeText: (data) => (!data.hasHabits ? '—' : `${data.habitsCompleted}/${data.habitsTotal}`),
  },
  sobriety: {
    id: 'sobriety',
    title: 'Sobriety',
    href: '/sobriety',
    icon: Target,
    gradientDark: ['#1E3A8A', '#1E1B4B'] as const,
    gradientLight: ['#DBEAFE', '#EFF6FF'] as const,
    iconColorLight: '#2563EB',
    badgeColorLight: 'bg-blue-600/20',
    textColorLight: 'text-blue-600',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) =>
      !data.hasSobrietyCounters ? 'No trackers added' : 'Sober from all addictions',
    getBadgeText: (data) => (!data.hasSobrietyCounters ? '—' : `${data.sobrietyDays}d`),
  },
  fasting: {
    id: 'fasting',
    title: 'Fasting',
    href: '/fasting',
    icon: Clock,
    gradientDark: ['#7C2D12', '#431407'] as const,
    gradientLight: ['#FED7AA', '#FEE2E2'] as const,
    iconColorLight: '#EA580C',
    badgeColorLight: 'bg-orange-600/20',
    textColorLight: 'text-orange-600',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) => `${data.fastingHours}h fasted today`,
    getBadgeText: (data) =>
      data.fastingHoursGoal > 0
        ? `${data.fastingHours}/${data.fastingHoursGoal}h`
        : `${data.fastingHours}h`,
  },
  inventory: {
    id: 'inventory',
    title: 'Inventory',
    href: '/inventory',
    icon: Calendar,
    gradientDark: ['#14532D', '#052E16'] as const,
    gradientLight: ['#DCFCE7', '#F0FDF4'] as const,
    iconColorLight: '#16A34A',
    badgeColorLight: 'bg-green-600/20',
    textColorLight: 'text-green-600',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) => {
      if (data.inventoryCount === 0) return 'Not started';
      if (data.inventoriesPerDayGoal > 0 && data.inventoryCount >= data.inventoriesPerDayGoal)
        return 'All completed';
      return 'Started';
    },
    getBadgeText: (data) =>
      data.inventoriesPerDayGoal > 0
        ? `${data.inventoryCount}/${data.inventoriesPerDayGoal}`
        : `${data.inventoryCount}`,
  },
  steps: {
    id: 'steps',
    title: 'Steps & Exercise',
    href: '/steps',
    icon: Footprints,
    gradientDark: ['#312E81', '#1E1B4B'] as const,
    gradientLight: ['#C7D2FE', '#E0E7FF'] as const,
    iconColorLight: '#4F46E5',
    badgeColorLight: 'bg-indigo-600/20',
    textColorLight: 'text-indigo-600',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) => `${data.stepsCount.toLocaleString()} steps today`,
    getBadgeText: (data) =>
      data.stepsGoal > 0
        ? `${data.stepsCount.toLocaleString()}/${data.stepsGoal.toLocaleString()}`
        : `${data.stepsCount.toLocaleString()}`,
  },
  gratitude: {
    id: 'gratitude',
    title: 'Gratitude',
    href: '/gratitude',
    icon: Heart,
    gradientDark: ['#831843', '#4C0519'] as const,
    gradientLight: ['#FBCFE8', '#FCE7F3'] as const,
    iconColorLight: '#BE185D',
    badgeColorLight: 'bg-pink-600/20',
    textColorLight: 'text-pink-600',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: (data) =>
      data.gratitudeCount === 0
        ? 'No entries yet'
        : `${data.gratitudeCount} ${data.gratitudeCount === 1 ? 'entry' : 'entries'}`,
    getBadgeText: (data) => `${data.gratitudeCount}`,
  },
  stoic: {
    id: 'stoic',
    title: 'Stoic',
    href: '/stoic',
    icon: BookOpen,
    gradientDark: ['#422006', '#292524'] as const,
    gradientLight: ['#FEF3C7', '#FDE68A'] as const,
    iconColorLight: '#B45309',
    badgeColorLight: 'bg-amber-600/20',
    textColorLight: 'text-amber-700',
    badgeColorDark: 'bg-white/10',
    textColorDark: 'text-white',
    getSubtitle: () => 'Reflections & practices',
    getBadgeText: () => '—',
  },
});
