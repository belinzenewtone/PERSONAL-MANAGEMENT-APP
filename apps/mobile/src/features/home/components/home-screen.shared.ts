import { sharedColors } from '../../../lib/theme';

export const PRIORITY_COLOR: Record<string, string> = {
  low: sharedColors.low,
  medium: sharedColors.medium,
  high: sharedColors.high,
};

export const CATEGORY_COLOR: Record<string, string> = {
  work: sharedColors.work,
  growth: sharedColors.growth,
  personal: sharedColors.personal,
};

export const QUICK_ACTIONS = [
  { label: 'Assistant', icon: 'sparkles-outline', route: '/(tabs)/assistant', color: sharedColors.accent },
  { label: 'Add Task', icon: 'checkmark-circle-outline', route: '/(tabs)/tasks', color: sharedColors.work },
  { label: 'Finance', icon: 'wallet-outline', route: '/(tabs)/finance', color: sharedColors.success },
  { label: 'Search', icon: 'search-outline', route: '/search', color: sharedColors.teal },
  { label: 'Review', icon: 'time-outline', route: '/week-review', color: sharedColors.warning },
] as const;
