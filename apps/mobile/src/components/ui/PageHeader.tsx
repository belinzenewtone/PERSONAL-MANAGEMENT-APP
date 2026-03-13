import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appLayout, fontSize, fontWeight, spacing, useAppTheme } from '../../lib/theme';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  leading?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, subtitle, action, leading }: PageHeaderProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    flex: 1,
  },
  leading: {
    paddingTop: 2,
  },
  copy: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  eyebrow: {
    color: colors.accentLight,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xxl,   // was xxl+2 (28px) → now 26px
    fontWeight: fontWeight.bold,
    lineHeight: 32,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    maxWidth: 310,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
