import { useEffect, useState, useRef } from 'react';
import { Platform, AppState, AppStateStatus, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../src/lib/query-client';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/store/auth.store';
import { registerSmsBackgroundTask } from '../src/features/finance/sms-background.task';
import { requestNotificationPermissions } from '../src/lib/notifications';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';
import { ToastContainer } from '../src/components/ui/Toast';
import { BiometricScreen } from '../src/components/ui/BiometricScreen';
import * as Updates from 'expo-updates';

export default function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);
  const session = useAuthStore((s) => s.session);
  const [locked, setLocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const [updateChecking, setUpdateChecking] = useState(false);

  useEffect(() => {
    async function checkForOTAUpdate() {
      if (__DEV__) return;
      try {
        setUpdateChecking(true);
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
      } finally {
        setUpdateChecking(false);
      }
    }
    checkForOTAUpdate();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (Platform.OS === 'android') {
      registerSmsBackgroundTask().catch(() => { });
    }

    requestNotificationPermissions().catch(() => { });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (appState.current === 'active' && next.match(/inactive|background/)) {
        setLocked(true);
      }
      appState.current = next;
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  if (updateChecking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 14 }}>Checking for updates…</Text>
      </View>
    );
  }

  if (locked && session) {
    return (
      <BiometricScreen
        onSuccess={() => setLocked(false)}
        onFallback={() => setLocked(false)}
      />
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }} />
          <ToastContainer />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
