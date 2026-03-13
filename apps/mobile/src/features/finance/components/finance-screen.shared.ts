import { z } from 'zod';
import type { Transaction, TransactionSource } from '@personal-os/types';
import type { FilterPeriod } from '../finance.service';

export const FILTERS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

export const SOURCES: { value: TransactionSource; label: string; icon: string }[] = [
  { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' },
];

export const txSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1).refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  category: z.string().min(1, 'Select a category'),
  description: z.string().optional(),
  source: z.enum(['mpesa', 'bank', 'cash']),
  mpesa_code: z.string().optional(),
  transaction_date: z.string().min(1),
});

export type TxFormInput = z.infer<typeof txSchema>;

export const fmt = (n: number) =>
  'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function groupByDate(transactions: Transaction[]) {
  const groups: { date: string; items: Transaction[] }[] = [];
  const map: Record<string, Transaction[]> = {};

  transactions.forEach((t) => {
    const key = t.transaction_date.slice(0, 10);
    if (!map[key]) {
      map[key] = [];
      groups.push({ date: key, items: map[key] });
    }
    map[key].push(t);
  });

  return groups;
}

export function toLocalDateString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
