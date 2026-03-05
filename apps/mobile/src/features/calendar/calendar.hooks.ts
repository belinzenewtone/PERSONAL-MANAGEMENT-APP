import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from './calendar.service';
import { useAuthStore } from '../../store/auth.store';
import {
  scheduleEventNotifications,
  cancelEventNotifications,
} from '../../lib/notifications';
import type { CreateEventInput, UpdateEventInput } from '@personal-os/types';

export const EVENT_KEYS = {
  all:   (userId: string) => ['events', userId] as const,
  range: (userId: string, from: string, to: string) =>
    ['events', userId, 'range', from, to] as const,
};

export function useEvents() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: EVENT_KEYS.all(userId!),
    queryFn:  () => calendarService.getAll(userId!),
    enabled:  !!userId,
  });
}

export function useEventsByRange(from: string, to: string) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: EVENT_KEYS.range(userId!, from, to),
    queryFn:  () => calendarService.getByRange(userId!, from, to),
    enabled:  !!userId,
  });
}

export function useCreateEvent() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (input: CreateEventInput) => calendarService.create(userId!, input),
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
      scheduleEventNotifications(event).catch(() => {});
    },
  });
}

export function useUpdateEvent() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEventInput & { id: string }) =>
      calendarService.update(id, input),
    onSuccess: (event) => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
      scheduleEventNotifications(event).catch(() => {});
    },
  });
}

export function useDeleteEvent() {
  const qc     = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onMutate: (id) => {
      cancelEventNotifications(id).catch(() => {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
    },
  });
}
