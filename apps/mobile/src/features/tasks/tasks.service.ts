import { supabase } from '../../lib/supabase';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@personal-os/types';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const tasksService = {
  getAll: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },

  getByStatus: async (userId: string, status: TaskStatus): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('deadline', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },

  getTodayTasks: async (userId: string): Promise<Task[]> => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'done')
      .or(`deadline.gte.${start},deadline.is.null`)
      .lte('deadline', end)
      .order('priority');
    if (error) throw error;
    return data ?? [];
  },

  create: async (userId: string, input: CreateTaskInput): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (taskId: string, input: UpdateTaskInput): Promise<Task> => {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateStatus: async (taskId: string, status: TaskStatus): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', taskId);
    if (error) throw error;
  },

  delete: async (taskId: string): Promise<void> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
  },

  getNextDeadline: (current: string | Date, frequency: Frequency): string => {
    const d = new Date(current);
    switch (frequency) {
      case 'daily': return addDays(d, 1).toISOString();
      case 'weekly': return addWeeks(d, 1).toISOString();
      case 'monthly': return addMonths(d, 1).toISOString();
      case 'yearly': return addYears(d, 1).toISOString();
      default: return d.toISOString();
    }
  },
};

