import { supabase } from '../../lib/supabase';
import type { CalendarEvent, CreateEventInput, UpdateEventInput } from '@personal-os/types';

export const calendarService = {
  getAll: async (userId: string): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  getByRange: async (userId: string, from: string, to: string): Promise<CalendarEvent[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', from)
      .lte('start_time', to)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  create: async (userId: string, input: CreateEventInput): Promise<CalendarEvent> => {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  update: async (eventId: string, input: UpdateEventInput): Promise<CalendarEvent> => {
    const { data, error } = await supabase
      .from('events')
      .update(input)
      .eq('id', eventId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  delete: async (eventId: string): Promise<void> => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
  },
};
