import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isSameDay, subDays } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import {
  useTransactions, useCreateTransaction,
  useUpdateTransaction, useDeleteTransaction,
} from '../../src/features/finance/finance.hooks';
import { financeService, FilterPeriod } from '../../src/features/finance/finance.service';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS,
} from '../../src/features/finance/finance.constants';
import { TextInput } from '../../src/components/ui/TextInput';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { Transaction, TransactionType, TransactionSource } from '@personal-os/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year',  label: 'Year' },
  { value: 'all',   label: 'All' },
];

const SOURCES: { value: TransactionSource; label: string; icon: string }[] = [
  { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { value: 'bank',  label: 'Bank',   icon: '🏦' },
  { value: 'cash',  label: 'Cash',   icon: '💵' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const txSchema = z.object({
  type:             z.enum(['income', 'expense']),
  amount:           z.string().min(1).refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  category:         z.string().min(1, 'Select a category'),
  description:      z.string().optional(),
  source:           z.enum(['mpesa', 'bank', 'cash']),
  mpesa_code:       z.string().optional(),
  transaction_date: z.string().min(1),
});

type TxFormInput = z.infer<typeof txSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function groupByDate(transactions: Transaction[]) {
  const groups: { date: string; items: Transaction[] }[] = [];
  const map: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    const key = t.transaction_date.slice(0, 10);
    if (!map[key]) { map[key] = []; groups.push({ date: key, items: map[key] }); }
    map[key].push(t);
  });
  return groups;
}

function toLocalDateString() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCards({ income, expense, balance, savingsRate }: {
  income: number; expense: number; balance: number; savingsRate: number;
}) {
  return (
    <View style={styles.summaryGrid}>
      <Card style={[styles.summaryCard, styles.summaryCardIncome]}>
        <Text style={styles.summaryIcon}>📈</Text>
        <Text style={styles.summaryLabel}>Income</Text>
        <Text style={[styles.summaryAmount, { color: colors.success }]}>{fmt(income)}</Text>
      </Card>
      <Card style={[styles.summaryCard, styles.summaryCardExpense]}>
        <Text style={styles.summaryIcon}>📉</Text>
        <Text style={styles.summaryLabel}>Expenses</Text>
        <Text style={[styles.summaryAmount, { color: colors.danger }]}>{fmt(expense)}</Text>
      </Card>
      <Card style={[styles.summaryCard, styles.summaryCardBalance]}>
        <Text style={styles.summaryIcon}>💼</Text>
        <Text style={styles.summaryLabel}>Balance</Text>
        <Text style={[styles.summaryAmount, { color: balance >= 0 ? colors.success : colors.danger }]}>
          {fmt(balance)}
        </Text>
      </Card>
      <Card style={[styles.summaryCard, styles.summaryCardSavings]}>
        <Text style={styles.summaryIcon}>🎯</Text>
        <Text style={styles.summaryLabel}>Savings</Text>
        <Text style={[styles.summaryAmount, { color: savingsRate >= 20 ? colors.success : colors.warning }]}>
          {savingsRate}%
        </Text>
      </Card>
    </View>
  );
}

// ─── Spending Trend Chart ─────────────────────────────────────────────────────

function SpendingTrendChart({ transactions }: { transactions: Transaction[] }) {
  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return days.map((d) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && isSameDay(parseISO(t.transaction_date), d))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { label: format(d, 'EEE'), total };
    });
  }, [transactions]);

  const hasData = last7.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending Trend (7 days)</Text>
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>No spending data yet</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Spending Trend (7 days)</Text>
      <LineChart
        data={{
          labels: last7.map((d) => d.label),
          datasets: [{ data: last7.map((d) => d.total || 0) }],
        }}
        width={SCREEN_WIDTH - spacing.md * 2 - spacing.md * 2 - 2}
        height={160}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: () => colors.textMuted,
          propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
          propsForBackgroundLines: { stroke: colors.border + '55' },
        }}
        bezier
        withInnerLines={false}
        style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
      />
    </Card>
  );
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ transactions }: { transactions: Transaction[] }) {
  const breakdown = useMemo(
    () => financeService.getCategoryBreakdown(transactions),
    [transactions]
  );

  const total = breakdown.reduce((s, c) => s + c.total, 0);

  if (breakdown.length === 0) return null;

  return (
    <Card style={styles.breakdownCard}>
      <Text style={styles.chartTitle}>Expenses by Category</Text>
      {breakdown.slice(0, 6).map(({ category, total: catTotal }) => {
        const pct = total > 0 ? (catTotal / total) * 100 : 0;
        const color = CATEGORY_COLORS[category] ?? colors.textMuted;
        return (
          <View key={category} style={styles.breakdownRow}>
            <View style={[styles.breakdownDot, { backgroundColor: color }]} />
            <Text style={styles.breakdownLabel} numberOfLines={1}>{category}</Text>
            <View style={styles.breakdownBarContainer}>
              <View style={[styles.breakdownBar, { width: `${pct}%` as any, backgroundColor: color + 'aa' }]} />
            </View>
            <Text style={styles.breakdownAmount}>{fmt(catTotal)}</Text>
          </View>
        );
      })}
    </Card>
  );
}

