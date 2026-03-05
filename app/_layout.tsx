import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, AppState, AppStateStatus, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { BiometricScreen } from '../components/ui/BiometricScreen';
import * as Updates from 'expo-updates';
import "../global.css";

const queryClient = new QueryClient();

function RootLayoutNav() {
    const { session, profile, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    // ── OTA Update check ────────────────────────────────────────────────────────
    const [updateChecking, setUpdateChecking] = useState(false);

    useEffect(() => {
        async function checkForOTAUpdate() {
            if (__DEV__) return; // only in production builds
            try {
                setUpdateChecking(true);
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                }
            } catch {
                // silently fail — cached bundle still works
            } finally {
                setUpdateChecking(false);
            }
        }
        checkForOTAUpdate();
    }, []);

    // ── Biometric lock on resume ─────────────────────────────────────────────
    const [locked, setLocked] = useState(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appState.current === 'active' && next.match(/inactive|background/)) {
                // App going to background — lock on next foreground
                setLocked(true);
            }
            appState.current = next;
        });
        return () => sub.remove();
    }, []);

    // ── Auth routing ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isLoading) return;
        const inAuthGroup = segments[0] === '(auth)';
        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            if (profile?.role === 'ADMIN') {
                router.replace('/(admin)');
            } else {
                router.replace('/(portal)');
            }
        } else if (session && !inAuthGroup && profile) {
            const inAdminGroup = segments[0] === '(admin)';
            const inPortalGroup = segments[0] === '(portal)';
            if (profile.role === 'ADMIN' && inPortalGroup) {
                router.replace('/(admin)');
            } else if (profile.role !== 'ADMIN' && inAdminGroup) {
                router.replace('/(portal)');
            }
        }
    }, [session, profile, isLoading, segments]);

    if (updateChecking) {
        return (
            <View style={s.splash}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
                <Text style={s.splashText}>Checking for updates…</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={s.splash}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            </View>
        );
    }

    // Show biometric screen when app returns from background and user is logged in
    if (locked && session) {
        return (
            <BiometricScreen
                onSuccess={() => setLocked(false)}
                onFallback={() => setLocked(false)}  // fallback = skip
            />
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(portal)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="report-issue" options={{ presentation: 'modal' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <RootLayoutNav />
            </QueryClientProvider>
        </AuthProvider>
    );
}

const s = StyleSheet.create({
    splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'hsl(224, 71%, 4%)', gap: 14 },
    splashText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});
