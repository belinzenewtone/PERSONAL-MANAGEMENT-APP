import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { controlHeights, fontSize, fontWeight, radius, spacing, useAppTheme } from '../../lib/theme';

interface IconPillButtonProps {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function IconPillButton({ icon, label, onPress, style }: IconPillButtonProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={[styles.button, !label && styles.iconOnly, style]}>
      <View style={styles.icon}>{icon}</View>
      {label ? <Text style={styles.label} numberOfLines={1}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  button: {
    minHeight: controlHeights.chipSm + 2,
    maxWidth: 168,
    paddingHorizontal: spacing.md - 2,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOnly: {
    width: controlHeights.chipSm + 8,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.accentLight,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
