import { useEffect, useState, useRef } from 'react';
import { Platform, AppState, AppStateStatus, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Session } from '@supabase/supabase-js';
import { queryClient } from '../src/lib/query-client';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth.store';
import { registerSmsBackgroundTask } from '../src/features/finance/sms-background.task';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { ToastContainer } from '../src/components/ui/Toast';
import { BiometricScreen } from '../src/components/ui/BiometricScreen';
import { usePreferencesStore } from '../src/store/preferences.store';
import { AppBootstrapper } from '../src/bootstrap/AppBootstrapper';
import { runInitialPermissionPrompts } from '../src/bootstrap/permission-prompts';
import * as Updates from 'expo-updates';
import { useAppTheme } from '../src/lib/theme';
import { OtaUpdateBanner, useOtaUpdate } from '../src/features/updates/components/OtaUpdateBanner';

function scheduleIdleTask(task: () => void) {
  const requestIdle = (globalThis as {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  }).requestIdleCallback;
  const cancelIdle = (globalThis as {
    cancelIdleCallback?: (handle: number) => void;
  }).cancelIdleCallback;

  if (typeof requestIdle === 'function') {
    const handle = requestIdle(task, { timeout: 3000 });
    return () => {
      if (typeof cancelIdle === 'function') {
        cancelIdle(handle);
      }
    };
  }

  const timeout = setTimeout(task, 0);
  return () => clearTimeout(timeout);
}

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const session = useAuthStore((s) => s.session);
  const hasHydrated = usePreferencesStore((s) => s.hasHydrated);
  const biometricLockEnabled = usePreferencesStore((s) => s.biometricLockEnabled);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const hasPromptedNotificationPermission = usePreferencesStore((s) => s.hasPromptedNotificationPermission);
  const hasPromptedSmsPermission = usePreferencesStore((s) => s.hasPromptedSmsPermission);
  const setHasPromptedNotificationPermission = usePreferencesStore((s) => s.setHasPromptedNotificationPermission);
  const setHasPromptedSmsPermission = usePreferencesStore((s) => s.setHasPromptedSmsPermission);
  const { colors, isDark } = useAppTheme();
  const [locked, setLocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // ── OTA update banner ─────────────────────────────────────────────────────
  // Fetches update metadata (size + changelog) from Supabase app_updates table
  // then shows the animated banner. On accept → downloads with progress, then
  // shows "Restart Now". Silent path removed — user is always informed.
  const [otaSizeBytes, setOtaSizeBytes]   = useState<number | null>(null);
  const [otaChangelog, setOtaChangelog]   = useState<string[] | null>(null);
  const ota = useOtaUpdate({ sizeBytes: otaSizeBytes, changelog: otaChangelog });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    const isInvalidJwtError = (message?: string | null) =>
      /invalid jwt/i.test(message ?? '');

    const clearLocalSession = async () => {
      // Clear stale token from local storage even if remote sign-out fails.
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      if (active) {
        setSession(null);
      }
    };

    const validateAndSetSession = async (session: Session | null) => {
      if (!active) return;
      if (!session) {
        setSession(null);
        return;
      }

      const { error: userError } = await supabase.auth.getUser();
      if (userError?.status === 401 || isInvalidJwtError(userError?.message)) {
        await clearLocalSession();
        return;
      }

      setSession(session);
    };

    const hydrateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await validateAndSetSession(session);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    hydrateSession().catch(() => {
      if (active) {
        setSession(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      validateAndSetSession(session).catch(() => {
        clearLocalSession().catch(() => {});
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setLoading, setSession]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let cancelled = false;
    let deferredTimer: ReturnType<typeof setTimeout> | undefined;

    const cancelIdleWork = scheduleIdleTask(() => {
      deferredTimer = setTimeout(() => {
        if (cancelled) {
          return;
        }

        if (!__DEV__) {
          // Check for OTA update — fetch metadata from Supabase for size + changelog
          Updates.checkForUpdateAsync()
            .then(async (update) => {
              if (cancelled || !update.isAvailable) return;

              // Pull size + changelog from app_updates Supabase table
              const { supabase } = await import('../src/lib/supabase');
              const platform = (await import('react-native')).Platform.OS === 'ios' ? 'ios' : 'android';
              const { data } = await supabase
                .from('app_updates')
                .select('bundle_size_bytes, changelog')
                .eq('platform', platform)
                .eq('active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (!cancelled) {
                setOtaSizeBytes(data?.bundle_size_bytes ?? null);
                setOtaChangelog(data?.changelog ?? null);
                ota.showAvailable();
              }
            })
            .catch(() => {});
        }

        if (Platform.OS === 'android') {
          registerSmsBackgroundTask().catch(() => {});
        }
      }, 1200);
    });

    return () => {
      cancelled = true;
      cancelIdleWork();
      if (deferredTimer) {
        clearTimeout(deferredTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    let cancelled = false;
    const permissionTimer = setTimeout(() => {
      runInitialPermissionPrompts({
        notificationsEnabled,
        hasPromptedNotificationPermission,
        hasPromptedSmsPermission,
        markNotificationPermissionPrompted: () => setHasPromptedNotificationPermission(true),
        markSmsPermissionPrompted: () => setHasPromptedSmsPermission(true),
        isCancelled: () => cancelled,
      }).catch(() => {});
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(permissionTimer);
    };
  }, [
    hasPromptedNotificationPermission,
    hasPromptedSmsPermission,
    notificationsEnabled,
    session?.user?.id,
    setHasPromptedNotificationPermission,
    setHasPromptedSmsPermission,
  ]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (
        biometricLockEnabled &&
        appState.current === 'active' &&
        next.match(/inactive|background/)
      ) {
        setLocked(true);
      }
      appState.current = next;
    });

    return () => {
      appStateSub.remove();
    };
  }, [biometricLockEnabled]);

  useEffect(() => {
    if (!biometricLockEnabled && locked) {
      setLocked(false);
    }
  }, [biometricLockEnabled, locked]);

  if (!hasHydrated) {
    return (
      <View style={[styles.centeredScreen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.updateText, { color: colors.textMuted }]}>Loading your workspace…</Text>
      </View>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <View style={[styles.centeredScreen, { backgroundColor: colors.background }]}>
        <Text style={[styles.configTitle, { color: colors.textPrimary }]}>Configuration Required</Text>
        <Text style={[styles.configMessage, { color: colors.textSecondary }]}>{supabaseConfigError}</Text>
      </View>
    );
  }

  if (locked && session && biometricLockEnabled) {
    return (
      <BiometricScreen
        onSuccess={() => setLocked(false)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppBootstrapper />
            <OtaUpdateBanner
              state={ota.state}
              onAccept={async () => {
                if (ota.state.phase === 'available') {
                  await ota.startDownload();
                } else {
                  await ota.applyUpdate();
                }
              }}
              onDismiss={ota.dismiss}
            />
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
            <ToastContainer />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
  },
  configTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  configMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  updateText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    marginTop: 14,
  },
});
