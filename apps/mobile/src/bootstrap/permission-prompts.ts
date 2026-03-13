import { Alert, Platform } from 'react-native';
import { checkSmsPermission, requestSmsPermission } from '../features/finance/sms-import.service';
import { checkNotificationPermissions, requestNotificationPermissions } from '../lib/notifications';

interface InitialPermissionPromptOptions {
  notificationsEnabled: boolean;
  hasPromptedNotificationPermission: boolean;
  hasPromptedSmsPermission: boolean;
  markNotificationPermissionPrompted: () => void;
  markSmsPermissionPrompted: () => void;
  isCancelled?: () => boolean;
}

function requestOptionalPermission(
  title: string,
  message: string,
  confirmLabel: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      title,
      message,
      [
        { text: 'Not now', style: 'cancel', onPress: () => finish(false) },
        { text: confirmLabel, onPress: () => finish(true) },
      ],
      { cancelable: true, onDismiss: () => finish(false) },
    );
  });
}

export async function runInitialPermissionPrompts({
  notificationsEnabled,
  hasPromptedNotificationPermission,
  hasPromptedSmsPermission,
  markNotificationPermissionPrompted,
  markSmsPermissionPrompted,
  isCancelled,
}: InitialPermissionPromptOptions): Promise<void> {
  const cancelled = () => isCancelled?.() ?? false;

  if (notificationsEnabled && !hasPromptedNotificationPermission) {
    markNotificationPermissionPrompted();
    const hasNotificationPermission = await checkNotificationPermissions();
    if (!hasNotificationPermission && !cancelled()) {
      const shouldAsk = await requestOptionalPermission(
        'Enable notifications?',
        'Get reminders for tasks, events, and finance digests. You can skip this and enable later in Settings.',
        'Allow notifications',
      );
      if (shouldAsk && !cancelled()) {
        await requestNotificationPermissions();
      }
    }
  }

  if (Platform.OS === 'android' && !hasPromptedSmsPermission) {
    markSmsPermissionPrompted();
    const hasSmsPermission = await checkSmsPermission();
    if (!hasSmsPermission && !cancelled()) {
      const shouldAsk = await requestOptionalPermission(
        'Enable SMS import?',
        'Allow SMS access to scan M-Pesa messages and import transactions automatically. You can skip and enable later.',
        'Allow SMS',
      );
      if (shouldAsk && !cancelled()) {
        await requestSmsPermission();
      }
    }
  }
}
