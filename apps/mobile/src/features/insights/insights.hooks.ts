import { useQuery } from '@tanstack/react-query';
import { insightsService } from './insights.service';
import { useAuthStore } from '../../store/auth.store';

interface AiInsightsOptions {
  enabled?: boolean;
}

export function useAiInsights(options?: AiInsightsOptions) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['ai-insights', userId],
    queryFn:  insightsService.fetchAiInsights,
    enabled:  !!userId && (options?.enabled ?? false),
    staleTime: 1000 * 60 * 30, // cache for 30 min — don't spam OpenAI
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
