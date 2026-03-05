import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService, Budget } from './budget.service';

export function useBudgets() {
    return useQuery({
        queryKey: ['budgets'],
        queryFn: () => budgetService.getBudgets(),
    });
}

export function useUpsertBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (budget: Partial<Budget>) => budgetService.upsertBudget(budget),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => budgetService.deleteBudget(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budgets'] });
        },
    });
}
