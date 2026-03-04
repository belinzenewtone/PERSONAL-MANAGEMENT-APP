import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService, FilterPeriod } from './finance.service';
import { useAuthStore } from '../../store/auth.store';
import type { CreateTransactionInput, UpdateTransactionInput } from '@personal-os/types';

export const FINANCE_KEYS = {
  all:    (userId: string, period: FilterPeriod) => ['transactions', userId, period] as const,
};

export function useTransactions(period: FilterPeriod = 'month') {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: FINANCE_KEYS.all(userId!, period),
    queryFn:  () => financeService.getAll(userId!, period),
    enabled:  !!userId,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => financeService.create(userId!, input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['transactions', userId] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTransactionInput & { id: string }) =>
      financeService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions', userId] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (id: string) => financeService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['transactions', userId] }),
  });
}