// ─── Transaction Item ─────────────────────────────────────────────────────────

function TransactionItem({ tx, onPress, onLongPress }: {
  tx: Transaction;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const isIncome = tx.type === 'income';
  const color = CATEGORY_COLORS[tx.category] ?? colors.textMuted;
  const source = SOURCES.find((s) => s.value === tx.source);

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.txItem}>
      <View style={[styles.txIconWrap, { backgroundColor: color + '22' }]}>
        <Text style={styles.txIcon}>{source?.icon ?? '💳'}</Text>
      </View>
      <View style={styles.txBody}>
        <Text style={styles.txCategory} numberOfLines={1}>{tx.category}</Text>
        {tx.description ? (
          <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
        ) : tx.mpesa_code ? (
          <Text style={styles.txDesc}>{tx.mpesa_code}</Text>
        ) : null}
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? colors.success : colors.textPrimary }]}>
        {isIncome ? '+' : '-'}{fmt(Number(tx.amount))}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Transaction Form Modal ───────────────────────────────────────────────────

function TransactionFormModal({ visible, editTx, onClose }: {
  visible: boolean;
  editTx?: Transaction | null;
  onClose: () => void;
}) {
  const createTx  = useCreateTransaction();
  const updateTx  = useUpdateTransaction();
  const isEditing = !!editTx;

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TxFormInput>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type:             editTx?.type             ?? 'expense',
      amount:           editTx ? String(editTx.amount) : '',
      category:         editTx?.category         ?? '',
      description:      editTx?.description      ?? '',
      source:           editTx?.source           ?? 'mpesa',
      mpesa_code:       editTx?.mpesa_code       ?? '',
      transaction_date: editTx
        ? toLocalDateString()
        : toLocalDateString(),
    },
  });

  const txType   = watch('type');
  const source   = watch('source');
  const category = watch('category');
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (data: TxFormInput) => {
    const payload = {
      type:             data.type,
      amount:           Number(data.amount),
      category:         data.category,
      description:      data.description || null,
      source:           data.source,
      mpesa_code:       data.mpesa_code || null,
      auto_imported:    false,
      transaction_date: new Date(data.transaction_date).toISOString(),
    };
    if (isEditing && editTx) {
      await updateTx.mutateAsync({ id: editTx.id, ...payload });
    } else {
      await createTx.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>

          {/* Income / Expense toggle */}
          <View style={styles.typeToggle}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => { setValue('type', t); setValue('category', ''); }}
                style={[
                  styles.typeBtn,
                  txType === t && (t === 'expense' ? styles.typeBtnExpenseActive : styles.typeBtnIncomeActive),
                ]}
              >
                <Text style={[styles.typeBtnText, txType === t && styles.typeBtnTextActive]}>
                  {t === 'expense' ? '📉 Expense' : '📈 Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Amount (KES) *"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.amount?.message}
              />
            )}
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat] ?? colors.textMuted;
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setValue('category', cat)}
                  style={[styles.catChip, selected && { backgroundColor: color + '33', borderColor: color }]}
                >
                  <Text style={[styles.catChipText, selected && { color }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

          {/* Source */}
          <Text style={styles.fieldLabel}>Source</Text>
          <View style={styles.chipRow}>
            {SOURCES.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setValue('source', s.value)}
                style={[styles.chip, source === s.value && { backgroundColor: colors.accent + '33', borderColor: colors.accent }]}
              >
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={[styles.chipText, source === s.value && { color: colors.accentLight }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* M-Pesa code (optional) */}
          {source === 'mpesa' && (
            <Controller
              control={control}
              name="mpesa_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="M-Pesa Code (optional)"
                  placeholder="e.g. RHK2XD..."
                  autoCapitalize="characters"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          )}

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description (optional)"
                placeholder="What was this for?"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={2}
              />
            )}
          />

          <Button
            label={isEditing ? 'Save Changes' : 'Add Transaction'}
            onPress={handleSubmit(onSubmit)}
            loading={createTx.isPending || updateTx.isPending}
            fullWidth size="lg"
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Finance Screen ──────────────────────────────────────────────────────

export default function FinanceScreen() {
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [showModal, setShowModal]   = useState(false);
  const [editTx, setEditTx]         = useState<Transaction | null>(null);
  const [showEdit, setShowEdit]     = useState(false);

  const { data: transactions = [], isLoading } = useTransactions(period);
  const deleteTx = useDeleteTransaction();

  const summary   = useMemo(() => financeService.getMonthlySummary(transactions), [transactions]);
  const grouped   = useMemo(() => groupByDate(transactions), [transactions]);

  const handleLongPress = (tx: Transaction) => {
    Alert.alert(tx.category, tx.description ?? fmt(Number(tx.amount)), [
      { text: 'Edit',   onPress: () => { setEditTx(tx); setShowEdit(true); } },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTx.mutate(tx.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Finance</Text>
        <Text style={styles.periodLabel}>{format(new Date(), 'MMMM yyyy')}</Text>
      </View>

      {/* Period filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setPeriod(f.value)}
            style={[styles.filterChip, period === f.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, period === f.value && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Summary Cards */}
          <SummaryCards {...summary} />

          {/* Spending Trend */}
          <SpendingTrendChart transactions={transactions} />

          {/* Category Breakdown */}
          <CategoryBreakdown transactions={transactions} />

          {/* Transactions */}
          <Text style={styles.sectionTitle}>Transactions</Text>
          {grouped.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap + to record one</Text>
            </View>
          ) : (
            grouped.map(({ date, items }) => (
              <View key={date}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>
                    {isSameDay(parseISO(date), new Date())
                      ? 'Today'
                      : format(parseISO(date), 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.dateHeaderTotal}>
                    {fmt(items.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0))}
                  </Text>
                </View>
                <Card style={styles.txCard}>
                  {items.map((tx, i) => (
                    <View key={tx.id}>
                      <TransactionItem
                        tx={tx}
                        onPress={() => { setEditTx(tx); setShowEdit(true); }}
                        onLongPress={() => handleLongPress(tx)}
                      />
                      {i < items.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <TransactionFormModal visible={showModal} onClose={() => setShowModal(false)} />

      {showEdit && editTx && (
        <TransactionFormModal
          visible={showEdit}
          editTx={editTx}
          onClose={() => { setShowEdit(false); setEditTx(null); }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  screenTitle:  { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  periodLabel:  { fontSize: fontSize.sm, color: colors.textSecondary },

  filtersScroll:     { maxHeight: 44, marginTop: spacing.sm },
  filtersContainer:  { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterChip:        { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  filterChipActive:  { backgroundColor: colors.accent, borderColor: colors.accent },
  filterChipText:    { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  filterChipTextActive: { color: '#fff' },

  scroll: { padding: spacing.md, paddingBottom: 100 },

  // Summary grid
  summaryGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard:    { width: '47.5%', alignItems: 'flex-start', gap: 4 },
  summaryCardIncome:  {},
  summaryCardExpense: {},
  summaryCardBalance: {},
  summaryCardSavings: {},
  summaryIcon:   { fontSize: 22 },
  summaryLabel:  { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  summaryAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },

  // Chart
  chartCard:      { marginBottom: spacing.md },
  chartTitle:     { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  chartEmpty:     { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },

  // Breakdown
  breakdownCard:         { marginBottom: spacing.md, gap: spacing.sm },
  breakdownRow:          { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  breakdownDot:          { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  breakdownLabel:        { fontSize: fontSize.xs, color: colors.textSecondary, width: 90, flexShrink: 0 },
  breakdownBarContainer: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  breakdownBar:          { height: '100%', borderRadius: radius.full },
  breakdownAmount:       { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: fontWeight.medium, width: 70, textAlign: 'right', flexShrink: 0 },

  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },

  // Date group
  dateHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: spacing.sm },
  dateHeaderText:  { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  dateHeaderTotal: { fontSize: fontSize.xs, color: colors.danger },

  // Transaction item
  txCard: { padding: 0, gap: 0, overflow: 'hidden', marginBottom: spacing.sm },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txIcon:     { fontSize: 18 },
  txBody:     { flex: 1 },
  txCategory: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  txDesc:     { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  txAmount:   { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  divider:    { height: 1, backgroundColor: colors.border + '66', marginHorizontal: spacing.md },

  empty:        { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon:    { fontSize: 48, marginBottom: spacing.sm },
  emptyText:    { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  // FAB
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  modalScroll: { padding: spacing.lg, gap: spacing.md },

  // Type toggle
  typeToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  typeBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  typeBtnExpenseActive: { backgroundColor: colors.danger + '22', borderColor: colors.danger },
  typeBtnIncomeActive:  { backgroundColor: colors.success + '22', borderColor: colors.success },
  typeBtnText:       { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  typeBtnTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },

  // Category chips
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  catChip: {
    paddingVertical: 6, paddingHorizontal: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  catChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipRow:  { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  errorText: { fontSize: fontSize.xs, color: colors.danger },
});
