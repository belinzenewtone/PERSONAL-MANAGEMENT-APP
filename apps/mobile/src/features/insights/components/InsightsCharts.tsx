import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Capsule } from '../../../components/ui/Capsule';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { learningService } from '../../learning/learning.service';
import { PRIORITY_COLOR, TYPE_ICON } from './insights-screen.shared';
import type { InsightCard } from '../insights.service';
import type { LearningSession, Task, Transaction } from '@personal-os/types';

type TaskChartPoint = Pick<Task, 'category' | 'status'>;
type TransactionChartPoint = Pick<Transaction, 'amount' | 'type' | 'transaction_date'>;

function MiniBarChart({
  bars,
  suffix = '',
  color,
}: {
  bars: { label: string; value: number }[];
  suffix?: string;
  color: string;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

  return (
    <View style={styles.miniChart}>
      <View style={styles.miniChartTrackArea}>
        {bars.map((bar) => (
          <View key={bar.label} style={styles.miniChartColumn}>
            <Text style={styles.miniChartValue}>
              {bar.value > 0 ? `${compact.format(bar.value)}${suffix}` : `0${suffix}`}
            </Text>
            <View style={styles.miniChartRail}>
              <View
                style={[
                  styles.miniChartBar,
                  {
                    height: `${Math.max(8, (bar.value / max) * 100)}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.miniChartLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AiCard({ card }: { card: InsightCard }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const priorityColor = PRIORITY_COLOR[card.priority];
  const iconName = TYPE_ICON[card.type];

  return (
    <TouchableOpacity onPress={() => setExpanded((value) => !value)} activeOpacity={0.85}>
      <GlassCard style={[styles.aiCard, { borderLeftColor: priorityColor, borderLeftWidth: 4 }]}>
        <View style={styles.aiCardHeader}>
          <View style={[styles.aiCardIconWrap, { backgroundColor: `${priorityColor}20` }]}>
            <Ionicons name={iconName} size={18} color={priorityColor} />
          </View>
          <View style={styles.aiCardMeta}>
            <Text style={styles.aiCardTitle}>{card.title}</Text>
            <Capsule label={card.priority} color={priorityColor} variant="subtle" size="sm" />
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </View>
        {expanded && <Text style={styles.aiCardBody}>{card.body}</Text>}
      </GlassCard>
    </TouchableOpacity>
  );
}

export function TaskCompletionChart({ tasks }: { tasks: TaskChartPoint[] }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const stats = useMemo(() => {
    const categories = ['work', 'growth', 'personal'] as const;
    return categories.map((category) => {
      const subset = tasks.filter((task) => task.category === category);
      const done = subset.filter((task) => task.status === 'done').length;
      return {
        label: category[0].toUpperCase() + category.slice(1),
        done,
        total: subset.length,
        rate: subset.length > 0 ? Math.round((done / subset.length) * 100) : 0,
      };
    });
  }, [tasks]);

  return (
    <GlassCard style={styles.chartCard} padding="md">
      <Text style={styles.chartTitle}>Task Completion Rate</Text>
      {tasks.length === 0 ? (
        <Text style={styles.chartEmptyText}>Add tasks to see completion progress by category.</Text>
      ) : (
        <View style={styles.completionList}>
          {stats.map(({ label, rate, done, total }) => {
            const tone = label === 'Work' ? colors.work : label === 'Growth' ? colors.growth : colors.personal;

            return (
              <View key={label} style={styles.completionRow}>
                <View style={styles.completionCopy}>
                  <Text style={styles.completionLabel}>{label}</Text>
                  <Text style={styles.completionMeta}>{done}/{total}</Text>
                </View>
                <View style={styles.completionMeter}>
                  <View style={styles.completionBar}>
                    <View
                      style={[
                        styles.completionFill,
                        {
                          width: `${Math.max(rate, total === 0 ? 0 : 4)}%` as const,
                          backgroundColor: tone,
                          opacity: total === 0 ? 0.2 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.completionPct, { color: tone }]}>{rate}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

export function MonthlySpendChart({ transactions }: { transactions: TransactionChartPoint[] }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 4 }, (_, index) => subMonths(new Date(), 3 - index));
    return months.map((month) => {
      const start = startOfMonth(month).toISOString();
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const total = transactions
        .filter((transaction) => transaction.type === 'expense' && transaction.transaction_date >= start && transaction.transaction_date <= end)
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      return { label: format(month, 'MMM'), total };
    });
  }, [transactions]);

  if (!monthlyData.some((month) => month.total > 0)) {
    return null;
  }

  return (
    <GlassCard style={styles.chartCard} padding="md">
      <Text style={styles.chartTitle}>Monthly Spending (4 months)</Text>
      <MiniBarChart bars={monthlyData.map((month) => ({ label: month.label, value: month.total }))} color={colors.accentLight} />
    </GlassCard>
  );
}

export function LearningHoursChart({ sessions }: { sessions: LearningSession[] }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const weekData = useMemo(() => learningService.getWeeklyHours(sessions), [sessions]);
  if (!weekData.some((day) => day.hours > 0)) {
    return null;
  }

  return (
    <GlassCard style={styles.chartCard} padding="md">
      <Text style={styles.chartTitle}>Weekly Learning Hours</Text>
      <MiniBarChart bars={weekData.map((day) => ({ label: day.day, value: day.hours }))} suffix="h" color={colors.growth} />
    </GlassCard>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  aiCard: { padding: spacing.md, marginBottom: 0, overflow: 'hidden' },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardMeta: { flex: 1, gap: 2 },
  aiCardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  aiCardBody: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.md },
  chartCard: { gap: spacing.md },
  chartTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  chartEmptyText: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  completionList: { gap: spacing.xs + 4 },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 },
  completionCopy: { width: 68 },
  completionLabel: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  completionMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  completionMeter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  completionBar: { flex: 1, height: 3, backgroundColor: colors.surfaceSoft, borderRadius: radius.full, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: radius.full },
  completionPct: { width: 34, fontSize: fontSize.xs, textAlign: 'right', fontWeight: fontWeight.bold },
  miniChart: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  miniChartTrackArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 160,
    gap: spacing.xs,
  },
  miniChartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  miniChartValue: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  miniChartRail: {
    width: 10,
    height: 86,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
    paddingBottom: spacing.xs / 2,
  },
  miniChartBar: {
    width: '100%',
    borderRadius: radius.full,
    minHeight: 6,
  },
  miniChartLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
