import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

export function SettingsAboutCard() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const runtimeVersion = typeof Constants.expoConfig?.runtimeVersion === 'string'
    ? Constants.expoConfig.runtimeVersion
    : 'appVersion';

  function handleDeleteRequest() {
    Alert.alert(
      'Deletion request',
      'Wire a support email or a backend deletion endpoint before shipping this flow to production.',
    );
  }

  return (
    <GlassCard style={styles.card} padding="md">
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accentLight} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Version</Text>
          <Text style={styles.subtitle}>v{version} · runtime {runtimeVersion}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.row} onPress={handleDeleteRequest} activeOpacity={0.82}>
        <View style={[styles.iconWrap, styles.dangerIconWrap]}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, styles.dangerText]}>Request account deletion</Text>
          <Text style={styles.subtitle}>Reserved entry point for a support email or secure deletion flow.</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    card: { gap: spacing.md },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 68, paddingVertical: spacing.xs },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dangerIconWrap: {
      borderColor: `${colors.danger}22`,
      backgroundColor: `${colors.danger}12`,
    },
    copy: { flex: 1, gap: 4 },
    title: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 19,
    },
    dangerText: { color: colors.danger },
  });
