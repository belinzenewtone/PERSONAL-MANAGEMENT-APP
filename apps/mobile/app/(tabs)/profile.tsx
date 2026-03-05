import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { authService } from '../../src/features/auth/auth.service';
import { useAuthStore } from '../../src/store/auth.store';
import { TextInput } from '../../src/components/ui/TextInput';
import { Button } from '../../src/components/ui/Button';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { toast } from '../../src/components/ui/Toast';
import { getErrorMessage } from '../../src/lib/error-handler';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import { Capsule } from '../../src/components/ui/Capsule';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [signOutLoading, setSignOutLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSignOutLoading(true);
          try {
            await authService.signOut();
            router.replace('/(auth)/login');
          } catch (err) {
            toast.error(getErrorMessage(err));
            setSignOutLoading(false);
          }
        },
      },
    ]);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setShowPwSection(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.emailText}>{email}</Text>
          <Capsule
            label="Verified Account"
            color={colors.success}
            variant="subtle"
            size="sm"
            icon={<Ionicons name="shield-checkmark" size={12} color={colors.success} />}
            style={styles.verifiedBadgeCapsule}
          />
        </View>

        {/* Account Info */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, styles.rowBorder]}>
            <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Member since</Text>
              <Text style={styles.infoValue}>{memberSince}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Security */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Security</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowPwSection((v) => !v)}
            activeOpacity={0.7}
          >
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Change Password</Text>
            <Ionicons
              name={showPwSection ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showPwSection && (
            <View style={styles.pwForm}>
              <TextInput
                label="New Password"
                placeholder="Min. 6 characters"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                rightIcon={
                  <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                }
                onRightIconPress={() => setShowNew((v) => !v)}
              />
              <TextInput
                label="Confirm New Password"
                placeholder="Repeat password"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                rightIcon={
                  <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
                }
                onRightIconPress={() => setShowConfirm((v) => !v)}
              />
              <Button
                label="Update Password"
                onPress={handleChangePassword}
                loading={pwLoading}
                fullWidth
                size="md"
              />
            </View>
          )}
        </GlassCard>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={signOutLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>
            {signOutLoading ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Personal OS · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: 140 },

  header: { paddingTop: spacing.sm, marginBottom: spacing.lg },
  screenTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarText: { fontSize: 28, fontWeight: fontWeight.bold, color: '#fff' },
  emailText: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
  verifiedBadgeCapsule: {
    marginTop: spacing.xs,
  },

  card: { marginBottom: spacing.md, gap: spacing.sm },
  cardTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.textSecondary, marginBottom: spacing.xs,
  },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowBorder: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm, marginTop: spacing.xs,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  infoValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium, marginTop: 1 },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionLabel: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },

  pwForm: { marginTop: spacing.md, gap: spacing.sm },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.danger + '15',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.danger + '40',
    marginBottom: spacing.lg,
  },
  signOutText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.danger },

  version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted },
});
