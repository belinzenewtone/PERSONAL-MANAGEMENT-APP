import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { selectionTap } from '../../lib/feedback';
import { appLayout, spacing, useAppTheme } from '../../lib/theme';

export function FloatingActionButton({
  onPress,
  icon = 'add',
  style,
}: {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={() => {
        selectionTap();
        onPress();
      }}
      activeOpacity={0.9}
    >
      {icon === 'add' ? <Text style={styles.label}>+</Text> : <Ionicons name={icon} size={26} color={colors.textPrimary} />}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: appLayout.fabBottom,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: `${colors.accentLight}66`,
  },
  label: { fontSize: 28, color: colors.textPrimary },
});
