import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { controlHeights, radius, spacing, fontSize, fontWeight, useAppTheme } from '../../lib/theme';
import { selectionTap } from '../../lib/feedback';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  function handlePress() {
    selectionTap();
    onPress();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textPrimary : colors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: colors.accent,
    borderColor: `${colors.accentLight}55`,
  },
  secondary: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: colors.surfaceSoft,
    borderColor: `${colors.accent}35`,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: `${colors.danger}55`,
  },

  // Sizes
  sm: {
    minHeight: controlHeights.buttonSm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  md: {
    minHeight: controlHeights.buttonMd,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: controlHeights.buttonLg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  // Text base
  text: {
    fontWeight: fontWeight.semibold,
  },

  // Text variants
  text_primary: {
    color: colors.textPrimary,
  },
  text_secondary: {
    color: colors.textPrimary,
  },
  text_ghost: {
    color: colors.accent,
  },
  text_danger: {
    color: colors.textPrimary,
  },

  // Text sizes
  text_sm: { fontSize: fontSize.sm },
  text_md: { fontSize: fontSize.md },
  text_lg: { fontSize: fontSize.lg },
});
