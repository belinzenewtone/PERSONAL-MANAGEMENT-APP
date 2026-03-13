import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from './tasks.service';
import { useAuthStore } from '../../store/auth.store';
import {
  scheduleTaskNotifications,
  cancelTaskNotifications,
} from '../../lib/notifications';
import type { CreateTaskInput, UpdateTaskInput, TaskStatus } from '@personal-os/types';

export const TASK_KEYS = {
  all:   (userId: string) => ['tasks', userId] as const,
  today: (userId: string) => ['tasks', userId, 'today'] as const,
  upcoming: (userId: string, days: number, limit: number) => ['tasks', userId, 'upcoming', days, limit] as const,
  analytics: (userId: string) => ['tasks', userId, 'analytics'] as const,
};

export function useTasks() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: TASK_KEYS.all(userId!),
    queryFn:  () => tasksService.getAll(userId!),
    enabled:  !!userId,
  });
}

export function useTodayTasks() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: TASK_KEYS.today(userId!),
    queryFn:  () => tasksService.getTodayTasks(userId!),
    enabled:  !!userId,
  });
}

export function useUpcomingTasks(days = 3, limit = 6) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: TASK_KEYS.upcoming(userId!, days, limit),
    queryFn: () => tasksService.getUpcomingTasks(userId!, days, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsTasks() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: TASK_KEYS.analytics(userId!),
    queryFn: () => tasksService.getAnalyticsTasks(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateTask() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksService.create(userId!, input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
      scheduleTaskNotifications(task).catch(() => {});
    },
  });
}

export function useUpdateTask() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateTaskInput & { id: string }) =>
      tasksService.update(id, input),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
      // Reschedule with new deadline (or cancel if deadline cleared)
      scheduleTaskNotifications(task).catch(() => {});
    },
  });
}

export function useUpdateTaskStatus() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
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
    onSuccess: (_data, { id, status }) => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
      // Cancel reminders when task is marked done
      if (status === 'done') cancelTaskNotifications(id).catch(() => {});
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useDeleteTask() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (taskId: string) => tasksService.delete(taskId),
    onMutate: (taskId) => {
      // Cancel notifications immediately (before server confirms)
      cancelTaskNotifications(taskId).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useSetTaskPinned() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) => tasksService.setPinned(id, isPinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}
