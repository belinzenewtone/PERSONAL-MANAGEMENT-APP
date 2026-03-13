import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemeMode } from '../lib/theme';

interface PreferencesState {
  hasHydrated: boolean;
  hasPromptedNotificationPermission: boolean;
  hasPromptedSmsPermission: boolean;
  biometricLockEnabled: boolean;
  notificationsEnabled: boolean;
  budgetAlertsEnabled: boolean;
  dailyDigestEnabled: boolean;
  assistantSuggestionsEnabled: boolean;
  themeMode: ThemeMode;
  setHydrated: (hydrated: boolean) => void;
  setHasPromptedNotificationPermission: (value: boolean) => void;
  setHasPromptedSmsPermission: (value: boolean) => void;
  setBiometricLockEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBudgetAlertsEnabled: (enabled: boolean) => void;
  setDailyDigestEnabled: (enabled: boolean) => void;
  setAssistantSuggestionsEnabled: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      hasPromptedNotificationPermission: false,
      hasPromptedSmsPermission: false,
      biometricLockEnabled: true,
      notificationsEnabled: true,
      budgetAlertsEnabled: true,
      dailyDigestEnabled: true,
      assistantSuggestionsEnabled: true,
      themeMode: 'dark',
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      setHasPromptedNotificationPermission: (hasPromptedNotificationPermission) => set({ hasPromptedNotificationPermission }),
      setHasPromptedSmsPermission: (hasPromptedSmsPermission) => set({ hasPromptedSmsPermission }),
      setBiometricLockEnabled: (biometricLockEnabled) => set({ biometricLockEnabled }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBudgetAlertsEnabled: (budgetAlertsEnabled) => set({ budgetAlertsEnabled }),
      setDailyDigestEnabled: (dailyDigestEnabled) => set({ dailyDigestEnabled }),
      setAssistantSuggestionsEnabled: (assistantSuggestionsEnabled) => set({ assistantSuggestionsEnabled }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'personal-os-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasPromptedNotificationPermission: state.hasPromptedNotificationPermission,
        hasPromptedSmsPermission: state.hasPromptedSmsPermission,
        biometricLockEnabled: state.biometricLockEnabled,
        notificationsEnabled: state.notificationsEnabled,
        budgetAlertsEnabled: state.budgetAlertsEnabled,
        dailyDigestEnabled: state.dailyDigestEnabled,
        assistantSuggestionsEnabled: state.assistantSuggestionsEnabled,
        themeMode: state.themeMode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
