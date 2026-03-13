import { ActivityIndicator, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { FloatingTabBar } from '../../src/components/ui/FloatingTabBar';
import { useAuthStore } from '../../src/store/auth.store';
import { useProfile } from '../../src/features/profile/profile.hooks';
import { useAppTheme } from '../../src/lib/theme';

export default function TabsLayout() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { colors } = useAppTheme();

  if (isLoading || profileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;

  const isProfileComplete = Boolean(profile?.full_name?.trim() && profile?.username?.trim());
  if (!isProfileComplete) return <Redirect href={'/(auth)/complete-profile' as any} />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        freezeOnBlur: true,
        lazy: true,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Home' }} />
      <Tabs.Screen name="calendar"  options={{ title: 'Calendar' }} />
      <Tabs.Screen name="finance"   options={{ title: 'Finance' }} />
      <Tabs.Screen name="tasks"     options={{ title: 'Tasks' }} />
      <Tabs.Screen name="assistant" options={{ title: 'Assistant' }} />
      {/* Profile is still a valid route — accessed via avatar tap in Home header */}
      <Tabs.Screen name="profile"   options={{ href: null }} />
    </Tabs>
  );
}
