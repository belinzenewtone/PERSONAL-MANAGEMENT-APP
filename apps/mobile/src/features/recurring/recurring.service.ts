import { supabase } from '../../lib/supabase';
import type {
  CreateRecurringTemplateInput,
  RecurringEntityType,
  RecurringTemplate,
  UpdateRecurringTemplateInput,
} from '@personal-os/types';
import { getNextRecurringRun } from './recurring.utils';

function asText(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

async function materializeTemplate(userId: string, template: RecurringTemplate) {
  const payload = template.config ?? {};

  if (template.entity_type === 'task') {
    const { error } = await supabase.from('tasks').insert({
      user_id: userId,
      title: template.title,
      description: template.description,
      category: asText(payload.category) ?? 'personal',
      priority: asText(payload.priority) ?? 'medium',
      estimated_minutes: asNumber(payload.estimated_minutes) || null,
      deadline: template.next_run_at,
      status: 'todo',
      recurring: true,
      frequency: template.frequency,
      recurring_parent_id: asText(payload.recurring_parent_id),
      ticket_reference: asText(payload.ticket_reference),
    });
    if (error) throw error;
    return;
  }

  if (template.entity_type === 'event') {
    const durationMinutes = asNumber(payload.duration_minutes) || 60;
    const endTime = new Date(new Date(template.next_run_at).getTime() + durationMinutes * 60000).toISOString();
    const { error } = await supabase.from('events').insert({
      user_id: userId,
      title: template.title,
      start_time: template.next_run_at,
      end_time: endTime,
      type: asText(payload.type) ?? 'personal',
      related_task_id: asText(payload.related_task_id),
    });
    if (error) throw error;
    return;
  }

  const transactionType: RecurringEntityType = template.entity_type;
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    amount: asNumber(payload.amount),
    type: transactionType === 'income' ? 'income' : 'expense',
    category: asText(payload.category) ?? (transactionType === 'income' ? 'Income' : 'Recurring'),
    description: template.description,
    source: asText(payload.source) ?? 'cash',
    transaction_date: template.next_run_at,
    auto_imported: false,
  });
  if (error) throw error;
}

export const recurringService = {
  listTemplates: async (userId: string): Promise<RecurringTemplate[]> => {
    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', userId)
      .order('next_run_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  createTemplate: async (userId: string, input: CreateRecurringTemplateInput): Promise<RecurringTemplate> => {
    const { data, error } = await supabase
      .from('recurring_templates')
      .insert({ ...input, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTemplate: async (templateId: string, input: UpdateRecurringTemplateInput): Promise<RecurringTemplate> => {
    const { data, error } = await supabase
      .from('recurring_templates')
      .update(input)
      .eq('id', templateId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    const { error } = await supabase.from('recurring_templates').delete().eq('id', templateId);
    if (error) throw error;
  },

  materializeDueTemplates: async (userId: string): Promise<number> => {
    const { data: templates, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .lte('next_run_at', new Date().toISOString())
      .order('next_run_at', { ascending: true });

    if (error) throw error;
    if (!templates?.length) return 0;

    for (const template of templates) {
      await materializeTemplate(userId, template);
      const nextDate = getNextRecurringRun(template.next_run_at, template.frequency);
      const { error: updateError } = await supabase
        .from('recurring_templates')
        .update({
          last_run_at: template.next_run_at,
          next_run_at: nextDate,
        })
        .eq('id', template.id);
      if (updateError) throw updateError;
    }

    return templates.length;
  },
};
