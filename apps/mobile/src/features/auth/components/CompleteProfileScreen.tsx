import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { toast } from '../../../components/ui/Toast';
import { getErrorMessage } from '../../../lib/error-handler';
import { successTap } from '../../../lib/feedback';
import { fontSize, fontWeight, spacing, useAppTheme } from '../../../lib/theme';
import { useProfile, useUpdateProfile } from '../../profile/profile.hooks';
import { useAuthStore } from '../../../store/auth.store';

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

export function CompleteProfileScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullNameDraft, setFullNameDraft] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');

  useEffect(() => {
    setFullNameDraft(profile?.full_name ?? '');
    setUsernameDraft(profile?.username ?? '');
  }, [profile?.full_name, profile?.username]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!profileLoading && profile?.full_name?.trim() && profile?.username?.trim()) {
    return <Redirect href="/(tabs)" />;
  }

  const handleContinue = async () => {
    const fullName = fullNameDraft.trim();
    const username = normalizeUsername(usernameDraft);

    if (fullName.length < 2) {
      toast.error('Please enter your full name.');
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      toast.error('Username must be 3-24 chars, lowercase letters, numbers, or underscore.');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        username,
      });
      successTap();
      toast.success('Profile completed.');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (/duplicate key|idx_profiles_username_unique/i.test(message)) {
        toast.error('That username is already taken.');
        return;
      }
      toast.error(message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              One quick setup before entering your workspace.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              value={fullNameDraft}
              onChangeText={setFullNameDraft}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TextInput
              label="Preferred Username"
              placeholder="john_doe"
              value={usernameDraft}
              onChangeText={setUsernameDraft}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
            />
            <Text style={styles.helperText}>
              Use 3-24 lowercase characters, numbers, or underscores.
            </Text>
            <Button
              label="Continue to App"
              onPress={handleContinue}
              loading={updateProfile.isPending}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { marginBottom: spacing.xl, alignItems: 'center' },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: { gap: spacing.md },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
});
