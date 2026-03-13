import React, { useMemo } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { selectionTap } from '../../lib/feedback';
import { radius, spacing, fontSize, fontWeight, useAppTheme } from '../../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: object;
  activeColor?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  activeColor,
}: SegmentedControlProps<T>) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, activeColor ?? colors.accent), [activeColor, colors]);

  return (
    <View style={[styles.wrap, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              selectionTap();
              onChange(option.value);
            }}
            style={[styles.option, active && styles.optionActive]}
            activeOpacity={0.88}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors'], activeColor: string) => StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 4,
    minHeight: 48,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    backgroundColor: activeColor,
    shadowColor: activeColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  optionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  optionTextActive: {
    color: colors.textPrimary,
  },
});
