import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const fallbackSupabaseUrl = 'https://example.invalid';
const fallbackSupabaseAnonKey = 'missing-supabase-anon-key';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : 'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy apps/mobile/.env.example to apps/mobile/.env and fill in both values.';

// SecureStore adapter for Supabase auth token persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackSupabaseUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackSupabaseAnonKey,
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
