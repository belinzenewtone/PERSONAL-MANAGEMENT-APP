import React, { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isSameDay, parseISO } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useBudgets, useUpsertBudget } from '../budget.hooks';
import { useDeleteTransaction, useSetTransactionPinned, useTransactions } from '../finance.hooks';
import { financeService } from '../finance.service';
import type { FilterPeriod } from '../finance.service';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FilterToggle } from '../../../components/ui/FilterToggle';
import { SearchBar } from '../../../components/ui/SearchBar';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { GlassCard } from '../../../components/ui/GlassCard';
import { SmsImportModal } from '../../../components/finance/SmsImportModal';
import { FinanceSkeletonList } from '../../../components/ui/Skeleton';
import { toast } from '../../../components/ui/Toast';
import { appLayout, spacing, fontSize, fontWeight, useAppTheme } from '../../../lib/theme';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageShell } from '../../../components/ui/PageShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FILTERS, fmt, groupByDate } from './finance-screen.shared';
import { FinanceBudgetModal } from './FinanceBudgetModal';
import { FinanceCategoryBreakdown } from './FinanceCategoryBreakdown';
import { FinanceSpendingTrendChart } from './FinanceSpendingTrendChart';
import { FinanceSummaryCards } from './FinanceSummaryCards';
import { FinanceTransactionFormModal } from './FinanceTransactionFormModal';
import { FinanceTransactionItem } from './FinanceTransactionItem';
import type { Transaction } from '@personal-os/types';

// Colour mapping for period filter dots
const PERIOD_COLORS: Record<FilterPeriod, string> = {
  today:  '#6ee7b7', // green-ish
  week:   '#93c5fd', // blue
  month:  '#a78bfa', // violet
  year:   '#fcd34d', // amber
  all:    '#94a3b8', // slate
};

