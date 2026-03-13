import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService, SignUpInput, signUpSchema } from '../auth.service';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TextInput } from '../../../components/ui/TextInput';
import { toast } from '../../../components/ui/Toast';
import { getErrorMessage } from '../../../lib/error-handler';
import { spacing, fontSize, fontWeight, useAppTheme } from '../../../lib/theme';
import { successTap } from '../../../lib/feedback';

export function RegisterScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignUpInput) => {
    setLoading(true);
    try {
      await authService.signUp(data);
      successTap();
      toast.success('Account created! Check your email to verify.');
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={styles.badgeText}>Personal OS</Text>
            </View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Set up your account to access your workspace.</Text>
          </View>

          <GlassCard style={styles.formCard} tone="accent" padding="lg">
            <View style={styles.form}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Password"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    rightIcon={<Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />}
                    onRightIconPress={() => setShowPassword((v) => !v)}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Confirm Password"
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    rightIcon={<Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />}
                    onRightIconPress={() => setShowConfirmPassword((v) => !v)}
                  />
                )}
              />

              <Text style={styles.helperText}>Passwords should be at least 6 characters.</Text>
              <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
            </View>
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: { fontSize: fontSize.sm, color: colors.accentLight, fontWeight: fontWeight.semibold },
  title: { fontSize: fontSize.xl + 2, fontWeight: fontWeight.bold, color: colors.textPrimary, lineHeight: 30 },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  formCard: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  form: { gap: spacing.md },
  helperText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: -spacing.xs, marginBottom: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg, alignItems: 'center' },
  footerText: { color: colors.textSecondary, fontSize: fontSize.sm },
  footerLink: { color: colors.accentLight, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
