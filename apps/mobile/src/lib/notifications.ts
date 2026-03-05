import * as Notifications from 'expo-notifications';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MS_1H  = 60 * 60 * 1000;
const MS_10M = 10 * 60 * 1000;

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleIfFuture(
  identifier: string,
  triggerMs: number,
  title: string,
  body: string,
): Promise<void> {
  const delay = triggerMs - Date.now();
  if (delay <= 0) return;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(delay / 1000) },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function scheduleTaskNotifications(task: {
  id: string;
  title: string;
  deadline: string | null;
}): Promise<void> {
  if (!task.deadline) return;
  const deadline = new Date(task.deadline).getTime();
  // Cancel first so we don't duplicate if rescheduling after an edit
  await cancelTaskNotifications(task.id);
  await Promise.all([
    scheduleIfFuture(
      `task-${task.id}-1h`,
      deadline - MS_1H,
      '⏰ Task due in 1 hour',
      task.title,
    ),
    scheduleIfFuture(
      `task-${task.id}-10m`,
      deadline - MS_10M,
      '🔴 Task due in 10 minutes',
      task.title,
    ),
  ]);
}

export async function cancelTaskNotifications(taskId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`task-${taskId}-1h`),
    Notifications.cancelScheduledNotificationAsync(`task-${taskId}-10m`),
  ]);
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function scheduleEventNotifications(event: {
  id: string;
  title: string;
  start_time: string;
}): Promise<void> {
  const startMs = new Date(event.start_time).getTime();
  await cancelEventNotifications(event.id);
  await Promise.all([
    scheduleIfFuture(
      `event-${event.id}-1h`,
      startMs - MS_1H,
      '📅 Event in 1 hour',
      event.title,
    ),
    scheduleIfFuture(
      `event-${event.id}-10m`,
      startMs - MS_10M,
      '🔔 Event starting in 10 minutes',
      event.title,
    ),
  ]);
}

export async function cancelEventNotifications(eventId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`event-${eventId}-1h`),
    Notifications.cancelScheduledNotificationAsync(`event-${eventId}-10m`),
  ]);
}
