import { supabase } from '../../lib/supabase';

export interface InsightCard {
  id:       string;
  type:     'spending' | 'productivity' | 'learning' | 'forecast' | 'tip';
  title:    string;
  body:     string;
  icon:     string;
  priority: 'high' | 'medium' | 'low';
}

export interface AiInsightsResponse {
  insights:     InsightCard[];
  generated_at: string;
  data_summary: {
    transactions_analysed: number;
    tasks_analysed:        number;
    sessions_analysed:     number;
  };
}

export const insightsService = {
  fetchAiInsights: async (): Promise<AiInsightsResponse> => {
    const { data, error } = await supabase.functions.invoke<AiInsightsResponse>('ai-insights');
    if (error) throw error;
    if (!data) throw new Error('No data returned from AI insights function');
    return data;
  },
};
