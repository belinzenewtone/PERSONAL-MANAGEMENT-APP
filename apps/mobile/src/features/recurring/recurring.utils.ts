import { addDays, addMonths, addWeeks, addYears } from 'date-fns';
import type { RecurringFrequency } from '@personal-os/types';

export function getNextRecurringRun(date: string | Date, frequency: RecurringFrequency) {
  const current = new Date(date);
  switch (frequency) {
    case 'daily':
      return addDays(current, 1).toISOString();
    case 'weekly':
      return addWeeks(current, 1).toISOString();
    case 'monthly':
      return addMonths(current, 1).toISOString();
    case 'yearly':
      return addYears(current, 1).toISOString();
  }
}
