import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learningService } from './learning.service';
import { useAuthStore } from '../../store/auth.store';
import type { CreateLearningSessionInput } from '@personal-os/types';

export function useLearningSessions(days = 30) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['learning', userId, days],
    queryFn:  () => learningService.getAll(userId!, days),
    enabled:  !!userId,
  });
}

export function useCreateSession() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (input: CreateLearningSessionInput) => learningService.create(userId!, input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['learning', userId] }),
  });
}

export function useToggleSession() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      learningService.toggleComplete(id, completed),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['learning', userId] }),
  });
}

export function useDeleteSession() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (id: string) => learningService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['learning', userId] }),
  });
}
