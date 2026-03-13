import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService, FilterPeriod } from './finance.service';
import { useAuthStore } from '../../store/auth.store';
import type { CreateTransactionInput, UpdateTransactionInput } from '@personal-os/types';

export const FINANCE_KEYS = {
  all:    (userId: string, period: FilterPeriod) => ['transactions', userId, period] as const,
  analytics: (userId: string, months: number) => ['transactions', userId, 'analytics', months] as const,
  balance: (userId: string, period: Exclude<FilterPeriod, 'all'>) => ['transactions', userId, 'balance', period] as const,
};

export function useTransactions(period: FilterPeriod = 'month') {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: FINANCE_KEYS.all(userId!, period),
    queryFn:  () => financeService.getAll(userId!, period),
    enabled:  !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useAnalyticsTransactions(months = 4) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: FINANCE_KEYS.analytics(userId!, months),
    queryFn: () => financeService.getAnalyticsTransactions(userId!, months),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useBalanceTransactions(period: Exclude<FilterPeriod, 'all'> = 'month') {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: FINANCE_KEYS.balance(userId!, period),
    queryFn: () => financeService.getBalanceTransactions(userId!, period),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
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

export function useSetTransactionPinned() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => financeService.setPinned(id, isPinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions', userId] }),
  });
}
