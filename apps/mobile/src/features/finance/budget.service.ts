import { supabase } from '../../lib/supabase';

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    amount: number;
    period: string;
    created_at: string;
}

export const budgetService = {
    async getBudgets(): Promise<Budget[]> {
        const { data, error } = await supabase
            .from('budgets')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async upsertBudget(budget: Partial<Budget>): Promise<Budget> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('budgets')
            .upsert({ ...budget, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteBudget(id: string): Promise<void> {
        const { error } = await supabase
            .from('budgets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
