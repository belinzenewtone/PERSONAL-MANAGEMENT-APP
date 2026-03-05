import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, isSameDay, subDays } from 'date-fns';
import { LineChart } from 'react-native-chart-kit';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import {
  useTransactions, useCreateTransaction,
  useUpdateTransaction, useDeleteTransaction,
} from '../../src/features/finance/finance.hooks';
import { useBudgets, useUpsertBudget } from '../../src/features/finance/budget.hooks';
import { Budget } from '../../src/features/finance/budget.service';
import { financeService, FilterPeriod } from '../../src/features/finance/finance.service';
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS,
} from '../../src/features/finance/finance.constants';
import { TextInput } from '../../src/components/ui/TextInput';
import { Button } from '../../src/components/ui/Button';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { SmsImportModal } from '../../src/components/finance/SmsImportModal';
import { FinanceSkeletonList } from '../../src/components/ui/Skeleton';
import { toast } from '../../src/components/ui/Toast';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import { Capsule } from '../../src/components/ui/Capsule';
import type { Transaction, TransactionType, TransactionSource } from '@personal-os/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTERS: { value: FilterPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

const SOURCES: { value: TransactionSource; label: string; icon: string }[] = [
  { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
  { value: 'bank', label: 'Bank', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💵' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const txSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1).refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  category: z.string().min(1, 'Select a category'),
  description: z.string().optional(),
  source: z.enum(['mpesa', 'bank', 'cash']),
  mpesa_code: z.string().optional(),
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
      <GlassCard style={[styles.summaryCard, styles.summaryCardIncome]}>
        <Text style={styles.summaryIcon}>📈</Text>
        <Text style={styles.summaryLabel}>Income</Text>
        <Text style={[styles.summaryAmount, { color: colors.success }]}>{fmt(income)}</Text>
      </GlassCard>
      <GlassCard style={[styles.summaryCard, styles.summaryCardExpense]}>
        <Text style={styles.summaryIcon}>📉</Text>
        <Text style={styles.summaryLabel}>Expenses</Text>
        <Text style={[styles.summaryAmount, { color: colors.danger }]}>{fmt(expense)}</Text>
      </GlassCard>
      <GlassCard style={[styles.summaryCard, styles.summaryCardBalance]}>
        <Text style={styles.summaryIcon}>💼</Text>
        <Text style={styles.summaryLabel}>Balance</Text>
        <Text style={[styles.summaryAmount, { color: balance >= 0 ? colors.success : colors.danger }]}>
          {fmt(balance)}
        </Text>
      </GlassCard>
      <GlassCard style={[styles.summaryCard, styles.summaryCardSavings]}>
        <Text style={styles.summaryIcon}>🎯</Text>
        <Text style={styles.summaryLabel}>Savings</Text>
        <Text style={[styles.summaryAmount, { color: savingsRate >= 20 ? colors.success : colors.warning }]}>
          {savingsRate}%
        </Text>
      </GlassCard>
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
      <GlassCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>Spending Trend (7 days)</Text>
        <View style={styles.chartEmpty}>
          <Text style={styles.chartEmptyText}>No spending data yet</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.chartCard}>
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
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.05)' },
        }}
        bezier
        withInnerLines={false}
        style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
      />
    </GlassCard>
  );
}

// ─── Category Breakdown ───────────────────────────────────────────────────────

