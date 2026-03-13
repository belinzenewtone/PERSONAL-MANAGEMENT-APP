import { supabase } from '../../lib/supabase';
import type { MerchantCategoryRule } from '@personal-os/types';

function normalizeMerchantName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const merchantLearningService = {
  normalizeMerchantName,

  inferCategory: async (userId: string, merchant: string | null | undefined) => {
    if (!merchant) return null;
    const normalized = normalizeMerchantName(merchant);
    if (!normalized) return null;

    const { data, error } = await supabase
      .from('merchant_category_rules')
      .select('category')
      .eq('user_id', userId)
      .eq('normalized_merchant', normalized)
      .maybeSingle();

    if (error) throw error;
    return data?.category ?? null;
  },

  learnCategory: async (userId: string, merchant: string | null | undefined, category: string) => {
    if (!merchant?.trim() || !category.trim()) return null;

    const normalized = normalizeMerchantName(merchant);
    if (!normalized) return null;

    const { data, error } = await supabase
      .from('merchant_category_rules')
      .upsert(
        {
          user_id: userId,
          merchant: merchant.trim(),
          normalized_merchant: normalized,
          category: category.trim(),
        },
        { onConflict: 'user_id,normalized_merchant' },
      )
      .select()
      .single<MerchantCategoryRule>();

    if (error) throw error;
    return data;
  },
};
