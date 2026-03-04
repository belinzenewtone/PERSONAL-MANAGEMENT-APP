import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from './tasks.service';
import { useAuthStore } from '../../store/auth.store';
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@personal-os/types';

export const TASK_KEYS = {
  all: (userId: string) => ['tasks', userId] as const,
  today: (userId: string) => ['tasks', userId, 'today'] as const,
};

export function useTasks() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: TASK_KEYS.all(userId!),
    queryFn: () => tasksService.getAll(userId!),
    enabled: !!userId,
  });
}

export function useTodayTasks() {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: TASK_KEYS.today(userId!),
    queryFn: () => tasksService.getTodayTasks(userId!),
    enabled: !!userId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksService.create(userId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      tasksService.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['tasks', userId] });
      const prev = qc.getQueryData(TASK_KEYS.all(userId!));
      qc.setQueryData(TASK_KEYS.all(userId!), (old: any[]) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(TASK_KEYS.all(userId!), ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (taskId: string) => tasksService.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}
