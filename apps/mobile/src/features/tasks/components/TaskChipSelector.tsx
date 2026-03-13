import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';

interface TaskChipOption {
  value: string;
  label: string;
  color?: string;
}

interface TaskChipSelectorProps {
  label: string;
  options: TaskChipOption[];
  selectedValue: string | null | undefined;
  onSelect: (value: string) => void;
  selectedColor?: string;
}

export function TaskChipSelector({
  label,
  options,
  selectedValue,
  onSelect,
  selectedColor,
}: TaskChipSelectorProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedSelectedColor = selectedColor ?? colors.accent;
  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const color = option.color ?? resolvedSelectedColor;
          const selected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[
                styles.chip,
                selected && {
                  backgroundColor: `${color}33`,
                  borderColor: color,
                },
              ]}
            >
              <Text style={[styles.chipText, selected && { color }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  section: { gap: spacing.sm },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
});
