import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';
import { CategoryIcon } from '../../../lib/category-icons';
import { useBudgets } from '../../finance/budget.hooks';
import { useAnalyticsTransactions } from '../../finance/finance.hooks';
import { useLearningSessions } from '../../learning/learning.hooks';
import { useAnalyticsTasks } from '../../tasks/tasks.hooks';
import { LearningHoursChart, MonthlySpendChart, TaskCompletionChart } from '../../insights/components/InsightsCharts';

export function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: budgets = [] } = useBudgets();
  const { data: transactions = [] } = useAnalyticsTransactions(4);
  const { data: tasks = [] } = useAnalyticsTasks();
  const { data: sessions = [] } = useLearningSessions(30);

  const totals = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'done').length;
    const learningHours = Math.round((sessions.reduce((sum, session) => sum + Number(session.duration_minutes), 0) / 60) * 10) / 10;
    const monthlyBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    return {
      completedPct: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      learningHours,
      monthlyBudget,
    };
  }, [budgets, sessions, tasks]);

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Metrics"
          title="Analytics"
          subtitle="A cleaner metrics view for trends, completion, and budget posture."
          leading={
            <IconPillButton
              onPress={() => router.back()}
              icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />}
            />
          }
          action={
            <IconPillButton
              onPress={() => router.push('/insights')}
              icon={<Ionicons name="sparkles-outline" size={16} color={colors.accentLight} />}
              label="Insights"
            />
          }
        />

        <GlassCard style={styles.heroCard} tone="accent" padding="lg">
          <Text style={styles.heroTitle}>Your operating pulse at a glance</Text>
          <Text style={styles.heroBody}>
            Use this view to spot execution gaps, learning momentum, and budget posture before they become friction.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/(tabs)/finance')}>
              <Text style={styles.heroActionText}>Open Finance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroAction} onPress={() => router.push('/recurring')}>
              <Text style={styles.heroActionText}>Recurring</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard} padding="md">
            <Text style={styles.summaryValue}>{totals.completedPct}%</Text>
            <Text style={styles.summaryLabel}>Task completion</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard} padding="md">
            <Text style={styles.summaryValue}>{totals.learningHours}h</Text>
            <Text style={styles.summaryLabel}>Learning (30d)</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard} padding="md">
            <Text style={styles.summaryValue}>KES {totals.monthlyBudget.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Budgeted</Text>
          </GlassCard>
        </View>

        <TaskCompletionChart tasks={tasks} />
        <MonthlySpendChart transactions={transactions} />
        <LearningHoursChart sessions={sessions} />

        <GlassCard style={styles.budgetCard} padding="md">
          <Text style={styles.sectionTitle}>Budget Snapshot</Text>
          {budgets.length === 0 ? (
            <Text style={styles.emptyText}>Set category budgets in Finance to track spending pressure here.</Text>
          ) : (
            budgets.map((budget) => (
              <View key={budget.id} style={styles.budgetRow}>
                <View style={styles.budgetTopRow}>
                  <View style={styles.budgetCategoryWrap}>
                    <CategoryIcon category={budget.category} size={14} color={colors.accentLight} />
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                  </View>
                  <Text style={styles.budgetAmount}>KES {Number(budget.amount).toLocaleString()}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(100, Math.max(8, Number(budget.amount) / Math.max(1, totals.monthlyBudget) * 100))}%` }]} />
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </PageShell>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heroCard: { gap: spacing.sm },
  heroTitle: { color: colors.textPrimary, fontSize: fontSize.xl + 2, fontWeight: fontWeight.bold, lineHeight: 30, maxWidth: 260 },
  heroBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  heroAction: {
    paddingVertical: spacing.xs + 4,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
  },
  heroActionText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 2, marginBottom: 2 },
  summaryCard: { flexBasis: '31%', flexGrow: 1, alignItems: 'flex-start', gap: 6, minHeight: 92, justifyContent: 'center' },
  summaryValue: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, textAlign: 'center' },
  summaryLabel: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: 'uppercase' },
  budgetCard: { gap: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
  budgetRow: { gap: spacing.xs },
  budgetTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCategoryWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  budgetCategory: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
  budgetAmount: { color: colors.textSecondary, fontSize: fontSize.sm },
  track: { height: 8, borderRadius: radius.full, backgroundColor: colors.surfaceSoft, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
});
