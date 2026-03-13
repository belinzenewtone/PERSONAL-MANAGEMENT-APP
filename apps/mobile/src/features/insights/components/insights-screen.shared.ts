import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { sharedColors } from '../../../lib/theme';
import type { InsightCard } from '../insights.service';

export const sessionSchema = z.object({
  topic: z.string().min(1, 'Topic required'),
  duration_minutes: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter minutes'),
  completed: z.boolean(),
});

export type SessionInput = z.infer<typeof sessionSchema>;

export const PRIORITY_COLOR = {
  high: sharedColors.danger,
  medium: sharedColors.warning,
  low: sharedColors.success,
} as const;

export const TYPE_ICON: Record<InsightCard['type'], React.ComponentProps<typeof Ionicons>['name']> = {
  spending: 'wallet-outline',
  productivity: 'checkmark-done-outline',
  learning: 'school-outline',
  forecast: 'trending-up-outline',
  tip: 'bulb-outline',
};

export const INSIGHT_TABS = [
  { key: 'ai', label: 'AI' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'learning', label: 'Learning' },
] as const;
