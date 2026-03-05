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
