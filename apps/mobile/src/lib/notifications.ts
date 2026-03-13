/**
 * Notification service — uses dynamic import to avoid crashing in Expo Go.
 * expo-notifications remote push support was removed from Expo Go in SDK 53.
 * All functions silently no-op in Expo Go; work fully in dev builds / APK.
 */
import Constants from 'expo-constants';
import { usePreferencesStore } from '../store/preferences.store';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const MS_1H = 60 * 60 * 1000;
const MS_10M = 10 * 60 * 1000;

// Lazy module reference — loaded once, only outside Expo Go
let _N: typeof import('expo-notifications') | null = null;
let _handlerSet = false;

function notificationsEnabledInPreferences() {
  return usePreferencesStore.getState().notificationsEnabled;
}

async function getN() {
  if (IS_EXPO_GO) return null;
  if (_N) return _N;
  try {
    _N = await import('expo-notifications');
    if (!_handlerSet) {
      _N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      _handlerSet = true;
    }
    return _N;
  } catch {
    return null;
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await getN();
  if (!N) return false;
  try {
    const { status: existing } = await N.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function checkNotificationPermissions(): Promise<boolean> {
  const N = await getN();
  if (!N) return false;
  try {
    const permission = await N.getPermissionsAsync();
    return permission.granted || permission.status === 'granted';
  } catch {
    return false;
  }
}

export async function disableNotificationDelivery(): Promise<void> {
  const N = await getN();
  if (!N) return;
  await Promise.allSettled([
    N.cancelAllScheduledNotificationsAsync(),
    N.dismissAllNotificationsAsync(),
    N.setBadgeCountAsync(0),
  ]);
}

export async function sendInstantNotification(title: string, body: string): Promise<void> {
  if (!notificationsEnabledInPreferences()) return;
  const N = await getN();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {
    // Silently ignore scheduling errors
  }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function scheduleIfFuture(
  identifier: string,
  triggerMs: number,
  title: string,
  body: string,
): Promise<void> {
  if (!notificationsEnabledInPreferences()) return;
  const delay = triggerMs - Date.now();
  if (delay <= 0) return;
  const N = await getN();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.round(delay / 1000),
      },
    });
  } catch {
    // Silently ignore scheduling errors
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function scheduleTaskNotifications(task: {
  id: string;
  title: string;
  deadline: string | null;
}): Promise<void> {
  if (!task.deadline) return;
  const deadline = new Date(task.deadline).getTime();
  await cancelTaskNotifications(task.id);
  await Promise.all([
    scheduleIfFuture(`task-${task.id}-1h`, deadline - MS_1H, '⏰ Task due in 1 hour', task.title),
    scheduleIfFuture(`task-${task.id}-10m`, deadline - MS_10M, '🔴 Task due in 10 minutes', task.title),
  ]);
}

export async function cancelTaskNotifications(taskId: string): Promise<void> {
  const N = await getN();
  if (!N) return;
  await Promise.allSettled([
    N.cancelScheduledNotificationAsync(`task-${taskId}-1h`),
    N.cancelScheduledNotificationAsync(`task-${taskId}-10m`),
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
    scheduleIfFuture(`event-${event.id}-1h`, startMs - MS_1H, '📅 Event in 1 hour', event.title),
    scheduleIfFuture(`event-${event.id}-10m`, startMs - MS_10M, '🔔 Event starting in 10 minutes', event.title),
  ]);
}

export async function cancelEventNotifications(eventId: string): Promise<void> {
  const N = await getN();
  if (!N) return;
  await Promise.allSettled([
    N.cancelScheduledNotificationAsync(`event-${eventId}-1h`),
    N.cancelScheduledNotificationAsync(`event-${eventId}-10m`),
  ]);
}
