import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const TextInput = forwardRef<RNTextInput, InputProps>(
  ({ label, error, rightIcon, onRightIconPress, style, containerStyle, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 35, 0.7)',
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: spacing.md,
  },
  focused: {
    borderColor: colors.accent,
  },
  error: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  rightIcon: {
    paddingLeft: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.danger,
  },
});
