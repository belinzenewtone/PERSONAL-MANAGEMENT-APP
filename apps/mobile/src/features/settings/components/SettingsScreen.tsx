import { toast } from '../../../components/ui/Toast';
import React, { useMemo } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { fontSize, fontWeight, radius, spacing, ThemeMode, useAppTheme } from '../../../lib/theme';
import { disableNotificationDelivery, requestNotificationPermissions } from '../../../lib/notifications';
import { usePreferencesStore } from '../../../store/preferences.store';
import { useUpdateProfile } from '../../profile/profile.hooks';
import { SettingRow, ToolLink } from './SettingsRows';
import { SettingsAboutCard } from './SettingsAboutCard';

export function SettingsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const biometricLockEnabled = usePreferencesStore((s) => s.biometricLockEnabled);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const budgetAlertsEnabled = usePreferencesStore((s) => s.budgetAlertsEnabled);
  const dailyDigestEnabled = usePreferencesStore((s) => s.dailyDigestEnabled);
  const assistantSuggestionsEnabled = usePreferencesStore((s) => s.assistantSuggestionsEnabled);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setBiometricLockEnabled = usePreferencesStore((s) => s.setBiometricLockEnabled);
  const setNotificationsEnabled = usePreferencesStore((s) => s.setNotificationsEnabled);
  const setBudgetAlertsEnabled = usePreferencesStore((s) => s.setBudgetAlertsEnabled);
  const setDailyDigestEnabled = usePreferencesStore((s) => s.setDailyDigestEnabled);
  const setAssistantSuggestionsEnabled = usePreferencesStore((s) => s.setAssistantSuggestionsEnabled);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const updateProfile = useUpdateProfile();

  function updateSetting(
    localSetter: (value: boolean) => void,
    field: 'biometric_lock_enabled' | 'assistant_suggestions_enabled',
    label: string,
  ) {
    return (value: boolean) => {
      localSetter(value);
      updateProfile.mutate(
        { [field]: value },
        {
          onSuccess: () => toast.info(`${label} ${value ? 'enabled' : 'disabled'}`),
          onError:   () => toast.error('Could not save setting'),
        },
      );
    };
  }

  async function handleNotificationAccessToggle(enabled: boolean) {
    if (!enabled) {
      setNotificationsEnabled(false);
      disableNotificationDelivery().catch(() => {});
      updateProfile.mutate(
        { notifications_enabled: false },
        { onError: () => toast.error('Could not save notification setting') },
      );
      toast.info('Notifications disabled');
      Alert.alert(
        'Notifications turned off',
        'Notification delivery has been disabled in-app. To fully revoke system permission, disable notifications in your phone settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
        ],
      );
      return;
    }

    const granted = await requestNotificationPermissions();
    if (!granted) {
      setNotificationsEnabled(false);
      updateProfile.mutate({ notifications_enabled: false });
      Alert.alert(
        'Permission needed',
        'Notification permission is still disabled. Enable it in system settings to receive reminders.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
        ],
      );
      return;
    }

    setNotificationsEnabled(true);
    updateProfile.mutate(
      { notifications_enabled: true },
      {
        onSuccess: () => toast.success('Notifications enabled'),
        onError:   () => toast.error('Could not save notification setting'),
      },
    );
  }

  function handleThemeModeChange(nextMode: ThemeMode) {
    setThemeMode(nextMode);
    const label = nextMode === 'dark' ? 'Dark' : nextMode === 'light' ? 'Light' : 'System';
    updateProfile.mutate(
      { theme_mode: nextMode },
      {
        onSuccess: () => toast.info(`${label} theme applied`),
        onError:   () => toast.error('Could not save theme'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Workspace Controls"
          title="Settings"
          subtitle="Tune the daily operating experience without digging through multiple tabs."
          leading={
            <IconPillButton
              onPress={() => router.back()}
              icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />}
            />
          }
        />

        <GlassCard style={styles.heroCard} tone="accent" padding="lg">
          <Text style={styles.heroTitle}>Your preferences travel with the app shell</Text>
          <Text style={styles.heroBody}>
            Lock behavior, alerts, and assistant guidance are all persisted locally so the app feels predictable every time you reopen it.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.themeDescription}>Choose a mode that stays readable and polished across every workspace screen.</Text>
          <SegmentedControl
            options={([
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
              { label: 'System', value: 'system' },
            ] as { label: string; value: ThemeMode }[])}
            value={themeMode}
            onChange={handleThemeModeChange}
            style={styles.themeRow}
          />
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Security</Text>
          <SettingRow
            icon="shield-checkmark-outline"
            title="Biometric relock"
            description="Require fingerprint or face unlock when the app returns from background."
            value={biometricLockEnabled}
            onValueChange={updateSetting(setBiometricLockEnabled, 'biometric_lock_enabled', 'Biometric lock')}
          />
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingRow
            icon="pie-chart-outline"
            title="Budget threshold alerts"
            description="Notify at 80%, 100%, and 120% of a category budget."
            value={budgetAlertsEnabled}
            onValueChange={setBudgetAlertsEnabled}
          />
          <SettingRow
            icon="sunny-outline"
            title="Daily digest"
            description="Send one morning summary with tasks, events, and spending posture."
            value={dailyDigestEnabled}
            onValueChange={setDailyDigestEnabled}
          />
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Assistant</Text>
          <SettingRow
            icon="sparkles-outline"
            title="Quick suggestions"
            description="Show prompt shortcuts that help you ask the assistant for focus, finance, and learning guidance."
            value={assistantSuggestionsEnabled}
            onValueChange={updateSetting(setAssistantSuggestionsEnabled, 'assistant_suggestions_enabled', 'AI suggestions')}
          />
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Tool Hub</Text>
          <ToolLink
            icon="bar-chart-outline"
            title="Analytics"
            subtitle="Review trends, completion, and budget posture."
            onPress={() => router.push('/analytics')}
          />
          <ToolLink
            icon="repeat-outline"
            title="Recurring"
            subtitle="Manage repeatable tasks, income, and finance templates."
            onPress={() => router.push('/recurring')}
          />
          <ToolLink
            icon="sparkles-outline"
            title="Assistant"
            subtitle="Ask for help using your current workspace context."
            onPress={() => router.push('/(tabs)/assistant')}
          />
          <ToolLink
            icon="search-outline"
            title="Global Search"
            subtitle="Search tasks, finance, calendar, and recurring items."
            onPress={() => router.push('/search')}
          />
        </GlassCard>

        <GlassCard style={styles.infoCard} padding="md">
          <Text style={styles.infoTitle}>Operating posture</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillValue}>6</Text>
              <Text style={styles.infoPillLabel}>primary tabs</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillValue}>2</Text>
              <Text style={styles.infoPillLabel}>secondary tools</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillValue}>100%</Text>
              <Text style={styles.infoPillLabel}>rules active</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.sectionTitle}>Advanced Permissions</Text>
          <SettingRow
            icon="notifications-outline"
            title="System notification access"
            description="Turn app notifications off, or re-enable and request permission again when needed."
            value={notificationsEnabled}
            onValueChange={handleNotificationAccessToggle}
          />
        </GlassCard>

        <SettingsAboutCard />
      </PageShell>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroCard: { gap: spacing.sm },
  heroTitle: { color: colors.textPrimary, fontSize: fontSize.xl + 2, fontWeight: fontWeight.bold, lineHeight: 30 },
  heroBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  card: { gap: spacing.md },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  themeDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: 0,
  },
  themeRow: {},
  infoCard: { gap: spacing.md },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  infoRow: { flexDirection: 'row', gap: spacing.sm },
  infoPill: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    gap: 4,
  },
  infoPillValue: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  infoPillLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
});
