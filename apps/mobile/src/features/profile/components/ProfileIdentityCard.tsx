import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';
import { Capsule } from '../../../components/ui/Capsule';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TextInput } from '../../../components/ui/TextInput';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

interface ProfileIdentityCardProps {
  avatarUrl: string | null;
  initials: string;
  email: string;
  fullName: string;
  memberSince: string;
  nameDraft: string;
  usernameDraft: string;
  onNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onSaveProfile: () => void;
  onPickAvatar: () => void;
  saveProfileLoading: boolean;
  uploadLoading: boolean;
}

export function ProfileIdentityCard({
  avatarUrl,
  initials,
  email,
  fullName,
  memberSince,
  nameDraft,
  usernameDraft,
  onNameChange,
  onUsernameChange,
  onSaveProfile,
  onPickAvatar,
  saveProfileLoading,
  uploadLoading,
}: ProfileIdentityCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <>
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatar} onPress={onPickAvatar} activeOpacity={0.85}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
          <View style={styles.avatarBadge}>
            <Ionicons name="camera-outline" size={14} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.nameText}>{fullName}</Text>
        <Text style={styles.emailText} numberOfLines={1} ellipsizeMode="middle">{email}</Text>
        <Capsule
          label={uploadLoading ? 'Uploading avatar...' : 'Verified Account'}
          color={uploadLoading ? colors.warning : colors.success}
          variant="subtle"
          size="sm"
          icon={<Ionicons name="shield-checkmark" size={12} color={uploadLoading ? colors.warning : colors.success} />}
          style={styles.verifiedBadgeCapsule}
        />
      </View>

      <GlassCard style={styles.card} tone="accent" padding="lg">
        <Text style={styles.cardTitle}>Account</Text>
        <TextInput
          label="Display Name"
          value={nameDraft}
          onChangeText={onNameChange}
          placeholder="Your name"
          style={styles.centeredInput}
          containerStyle={styles.centeredField}
          labelStyle={styles.centeredLabel}
        />
        <TextInput
          label="Preferred Username"
          value={usernameDraft}
          onChangeText={onUsernameChange}
          placeholder="your_username"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          style={styles.centeredInput}
          containerStyle={styles.centeredField}
          labelStyle={styles.centeredLabel}
        />
        <Button label="Save Profile" onPress={onSaveProfile} size="sm" variant="secondary" loading={saveProfileLoading} style={styles.saveBtn} />
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">{email}</Text>
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
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md, shadowColor: colors.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.36, shadowRadius: 18, elevation: 10,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 48 },
  avatarText: { fontSize: 28, fontWeight: fontWeight.bold, color: colors.textPrimary },
  avatarBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.accentDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.background,
  },
  nameText: { fontSize: fontSize.xl, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  emailText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  verifiedBadgeCapsule: { marginTop: spacing.xs, alignSelf: 'center' },
  card: { marginBottom: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.xs, textAlign: 'center' },
  centeredField: { alignItems: 'center' },
  centeredInput: { textAlign: 'center' },
  centeredLabel: { textAlign: 'center', width: '100%' },
  saveBtn: { alignSelf: 'center', minWidth: 140 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.xs },
  infoContent: { flex: 1, gap: 2 },
  infoLabel: { fontSize: fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  infoValue: { fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },
});
