import { supabase } from '../../lib/supabase';
import type { LearningSession, CreateLearningSessionInput } from '@personal-os/types';

export const learningService = {
  getAll: async (userId: string, days = 30): Promise<LearningSession[]> => {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data, error } = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  create: async (userId: string, input: CreateLearningSessionInput): Promise<LearningSession> => {
    const { data, error } = await supabase
      .from('learning_sessions')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  toggleComplete: async (id: string, completed: boolean): Promise<void> => {
    const { error } = await supabase
      .from('learning_sessions')
      .update({ completed })
      .eq('id', id);
    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('learning_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  getWeeklyHours: (sessions: LearningSession[]): { day: string; hours: number }[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<number, number> = {};
    const weekAgo = Date.now() - 7 * 86400000;
    sessions
      .filter((s) => new Date(s.created_at).getTime() > weekAgo)
      .forEach((s) => {
        const dow = new Date(s.created_at).getDay();
        map[dow] = (map[dow] ?? 0) + Number(s.duration_minutes);
      });
    return days.map((day, i) => ({ day, hours: Math.round((map[i] ?? 0) / 60 * 10) / 10 }));
  },
};
