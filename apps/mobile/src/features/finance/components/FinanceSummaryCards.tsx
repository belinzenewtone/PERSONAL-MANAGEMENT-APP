import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { spacing, textStyles, useAppTheme } from '../../../lib/theme';
import { fmt } from './finance-screen.shared';

interface Props {
  income: number; expense: number; balance: number;
  savingsRate: number; isLoading?: boolean;
}

export function FinanceSummaryCards({ income, expense, balance, savingsRate, isLoading }: Props) {
  const { colors } = useAppTheme();

  const cards = [
    { icon: 'trending-up-outline', label: 'Income',   value: isLoading ? null : fmt(income),        color: colors.success,     bg: `${colors.success}12`,  border: `${colors.success}30` },
    { icon: 'trending-down-outline', label: 'Expenses', value: isLoading ? null : fmt(expense),      color: colors.danger,      bg: `${colors.danger}12`,   border: `${colors.danger}30`  },
    { icon: 'wallet-outline', label: 'Balance',        value: isLoading ? null : fmt(balance),       color: balance >= 0 ? colors.success : colors.danger, bg: `${colors.accent}12`, border: `${colors.accent}30` },
    { icon: 'shield-checkmark-outline', label: 'Savings',  value: isLoading ? null : `${savingsRate}%`, color: savingsRate >= 20 ? colors.success : colors.warning, bg: `${colors.warning}12`, border: `${colors.warning}30` },
  ] as const;

  return (
    <View style={s.grid}>
      {cards.map(({ icon, label, value, color, bg, border }) => (
        <GlassCard key={label} style={[s.card, { backgroundColor: bg, borderColor: border }]} padding="md">
          <Ionicons name={icon as any} size={18} color={color} />
          <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
          {isLoading || value === null ? (
            <Skeleton style={s.skeleton} />
          ) : (
            <Text style={[s.amount, { color }]}>{value}</Text>
          )}
        </GlassCard>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  card: { flexBasis: '48%', flexGrow: 1, gap: 6, minHeight: 116, justifyContent: 'space-between' },
  label: { ...textStyles.eyebrow },
  amount: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  skeleton: { height: 24, width: '70%', borderRadius: 6 },
});
