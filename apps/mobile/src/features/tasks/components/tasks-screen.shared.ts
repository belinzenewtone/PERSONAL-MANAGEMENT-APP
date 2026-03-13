import { z } from 'zod';
import { sharedColors } from '../../../lib/theme';
import type { TaskCategory, TaskPriority } from '@personal-os/types';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'growth', 'personal']),
  priority: z.enum(['low', 'medium', 'high']),
  recurring: z.boolean(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
});

export type TaskFormInput = z.infer<typeof taskSchema>;

export const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: sharedColors.work },
  { value: 'growth', label: 'Growth', color: sharedColors.growth },
  { value: 'personal', label: 'Personal', color: sharedColors.personal },
];

export const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: sharedColors.low },
  { value: 'medium', label: 'Medium', color: sharedColors.medium },
  { value: 'high', label: 'High', color: sharedColors.high },
];

export const TABS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'growth', label: 'Growth' },
  { value: 'personal', label: 'Personal' },
];

export const FREQUENCIES: { value: string; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const URGENCY_COLORS = {
  overdue: sharedColors.danger,
  urgent: sharedColors.danger,
  soon: sharedColors.warning,
  normal: sharedColors.muted,
} as const;
