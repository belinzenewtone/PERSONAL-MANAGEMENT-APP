import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../auth.service';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { toast } from '../../../components/ui/Toast';
import { getErrorMessage } from '../../../lib/error-handler';
import { spacing, fontSize, fontWeight, useAppTheme } from '../../../lib/theme';
import { successTap } from '../../../lib/feedback';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type Input = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Input>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email }: Input) => {
    setLoading(true);
    try {
      await authService.resetPassword(email);
      successTap();
      toast.success('Reset link sent — check your email.');
      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.accentLight} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

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
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  backBtn: { marginBottom: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  backText: { color: colors.accentLight, fontSize: fontSize.md },
  title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { gap: spacing.md },
});
