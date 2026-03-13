import { z } from 'zod';
import { sharedColors } from '../../../lib/theme';
import type { EventType } from '@personal-os/types';

export const EVENT_TYPE_CONFIG: Record<EventType, { color: string; label: string; icon: string }> = {
  meeting: { color: sharedColors.work, label: 'Meeting', icon: 'people-outline' },
  study: { color: sharedColors.growth, label: 'Study', icon: 'book-outline' },
  personal: { color: sharedColors.personal, label: 'Personal', icon: 'person-outline' },
  bill: { color: sharedColors.bill, label: 'Bill', icon: 'receipt-outline' },
};

export const VIEW_MODES = ['Month', 'Week', 'Day'] as const;
export type ViewMode = typeof VIEW_MODES[number];
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['meeting', 'study', 'personal', 'bill']),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
}).refine((data) => data.end_time > data.start_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

export type EventFormInput = z.infer<typeof eventSchema>;

export function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
