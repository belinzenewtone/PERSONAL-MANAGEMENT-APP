import { useEffect, useState } from 'react';
import { financeService } from '../features/finance/finance.service';
import { budgetService } from '../features/finance/budget.service';
import { buildBudgetAlerts, buildDailyDigest } from '../features/finance/budget-insights.service';
import { profileService } from '../features/profile/profile.service';
import { recurringService } from '../features/recurring/recurring.service';
import { tasksService } from '../features/tasks/tasks.service';
import { calendarService } from '../features/calendar/calendar.service';
import { updateService } from '../features/updates/update.service';
import { AppUpdatePrompt } from '../features/updates/components/AppUpdatePrompt';
import { usePreferencesStore } from '../store/preferences.store';
import { useNotificationStateStore } from '../store/notification-state.store';
import { useAuthStore } from '../store/auth.store';
import { sendInstantNotification } from '../lib/notifications';
import type { AppUpdateRecord } from '@personal-os/types';

export function AppBootstrapper() {
  const userId = useAuthStore((s) => s.user?.id);
  const setBiometricLockEnabled = usePreferencesStore((s) => s.setBiometricLockEnabled);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const setAssistantSuggestionsEnabled = usePreferencesStore((s) => s.setAssistantSuggestionsEnabled);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const budgetAlertsEnabled = usePreferencesStore((s) => s.budgetAlertsEnabled);
  const dailyDigestEnabled = usePreferencesStore((s) => s.dailyDigestEnabled);
  const budgetAlerts = useNotificationStateStore((s) => s.budgetAlerts);
  const lastDigestDate = useNotificationStateStore((s) => s.lastDigestDate);
  const setBudgetAlert = useNotificationStateStore((s) => s.setBudgetAlert);
  const setLastDigestDate = useNotificationStateStore((s) => s.setLastDigestDate);
  const [pendingUpdate, setPendingUpdate] = useState<AppUpdateRecord | null>(null);

  useEffect(() => {
    if (!userId) return;

    profileService.getProfile(userId).then((profile) => {
      setBiometricLockEnabled(profile.biometric_lock_enabled);
      setNotificationsEnabled(profile.notifications_enabled);
      setAssistantSuggestionsEnabled(profile.assistant_suggestions_enabled);
    }).catch(() => {});

    recurringService.materializeDueTemplates(userId).catch(() => {});
    updateService.getPendingUpdate().then(setPendingUpdate).catch(() => {});
  }, [
    setAssistantSuggestionsEnabled,
    setBiometricLockEnabled,
    setNotificationsEnabled,
    userId,
  ]);

  useEffect(() => {
    if (!userId || !notificationsEnabled) return;

    const today = new Date().toISOString().slice(0, 10);

    Promise.all([
      budgetService.getBudgets(),
      financeService.getAll(userId, 'month'),
      tasksService.getTodayTasks(userId),
      calendarService.getByRange(userId, today, `${today}T23:59:59.999Z`),
    ]).then(([budgets, transactions, tasks, events]) => {
      if (budgetAlertsEnabled) {
        for (const alert of buildBudgetAlerts(budgets, transactions, today, budgetAlerts)) {
          sendInstantNotification(alert.title, alert.body).catch(() => {});
          setBudgetAlert(alert.key, today);
        }
      }

      if (dailyDigestEnabled && lastDigestDate !== today) {
        const digest = buildDailyDigest(tasks, transactions, budgets, events, new Date());
        if (digest) {
          sendInstantNotification(digest.title, digest.body).catch(() => {});
          setLastDigestDate(today);
        }
      }
    }).catch(() => {});
  }, [
    budgetAlerts,
    budgetAlertsEnabled,
    dailyDigestEnabled,
    lastDigestDate,
    notificationsEnabled,
    setBudgetAlert,
    setLastDigestDate,
    userId,
  ]);

  return (
    <AppUpdatePrompt
      update={pendingUpdate}
      onDismiss={() => setPendingUpdate(null)}
      onOpenStore={() => updateService.openStoreUrl(pendingUpdate?.store_url ?? null)}
    />
  );
}
