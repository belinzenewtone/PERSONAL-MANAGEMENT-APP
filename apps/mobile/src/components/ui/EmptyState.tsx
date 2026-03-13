import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './GlassCard';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../lib/theme';

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <GlassCard style={styles.card} padding="lg">
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={30} color={colors.accentLight} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </GlassCard>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAccentStrong,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.semibold, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  action: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
  },
  actionText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
