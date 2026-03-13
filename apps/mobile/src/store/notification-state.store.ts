import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationState {
  budgetAlerts: Record<string, string>;
  lastDigestDate: string | null;
  setBudgetAlert: (key: string, date: string) => void;
  setLastDigestDate: (date: string) => void;
}

export const useNotificationStateStore = create<NotificationState>()(
  persist(
    (set) => ({
      budgetAlerts: {},
      lastDigestDate: null,
      setBudgetAlert: (key, date) =>
        set((state) => ({
          budgetAlerts: { ...state.budgetAlerts, [key]: date },
        })),
      setLastDigestDate: (lastDigestDate) => set({ lastDigestDate }),
    }),
    {
      name: 'personal-os-notification-state',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
