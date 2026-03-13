import React, { useMemo } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={colors.accentLight} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceSoft, true: `${colors.accent}99` }}
        thumbColor={value ? colors.textPrimary : colors.textMuted}
      />
    </View>
  );
}

export function ToolLink({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.toolRow} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={colors.accentLight} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 72,
      paddingVertical: spacing.xs,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingCopy: { flex: 1, gap: 4 },
    settingTitle: {
      color: colors.textPrimary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    settingDescription: {
      color: colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 19,
    },
    toolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 68,
      paddingVertical: spacing.sm,
    },
  });
