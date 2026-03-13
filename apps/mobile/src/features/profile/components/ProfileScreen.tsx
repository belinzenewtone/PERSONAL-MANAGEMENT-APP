import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authService } from '../../auth/auth.service';
import { useAuthStore } from '../../../store/auth.store';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageShell } from '../../../components/ui/PageShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { toast } from '../../../components/ui/Toast';
import { getErrorMessage } from '../../../lib/error-handler';
import { useAppTheme } from '../../../lib/theme';
import { useProfile, useUpdateProfile, useUploadAvatar } from '../profile.hooks';
import { ProfileIdentityCard } from './ProfileIdentityCard';
import { createProfileScreenStyles } from './profile-screen.styles';

const USERNAME_REGEX = /^[a-z0-9_]{3,24}$/;

export function ProfileScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createProfileScreenStyles(colors), [colors]);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [signOutLoading, setSignOutLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();
  const fullName = profile?.full_name?.trim() || profile?.username?.trim() || email.split('@')[0] || 'Personal OS User';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  useEffect(() => {
    setNameDraft(profile?.full_name ?? '');
    setUsernameDraft(profile?.username ?? '');
  }, [profile?.full_name, profile?.username]);

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
      await authService.updatePassword(newPassword);
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

  const handleSaveProfile = async () => {
    const fullNameValue = nameDraft.trim();
    const usernameValue = usernameDraft.trim().toLowerCase().replace(/\s+/g, '_');

    if (fullNameValue.length < 2) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!USERNAME_REGEX.test(usernameValue)) {
      toast.error('Username must be 3-24 chars, lowercase letters, numbers, or underscore.');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        full_name: fullNameValue,
        username: usernameValue,
      });
      toast.success('Profile saved');
    } catch (err) {
      const message = getErrorMessage(err);
      if (/duplicate key|idx_profiles_username_unique/i.test(message)) {
        toast.error('That username is already taken.');
        return;
      }
      toast.error(message);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        toast.error('Media library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0]?.uri) return;
      await uploadAvatar.mutateAsync(result.assets[0].uri);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Account"
          title="Profile"
          subtitle="Identity, tools, and security for your workspace."
          action={
            <View style={styles.headerActions}>
              <IconPillButton
                onPress={() => router.push('/analytics')}
                icon={<Ionicons name="bar-chart-outline" size={16} color={colors.accentLight} />}
                label="Analytics"
              />
            </View>
          }
        />

        <ProfileIdentityCard
          avatarUrl={profile?.avatar_url ?? null}
          initials={initials}
          email={email}
          fullName={fullName}
          memberSince={memberSince}
          nameDraft={nameDraft}
          usernameDraft={usernameDraft}
          onNameChange={setNameDraft}
          onUsernameChange={setUsernameDraft}
          onSaveProfile={handleSaveProfile}
          onPickAvatar={handlePickAvatar}
          saveProfileLoading={updateProfile.isPending}
          uploadLoading={uploadAvatar.isPending}
        />

        <GlassCard style={styles.card} padding="md">
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

        <GlassCard style={styles.card} padding="md">
          <Text style={styles.cardTitle}>Workspace Tools</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(tabs)/assistant')}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Assistant</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.rowBorder]} onPress={() => router.push('/insights')}>
            <Ionicons name="bar-chart-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Insights</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.rowBorder]} onPress={() => router.push('/analytics')}>
            <Ionicons name="analytics-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Analytics</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.rowBorder]} onPress={() => router.push('/recurring')}>
            <Ionicons name="repeat-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Recurring</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.rowBorder]} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.rowBorder]} onPress={() => router.push('/search')}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <Text style={styles.actionLabel}>Global Search</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

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
      </PageShell>
    </SafeAreaView>
  );
}