function CategoryBreakdown({ transactions, budgets, onCategoryPress }: {
  transactions: Transaction[];
  budgets: Budget[];
  onCategoryPress: (category: string) => void;
}) {
  const breakdown = useMemo(
    () => financeService.getCategoryBreakdown(transactions),
    [transactions]
  );

  return (
    <GlassCard style={styles.breakdownCard}>
      <Text style={styles.chartTitle}>Expenses vs Budgets</Text>
      {breakdown.length === 0 && (
        <Text style={styles.chartEmptyText}>No expenses this period</Text>
      )}
      {breakdown.slice(0, 8).map(({ category, total: catTotal }) => {
        const budget = budgets.find(b => b.category === category);
        const budgetAmount = budget?.amount || 0;
        const pct = budgetAmount > 0 ? (catTotal / budgetAmount) * 100 : 0;
        const color = CATEGORY_COLORS[category] ?? colors.textMuted;

        return (
          <TouchableOpacity
            key={category}
            onPress={() => onCategoryPress(category)}
            style={styles.breakdownRowOuter}
          >
            <View style={styles.breakdownRow}>
              <View style={[styles.breakdownDot, { backgroundColor: color }]} />
              <Text style={styles.breakdownLabel} numberOfLines={1}>{category}</Text>
              <Text style={styles.breakdownAmount}>
                {fmt(catTotal)} {budgetAmount > 0 && <Text style={styles.budgetAmount}>/ {fmt(budgetAmount)}</Text>}
              </Text>
            </View>
            <View style={styles.breakdownBarContainer}>
              <View style={[
                styles.breakdownBar,
                {
                  width: `${Math.min(pct || 0, 100)}%` as any,
                  backgroundColor: pct > 100 ? colors.danger : (color + 'aa')
                }
              ]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </GlassCard>
  );
}

// ─── Budget Modal ─────────────────────────────────────────────────────────────

function BudgetModal({ visible, category, currentAmount, onClose, onSave }: {
  visible: boolean;
  category: string;
  currentAmount?: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : '');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={onClose}>
        <GlassCard style={styles.budgetModalContent}>
          <Text style={styles.modalTitle}>Set Budget: {category}</Text>
          <TextInput
            label="Monthly Limit (KES)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Save" onPress={() => onSave(Number(amount))} style={{ flex: 1 }} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Modal>
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
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const isEditing = !!editTx;

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<TxFormInput>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: editTx?.type ?? 'expense',
      amount: editTx ? String(editTx.amount) : '',
      category: editTx?.category ?? '',
      description: editTx?.description ?? '',
      source: editTx?.source ?? 'mpesa',
      mpesa_code: editTx?.mpesa_code ?? '',
      transaction_date: editTx
        ? toLocalDateString()
        : toLocalDateString(),
    },
  });

  const txType = watch('type');
  const source = watch('source');
  const category = watch('category');
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (data: TxFormInput) => {
    const payload = {
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      description: data.description || null,
      source: data.source,
      mpesa_code: data.mpesa_code || null,
      auto_imported: false,
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

          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat] ?? colors.textMuted;
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setValue('category', cat)}
                  style={styles.catChipWrapper}
                >
                  <Capsule
                    label={cat}
                    color={color}
                    variant={selected ? 'subtle' : 'outline'}
                    size="md"
                    style={styles.fullWidthCapsule}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

          <Text style={styles.fieldLabel}>Source</Text>
          <View style={styles.chipRow}>
            {SOURCES.map((s) => (
              <TouchableOpacity
                key={s.value}
                onPress={() => setValue('source', s.value)}
                style={styles.chipWrapper}
              >
                <Capsule
                  label={s.label}
                  color={colors.accent}
                  variant={source === s.value ? 'subtle' : 'outline'}
                  size="md"
                  icon={<Text style={styles.chipIcon}>{s.icon}</Text>}
                />
              </TouchableOpacity>
            ))}
          </View>

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSmsImport, setShowSmsImport] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);

  const { data: transactions = [], isLoading } = useTransactions(period);
  const { data: budgets = [] } = useBudgets();
  const deleteTx = useDeleteTransaction();
  const upsertBudget = useUpsertBudget();

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t =>
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (t.mpesa_code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );
  }, [transactions, searchQuery]);

  const summary = useMemo(() => financeService.getMonthlySummary(transactions), [transactions]);
  const grouped = useMemo(() => groupByDate(filteredTransactions), [filteredTransactions]);

  const handleExport = async () => {
    try {
      if (transactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }
      const header = 'Date,Type,Category,Amount,Description,Source,MPesa Code\n';
      const rows = transactions.map(t =>
        `${t.transaction_date.slice(0, 10)},${t.type},${t.category},${t.amount},"${t.description || ''}",${t.source},${t.mpesa_code || ''}`
      ).join('\n');

      // Use dynamic access to avoid lint issues with library types
      const fs = FileSystem as any;
      const fileUri = fs.cacheDirectory + `finance_export_${format(new Date(), 'yyyy_MM')}.csv`;
      await fs.writeAsStringAsync(fileUri, header + rows, { encoding: fs.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        toast.error('Sharing not available');
      }
    } catch (err) {
      toast.error('Export failed');
      console.error(err);
    }
  };

  const handleLongPress = (tx: Transaction) => {
    deleteTx.mutate(tx.id, {
      onSuccess: () => toast.info('Transaction deleted'),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Finance</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleExport} style={styles.headerIconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSmsImport(true)} style={styles.smsImportBtn}>
            <Text style={styles.smsImportText}>📱 Import</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          containerStyle={styles.searchField}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            onPress={() => setPeriod(f.value)}
            style={styles.filterChipWrapper}
          >
            <Capsule
              label={f.label}
              color={colors.accent}
              variant={period === f.value ? 'solid' : 'outline'}
              size="sm"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <FinanceSkeletonList />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <SummaryCards {...summary} />
          <SpendingTrendChart transactions={transactions} />
          <CategoryBreakdown
            transactions={transactions}
            budgets={budgets}
            onCategoryPress={(cat) => setSelectedBudgetCategory(cat)}
          />

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
                <GlassCard style={styles.txCard}>
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
                </GlassCard>
              </View>
            ))
          )}
        </ScrollView>
      )}

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

      <SmsImportModal visible={showSmsImport} onClose={() => setShowSmsImport(false)} />

      {selectedBudgetCategory && (
        <BudgetModal
          visible={!!selectedBudgetCategory}
          category={selectedBudgetCategory}
          currentAmount={budgets.find(b => b.category === selectedBudgetCategory)?.amount}
          onClose={() => setSelectedBudgetCategory(null)}
          onSave={async (amount) => {
            await upsertBudget.mutateAsync({ category: selectedBudgetCategory, amount });
            setSelectedBudgetCategory(null);
            toast.success(`Budget for ${selectedBudgetCategory} updated`);
          }}
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
  screenTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIconBtn: {
    padding: spacing.xs + 2,
    backgroundColor: 'rgba(30, 30, 35, 0.6)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  smsImportBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(30, 30, 35, 0.6)', borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  smsImportText: { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: fontWeight.medium },

  filtersScroll: { maxHeight: 44, marginTop: spacing.sm },
  filtersContainer: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterChip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filterChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  filterChipTextActive: { color: '#fff' },

  scroll: { padding: spacing.md, paddingBottom: 140 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  summaryCard: { width: '47.5%', alignItems: 'flex-start', gap: 4 },
  summaryIcon: { fontSize: 22 },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  summaryAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textPrimary },

  chartCard: { marginBottom: spacing.md },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginBottom: spacing.sm },
  chartEmpty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { color: colors.textMuted, fontSize: fontSize.sm },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchField: { flex: 1, height: 40, marginBottom: 0 },
  searchInput: { height: 40, paddingLeft: 36, paddingRight: 36 },
  searchIcon: { position: 'absolute', left: 24, zIndex: 1 },
  clearBtn: { position: 'absolute', right: 24, zIndex: 1 },

  breakdownCard: { marginBottom: spacing.md, gap: spacing.sm },
  breakdownRowOuter: { marginBottom: spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: fontSize.xs, color: colors.textSecondary, flex: 1 },
  breakdownBarContainer: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.full, overflow: 'hidden' },
  breakdownBar: { height: '100%', borderRadius: radius.full },
  breakdownAmount: { fontSize: fontSize.xs, color: colors.textPrimary, fontWeight: fontWeight.medium },
  budgetAmount: { color: colors.textMuted, fontSize: 10 },

  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: spacing.sm },
  dateHeaderText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  dateHeaderTotal: { fontSize: fontSize.xs, color: colors.danger },

  txCard: { padding: 0, gap: 0, overflow: 'hidden', marginBottom: spacing.sm },
  txItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txIcon: { fontSize: 18 },
  txBody: { flex: 1 },
  txCategory: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  txDesc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  txAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: spacing.md },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  fab: {
    position: 'absolute', right: spacing.lg, bottom: 110,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  budgetModalContent: { width: '100%', padding: spacing.lg, gap: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },

  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  modalScroll: { padding: spacing.lg, gap: spacing.md },

  typeToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  typeBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center',
  },
  typeBtnExpenseActive: { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: colors.danger },
  typeBtnIncomeActive: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: colors.success },
  typeBtnText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  typeBtnTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },

  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  summaryCardIncome: { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' },
  summaryCardExpense: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' },
  summaryCardBalance: { backgroundColor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' },
  summaryCardSavings: { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.2)' },

  catChipWrapper: {
    marginBottom: spacing.xs,
  },
  fullWidthCapsule: {
    minWidth: 80,
  },
  chipWrapper: {
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chipIcon: { fontSize: 14, marginRight: 4 },
  filterChipWrapper: {
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  errorText: { fontSize: fontSize.xs, color: colors.danger },
});
