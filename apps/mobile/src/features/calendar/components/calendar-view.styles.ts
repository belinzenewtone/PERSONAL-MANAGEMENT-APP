import { StyleSheet } from 'react-native';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

export function useCalendarViewStyles() {
  const { colors } = useAppTheme();

  return StyleSheet.create({
    weekHeader: { flexDirection: 'row', paddingHorizontal: spacing.xs, marginBottom: spacing.sm },
    weekHeaderText: { flex: 1, textAlign: 'center', fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: '14.28%', minHeight: 64, alignItems: 'center', paddingVertical: 6, borderRadius: radius.lg },
    dayCellSelected: { backgroundColor: colors.surfaceAccentAlt, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderStrong },
    dayNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    dayNumberToday: { backgroundColor: colors.accent },
    dayNumberSelected: { borderWidth: 1.5, borderColor: colors.accent },
    dayNumberText: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
    dayNumberOutside: { color: colors.textMuted, opacity: 0.3 },
    dayNumberTodayText: { color: colors.textPrimary, fontWeight: fontWeight.bold },
    dayNumberSelectedText: { color: colors.accentLight },
    dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, justifyContent: 'center' },
    monthEventDot: { width: 4, height: 4, borderRadius: 2 },
    eventChipContainer: { marginBottom: 4 },
    fullWidthCapsule: { width: '100%' },
    weekView: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.md, justifyContent: 'space-between' },
    weekDayCol: { flex: 1, minWidth: 0, alignItems: 'center', paddingVertical: spacing.sm + 3, borderRadius: radius.lg, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
    weekDayColSelected: { backgroundColor: colors.surfaceAccentAlt, borderColor: `${colors.teal}66` },
    weekDayName: { fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.bold, textTransform: 'uppercase', marginBottom: 2 },
    weekDayNameToday: { color: colors.accentLight },
    weekDayNum: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
    weekDayNumToday: { color: colors.accent },
    weekDayNumSelected: { color: colors.textPrimary },
    weekDots: { flexDirection: 'row', gap: 3, marginTop: spacing.xs, minHeight: 6 },
    weekEventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentLight },
    weekTaskDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.warning },
    dayView: { paddingHorizontal: spacing.md, paddingBottom: 140 },
    dayHourRow: { flexDirection: 'row', minHeight: 64, borderTopWidth: 1, borderTopColor: colors.border },
    dayHourLabel: { width: 48, paddingTop: spacing.xs, fontSize: 10, color: colors.textMuted, fontWeight: fontWeight.semibold },
    dayHourLabelPast: { opacity: 0.3 },
    dayHourLine: { width: 1, backgroundColor: colors.border, marginTop: spacing.xs, marginRight: spacing.sm },
    dayHourEvents: { flex: 1, gap: 4, paddingTop: 4, paddingBottom: 4 },
    dayEventBlock: { borderRadius: radius.md, borderLeftWidth: 3, paddingHorizontal: spacing.sm, paddingVertical: 6 },
    dayEventTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
    dayEventTime: { fontSize: 10, marginTop: 1, opacity: 0.8 },
  });
}
