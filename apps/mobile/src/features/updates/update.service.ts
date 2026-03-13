import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import type { AppUpdateRecord } from '@personal-os/types';

function compareVersion(a: string, b: string) {
  const left = a.split('.').map((part) => Number(part) || 0);
  const right = b.split('.').map((part) => Number(part) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

export const updateService = {
  getCurrentVersion: () => Constants.expoConfig?.version ?? '1.0.0',

  getPendingUpdate: async (): Promise<AppUpdateRecord | null> => {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const currentVersion = updateService.getCurrentVersion();

    const { data, error } = await supabase
      .from('app_updates')
      .select('*')
      .eq('platform', platform)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<AppUpdateRecord>();

    if (error) throw error;
    if (!data) return null;
    if (compareVersion(currentVersion, data.current_version) >= 0) return null;
    return data;
  },

  openStoreUrl: async (url: string | null) => {
    if (!url) return;
    await Linking.openURL(url);
  },
};
