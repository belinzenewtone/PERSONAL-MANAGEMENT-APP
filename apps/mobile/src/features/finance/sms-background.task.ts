/**
 * Background SMS Auto-Import Task
 * Runs periodically (every 15 min when app is in background)
 * to detect new M-Pesa messages and import them automatically.
 *
 * NOTE: Requires a development/production build (not Expo Go).
 * Register this task in your root _layout.tsx.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../../lib/supabase';
import { checkSmsPermission, importMpesaSms, commitImport } from './sms-import.service';

export const SMS_BACKGROUND_TASK = 'mpesa-sms-background-import';

TaskManager.defineTask(SMS_BACKGROUND_TASK, async () => {
  try {
    const hasPermission = await checkSmsPermission();
    if (!hasPermission) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return BackgroundFetch.BackgroundFetchResult.NoData;

    const userId = session.user.id;
    const result = await importMpesaSms(userId, 1); // only scan last 1 day in background

    if (result.imported.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

    await commitImport(userId, result.imported);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerSmsBackgroundTask(): Promise<void> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_BACKGROUND_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(SMS_BACKGROUND_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate:  false,
        startOnBoot:      true,
      });
    }
  } catch {
    // Silently fail — background fetch may not be available in all environments
  }
}

export async function unregisterSmsBackgroundTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(SMS_BACKGROUND_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(SMS_BACKGROUND_TASK);
    }
  } catch { /* ignore */ }
}
