import { useQuery } from '@tanstack/react-query';
import { insightsService } from './insights.service';
import { useAuthStore } from '../../store/auth.store';

export function useAiInsights() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['ai-insights', userId],
    queryFn:  insightsService.fetchAiInsights,
    enabled:  !!userId,
    staleTime: 1000 * 60 * 30, // cache for 30 min — don't spam OpenAI
    retry: 1,
  });
}
