import { supabase } from '../../lib/supabase';

export interface SearchResultSection {
  title: string;
  items: { id: string; title: string; subtitle: string; route: string }[];
}

export const searchService = {
  searchWorkspace: async (userId: string, query: string): Promise<SearchResultSection[]> => {
    const normalized = query.trim();
    if (!normalized) return [];

    const like = `%${normalized}%`;
    const [tasks, transactions, events, recurring] = await Promise.all([
      supabase.from('tasks').select('id,title,category').eq('user_id', userId).or(`title.ilike.${like},description.ilike.${like}`).limit(6),
      supabase.from('transactions').select('id,category,description,amount').eq('user_id', userId).or(`category.ilike.${like},description.ilike.${like}`).limit(6),
      supabase.from('events').select('id,title,type').eq('user_id', userId).or(`title.ilike.${like}`).limit(6),
      supabase.from('recurring_templates').select('id,title,entity_type').eq('user_id', userId).or(`title.ilike.${like},description.ilike.${like}`).limit(6),
    ]);

    const sections: SearchResultSection[] = [];

    if (tasks.data?.length) {
      sections.push({
        title: 'Tasks',
        items: tasks.data.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.category,
          route: '/(tabs)/tasks',
        })),
      });
    }

    if (transactions.data?.length) {
      sections.push({
        title: 'Finance',
        items: transactions.data.map((item) => ({
          id: item.id,
          title: item.description || item.category,
          subtitle: `KES ${Number(item.amount).toLocaleString()} · ${item.category}`,
          route: '/(tabs)/finance',
        })),
      });
    }

    if (events.data?.length) {
      sections.push({
        title: 'Calendar',
        items: events.data.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.type,
          route: '/(tabs)/calendar',
        })),
      });
    }

    if (recurring.data?.length) {
      sections.push({
        title: 'Recurring',
        items: recurring.data.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.entity_type,
          route: '/recurring',
        })),
      });
    }

    return sections;
  },
};
