import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { format, isSameDay, parseISO, subDays } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import { GlassCard } from '../../../components/ui/GlassCard';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import type { Transaction } from '@personal-os/types';

const { width: screenWidth } = Dimensions.get('window');

export function FinanceSpendingTrendChart({ transactions }: { transactions: Transaction[] }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return days.map((d) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && isSameDay(parseISO(t.transaction_date), d))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { label: format(d, 'EEE'), total };
    });
  }, [transactions]);

  if (!last7.some((d) => d.total > 0)) {
    return (
      <GlassCard style={styles.chartCard} padding="md">
        <Text style={styles.chartTitle}>Spending Trend (7 days)</Text>
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>No spending data yet</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.chartCard} padding="md">
      <Text style={styles.chartTitle}>Spending Trend (7 days)</Text>
      <LineChart
        data={{
          labels: last7.map((d) => d.label),
          datasets: [{ data: last7.map((d) => d.total || 0) }],
        }}
        width={screenWidth - spacing.md * 4 - 2}
        height={160}
        chartConfig={{
          backgroundColor: 'transparent',
          backgroundGradientFrom: 'transparent',
          backgroundGradientTo: 'transparent',
          decimalPlaces: 0,
          color: (opacity = 1) => `${colors.accent}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
          labelColor: () => colors.textMuted,
          propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
          propsForBackgroundLines: { stroke: `${colors.border}88` },
        }}
        bezier
        withInnerLines={false}
        style={styles.chart}
      />
    </GlassCard>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  chartCard: { marginBottom: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  chartEmpty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },
  chart: { borderRadius: radius.md, marginLeft: -spacing.sm, paddingRight: spacing.sm },
});
