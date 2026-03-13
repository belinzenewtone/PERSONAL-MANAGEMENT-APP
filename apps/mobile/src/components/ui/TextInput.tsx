import React, { forwardRef, useMemo, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { controlHeights, radius, spacing, fontSize, fontWeight, useAppTheme } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export const TextInput = forwardRef<RNTextInput, InputProps>(
  ({ label, error, rightIcon, onRightIconPress, style, containerStyle, labelStyle, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const { colors } = useAppTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
        <View
          style={[
            styles.inputWrapper,
            focused && styles.focused,
            error ? styles.error : null,
          ]}
        >
          <RNTextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={colors.textMuted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: controlHeights.input,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  focused: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAccentStrong,
  },
  error: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  rightIcon: {
    paddingLeft: spacing.sm,
    minHeight: controlHeights.input - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
  },
});
