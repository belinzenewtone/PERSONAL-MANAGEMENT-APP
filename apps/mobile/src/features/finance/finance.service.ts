import { supabase } from '../../lib/supabase';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@personal-os/types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type FilterPeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function getPeriodRange(period: FilterPeriod): { from: string; to: string } | null {
  const now = new Date();
  const ranges: Record<FilterPeriod, [Date, Date] | null> = {
    today: [startOfDay(now),  endOfDay(now)],
    week:  [startOfWeek(now), endOfWeek(now)],
    month: [startOfMonth(now),endOfMonth(now)],
    year:  [startOfYear(now), endOfYear(now)],
    all:   null,
  };
  const range = ranges[period];
  if (!range) return null;
  return { from: range[0].toISOString(), to: range[1].toISOString() };
}

export const financeService = {
  getAll: async (userId: string, period: FilterPeriod = 'month'): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    const range = getPeriodRange(period);
    if (range) {
      query = query.gte('transaction_date', range.from).lte('transaction_date', range.to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  create: async (userId: string, input: CreateTransactionInput): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (txId: string, input: UpdateTransactionInput): Promise<Transaction> => {
    const { data, error } = await supabase
      .from('transactions')
      .update(input)
      .eq('id', txId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (txId: string): Promise<void> => {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) throw error;
  },

  // Monthly summary computed client-side from fetched data
  getMonthlySummary: (transactions: Transaction[]) => {
    const income  = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const savings = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    return { income, expense, balance: income - expense, savingsRate: savings };
  },

  // Category breakdown
  getCategoryBreakdown: (transactions: Transaction[]) => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
      });
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  },

  // Daily totals for line chart (last 7 days)
  getDailyTrend: (transactions: Transaction[]) => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const day = t.transaction_date.slice(0, 10);
        map[day] = (map[day] ?? 0) + Number(t.amount);
      });
    return map;
  },
};
