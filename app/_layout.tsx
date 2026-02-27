import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import "../global.css";

const queryClient = new QueryClient();

function RootLayoutNav() {
    const { session, profile, isLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            // Check roles
            if (profile?.role === 'ADMIN') {
                router.replace('/(admin)');
            } else {
                router.replace('/(portal)');
            }
        } else if (session && !inAuthGroup && profile) {
            const inAdminGroup = segments[0] === '(admin)';
            const inPortalGroup = segments[0] === '(portal)';

            // Guard rails to make sure wrong roles don't see the wrong module.
            if (profile.role === 'ADMIN' && inPortalGroup) {
                router.replace('/(admin)');
            } else if (profile.role !== 'ADMIN' && inAdminGroup) {
                router.replace('/(portal)');
            }
        }
    }, [session, profile, isLoading, segments]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-[hsl(224_71%_4%)]">
                <ActivityIndicator size="large" color="hsl(160 84% 39%)" />
            </View>
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
