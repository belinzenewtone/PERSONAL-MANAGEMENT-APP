import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, fontWeight, useAppTheme } from '../../../lib/theme';
import { CATEGORY_COLORS } from '../finance.constants';
import { CategoryIcon } from '../../../lib/category-icons';
import { SOURCES, fmt } from './finance-screen.shared';
import type { Transaction } from '@personal-os/types';

interface FinanceTransactionItemProps {
  tx: Transaction;
  onPress: () => void;
  onLongPress: () => void;
  onTogglePinned?: () => void;
}

export const FinanceTransactionItem = memo(function FinanceTransactionItem({
  tx,
  onPress,
  onLongPress,
  onTogglePinned,
}: FinanceTransactionItemProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isIncome = tx.type === 'income';
  const color = CATEGORY_COLORS[tx.category] ?? colors.textMuted;
  const source = SOURCES.find((item) => item.value === tx.source)?.label ?? tx.source;

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.txItem}>
      <View style={[styles.txIconWrap, { backgroundColor: `${color}22` }]}>
        <CategoryIcon category={tx.category} size={18} color={color} />
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txCategory} numberOfLines={1}>{tx.category}</Text>
        {tx.description ? (
          <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        ) : tx.mpesa_code ? (
          <Text style={styles.txDesc}>{tx.mpesa_code}</Text>
        ) : null}
        <Text style={styles.txSource}>{source}</Text>
      </View>
      <View style={styles.txRight}>
        <TouchableOpacity onPress={onTogglePinned} hitSlop={8}>
          <Ionicons
            name={tx.is_pinned ? 'star' : 'star-outline'}
            size={16}
            color={tx.is_pinned ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
        <Text style={[styles.txAmount, { color: isIncome ? colors.success : colors.textPrimary }]}>
          {isIncome ? '+' : '-'}{fmt(Number(tx.amount))}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    txItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, minHeight: 76 },
    txIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    txBody: { flex: 1 },
    txCategory: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
    txDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
    txSource: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3, textTransform: 'capitalize' },
    txRight: { alignItems: 'flex-end', gap: 8, marginTop: 1 },
    txAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  });
