import { useEffect } from 'react';
import { Platform } from 'react-native';
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
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    if (Platform.OS === 'android') {
      registerSmsBackgroundTask().catch(() => {});
    }

    requestNotificationPermissions().catch(() => {});

    return () => subscription.unsubscribe();
  }, []);

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
