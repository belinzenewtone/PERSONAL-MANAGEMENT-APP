import { StyleSheet } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

export function createProfileScreenStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    headerActions: { flexDirection: 'row', gap: spacing.sm },

    card: { marginBottom: spacing.md, gap: spacing.sm },
    cardTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: spacing.md,
      marginTop: spacing.xs,
    },

    actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs + 2 },
    actionLabel: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary, fontWeight: fontWeight.medium },

    pwForm: { marginTop: spacing.md, gap: spacing.sm },

    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.danger + '15',
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.danger + '40',
      marginBottom: spacing.lg,
    },
    signOutText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.danger },

    version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted },
  });
}
