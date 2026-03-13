import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../../components/ui/GlassCard';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { CategoryIcon } from '../../../lib/category-icons';
import { CATEGORY_COLORS } from '../finance.constants';
import { financeService } from '../finance.service';
import { fmt } from './finance-screen.shared';
import type { Transaction } from '@personal-os/types';
import type { Budget } from '../budget.service';

interface FinanceCategoryBreakdownProps {
  transactions: Transaction[];
  budgets: Budget[];
  onCategoryPress: (category: string) => void;
}

export function FinanceCategoryBreakdown({
  transactions,
  budgets,
  onCategoryPress,
}: FinanceCategoryBreakdownProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const breakdown = useMemo(
    () => financeService.getCategoryBreakdown(transactions),
    [transactions],
  );

  return (
    <GlassCard style={styles.breakdownCard} padding="md">
      <Text style={styles.chartTitle}>Category Breakdown</Text>
      <Text style={styles.chartSubtitle}>Tap a category to tune its budget target.</Text>
      {breakdown.length === 0 && (
        <Text style={styles.chartEmptyText}>No expenses this period</Text>
      )}
      {breakdown.slice(0, 8).map(({ category, total }) => {
        const budget = budgets.find((item) => item.category === category);
        const budgetAmount = budget?.amount || 0;
        const pct = budgetAmount > 0 ? (total / budgetAmount) * 100 : 0;
        const color = CATEGORY_COLORS[category] ?? colors.textMuted;

        return (
          <TouchableOpacity
            key={category}
            onPress={() => onCategoryPress(category)}
            style={styles.breakdownRowOuter}
          >
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.breakdownIconWrap, { backgroundColor: `${color}16` }]}>
                  <CategoryIcon category={category} size={14} color={color} />
                </View>
                <Text style={styles.breakdownLabel} numberOfLines={1}>{category}</Text>
              </View>
              <View style={styles.breakdownRight}>
                <Text style={styles.breakdownAmount}>{fmt(total)}</Text>
                {budgetAmount > 0 && (
                  <Text style={[styles.budgetStatus, pct >= 100 ? styles.overBudget : null]}>
                    {pct >= 100 ? `${Math.round(pct)}% of budget` : `${Math.round(pct)}% used`}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.breakdownBarContainer}>
              <View
                style={[
                  styles.breakdownBar,
                  {
                    width: `${Math.min(pct || 0, 100)}%` as const,
                    backgroundColor: pct > 100 ? colors.danger : `${color}aa`,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </GlassCard>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  breakdownCard: { marginBottom: spacing.md, gap: spacing.sm },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  chartSubtitle: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: -spacing.sm + 2, marginBottom: spacing.xs },
  chartEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },
  breakdownRowOuter: { marginBottom: spacing.sm + 4 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 6 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, paddingRight: spacing.sm },
  breakdownRight: { alignItems: 'flex-end', gap: 2 },
  breakdownIconWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  breakdownLabel: { fontSize: fontSize.sm, color: colors.textPrimary, flex: 1, textTransform: 'capitalize', fontWeight: fontWeight.medium },
  breakdownAmount: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.semibold },
  budgetStatus: { color: colors.textMuted, fontSize: fontSize.xs },
  overBudget: { color: colors.danger },
  breakdownBarContainer: { height: 8, backgroundColor: colors.surfaceSoft, borderRadius: radius.full, overflow: 'hidden' },
  breakdownBar: { height: '100%', borderRadius: radius.full },
});
