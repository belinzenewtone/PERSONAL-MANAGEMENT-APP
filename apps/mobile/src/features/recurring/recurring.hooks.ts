import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recurringService } from './recurring.service';
import { useAuthStore } from '../../store/auth.store';
import type { CreateRecurringTemplateInput, UpdateRecurringTemplateInput } from '@personal-os/types';

const RECURRING_KEYS = {
  templates: (userId: string) => ['recurring', userId, 'templates'] as const,
};

export function useRecurringTemplates() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: RECURRING_KEYS.templates(userId!),
    queryFn: () => recurringService.listTemplates(userId!),
    enabled: !!userId,
  });
}

export function useCreateRecurringTemplate() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringTemplateInput) => recurringService.createTemplate(userId!, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.templates(userId!) }),
  });
}

export function useUpdateRecurringTemplate() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateRecurringTemplateInput & { id: string }) =>
      recurringService.updateTemplate(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.templates(userId!) }),
  });
}

export function useDeleteRecurringTemplate() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringService.deleteTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.templates(userId!) }),
  });
}

export function useMaterializeRecurringTemplates() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recurringService.materializeDueTemplates(userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEYS.templates(userId!) });
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      queryClient.invalidateQueries({ queryKey: ['events', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    },
  });
}