export function FinanceScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [period, setPeriod] = useState<FilterPeriod>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [showSmsImport, setShowSmsImport] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const { data: transactions = [], isLoading, isFetching } = useTransactions(period);
  const { data: budgets = [] } = useBudgets();
  const deleteTx = useDeleteTransaction();
  const setPinned = useSetTransactionPinned();
  const upsertBudget = useUpsertBudget();

  const filteredTransactions = useMemo(() => {
    if (!deferredSearchQuery) return transactions;
    const q = deferredSearchQuery.toLowerCase();
    return transactions.filter((tx) =>
      tx.category.toLowerCase().includes(q) ||
      (tx.description?.toLowerCase().includes(q) ?? false) ||
      (tx.mpesa_code?.toLowerCase().includes(q) ?? false),
    );
  }, [deferredSearchQuery, transactions]);

  const summary = useMemo(() => financeService.getMonthlySummary(transactions), [transactions]);
  const groupedTransactions = useMemo(() => groupByDate(filteredTransactions), [filteredTransactions]);

  // Filter options with period colours
  const filterOptions = useMemo(() =>
    FILTERS.map((f) => ({ value: f.value, label: f.label, color: PERIOD_COLORS[f.value] })),
    [],
  );

  async function handleExport() {
    try {
      if (transactions.length === 0) { toast.error('No transactions to export'); return; }
      const header = 'Date,Type,Category,Amount,Description,Source,MPesa Code\n';
      const rows = transactions.map((tx) =>
        `${tx.transaction_date.slice(0, 10)},${tx.type},${tx.category},${tx.amount},"${tx.description || ''}",${tx.source},${tx.mpesa_code || ''}`,
      ).join('\n');
      const fs = FileSystem as any;
      const fileUri = `${fs.cacheDirectory}finance_export_${format(new Date(), 'yyyy_MM')}.csv`;
      await fs.writeAsStringAsync(fileUri, header + rows);
      if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(fileUri); return; }
      toast.error('Sharing not available');
    } catch { toast.error('Export failed'); }
  }

  function handleDelete(tx: Transaction) {
    deleteTx.mutate(tx.id, { onSuccess: () => toast.success('Transaction deleted'),
      onError:   () => toast.error('Could not delete transaction') });
  }

  async function handleBudgetSave(amount: number) {
    if (!selectedBudgetCategory) return;
    try {
      await upsertBudget.mutateAsync({ category: selectedBudgetCategory, amount });
      toast.success(`Budget for ${selectedBudgetCategory} updated`);
    } catch {
      toast.error('Could not save budget');
    }
    setSelectedBudgetCategory(null);
  }


  const listHeader = (
    <>
      <FinanceSummaryCards {...summary} isLoading={isLoading} />

      {isFetching && !isLoading && (
        <Text style={styles.refreshingText}>Updating…</Text>
      )}

      <FinanceSpendingTrendChart transactions={transactions} />
      <FinanceCategoryBreakdown transactions={transactions} budgets={budgets} onCategoryPress={setSelectedBudgetCategory} />

      <Text style={styles.sectionTitle}>Transactions</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <PageShell scroll={false} contentContainerStyle={styles.shell}>
        <PageHeader
          eyebrow="Money"
          title="Finance"
          subtitle="Cashflow, budgets, and M-Pesa imports."
          action={
            <View style={styles.headerActions}>
              <IconPillButton
                onPress={handleExport}
                icon={<Ionicons name="share-outline" size={18} color={colors.accentLight} />}
              />
              <IconPillButton
                onPress={() => setShowSmsImport(true)}
                icon={<Ionicons name="phone-portrait-outline" size={16} color={colors.accentLight} />}
                label="Import"
              />
            </View>
          }
        />

        {/* Compact tool row — search icon (expands) + period filter pill */}
        <View style={styles.toolRow}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search transactions…"
          />
          <FilterToggle
            options={filterOptions}
            value={period}
            onChange={setPeriod}
          />
        </View>

        {isLoading && transactions.length === 0 ? (
          <FinanceSkeletonList />
        ) : (
          <FlatList
            data={groupedTransactions}
            keyExtractor={(group) => group.date}
            renderItem={({ item: group }) => (
              <View>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateHeaderText}>
                    {isSameDay(parseISO(group.date), new Date()) ? 'Today' : format(parseISO(group.date), 'EEE, MMM d')}
                  </Text>
                  <Text style={styles.dateHeaderTotal}>
                    {fmt(group.items.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0))}
                  </Text>
                </View>
                <GlassCard style={styles.txCard}>
                  {group.items.map((tx, index) => (
                    <View key={tx.id}>
                      <FinanceTransactionItem
                        tx={tx}
                        onPress={() => setEditTx(tx)}
                        onLongPress={() => handleDelete(tx)}
                        onTogglePinned={() => setPinned.mutate(
                          { id: tx.id, isPinned: !tx.is_pinned },
                          {
                            onSuccess: () => toast.info(tx.is_pinned ? 'Transaction unpinned' : 'Transaction pinned'),
                            onError:   () => toast.error('Could not update pin'),
                          },
                        )}
                      />
                      {index < group.items.length - 1 && <View style={styles.divider} />}
                    </View>
                  ))}
                </GlassCard>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                icon="wallet-outline"
                title="No transactions yet"
                subtitle="Add your first expense or income item to start tracking your cashflow."
                actionLabel="Add transaction"
                onAction={() => setShowCreate(true)}
              />
            }
          />
        )}
      </PageShell>

      <FloatingActionButton onPress={() => setShowCreate(true)} />
      <FinanceTransactionFormModal visible={showCreate} onClose={() => setShowCreate(false)} />
      <FinanceTransactionFormModal visible={!!editTx} editTx={editTx} onClose={() => setEditTx(null)} />
      <SmsImportModal visible={showSmsImport} onClose={() => setShowSmsImport(false)} />
      {selectedBudgetCategory && (
        <FinanceBudgetModal
          visible
          category={selectedBudgetCategory}
          currentAmount={budgets.find((b) => b.category === selectedBudgetCategory)?.amount}
          onClose={() => setSelectedBudgetCategory(null)}
          onSave={handleBudgetSave}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, paddingBottom: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  toolRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginBottom: spacing.md,
    zIndex: 100, elevation: 100,
  },
  refreshingText: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: spacing.xs },
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: appLayout.pageBottom + spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xs, marginTop: spacing.md,
  },
  dateHeaderText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  dateHeaderTotal: { fontSize: fontSize.xs, color: colors.danger },
  txCard: { padding: 0, gap: 0, overflow: 'hidden', marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: `${colors.border}55`, marginHorizontal: spacing.md },
});
