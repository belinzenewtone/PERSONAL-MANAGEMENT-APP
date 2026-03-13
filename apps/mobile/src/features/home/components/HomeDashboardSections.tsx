import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { HomeSkeletonList } from '../../../components/ui/Skeleton';
import { SectionErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { useAppTheme, spacing, textStyles, appLayout, categoryColors, priorityColors, radius } from '../../../lib/theme';
import { CategoryIcon } from '../../../lib/category-icons';
import { formatKES } from '../../../lib/currency';
import { QUICK_ACTIONS } from './home-screen.shared';
import type { InsightCard } from '../../insights/insights.service';
import type { Task, Transaction } from '@personal-os/types';

// Shared currency formatter — imported here, never passed as a prop
const fmt = (v: number) => formatKES(v, { decimals: 0 });

// ─── Snapshot Strip ──────────────────────────────────────────────────────────

export function HomeSnapshotStrip({ todaySpend, weekSpend }: {
  todaySpend: number; weekSpend: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={s.snapshotRow}>
      <GlassCard style={s.snapshotCard} tone="accent" padding="md">
        <Text style={[s.snapshotLabel, { color: colors.textSecondary }]}>Today's spend</Text>
        <Text style={[s.snapshotValue, { color: colors.textPrimary }]}>{fmt(todaySpend)}</Text>
      </GlassCard>
      <GlassCard style={s.snapshotCard} tone="accent" accentColor={colors.teal} padding="md">
        <Text style={[s.snapshotLabel, { color: colors.textSecondary }]}>This week</Text>
        <Text style={[s.snapshotValue, { color: colors.textPrimary }]}>{fmt(weekSpend)}</Text>
      </GlassCard>
    </View>
  );
}

// ─── AI Insight ──────────────────────────────────────────────────────────────

export function HomeInsightCard({ insight, onOpenInsights }: {
  insight: InsightCard | null; onOpenInsights: () => void;
}) {
  const { colors } = useAppTheme();
  if (!insight) return null;
  return (
    <GlassCard tone="accent" padding="md" style={s.insightCard}>
      <View style={s.insightHeader}>
        <View style={s.insightPill}>
          <Ionicons name="sparkles" size={11} color={colors.accentLight} />
          <Text style={[s.insightPillText, { color: colors.accentLight }]}>AI Insight</Text>
        </View>
        <TouchableOpacity onPress={onOpenInsights} hitSlop={8}>
          <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={[s.insightTitle, { color: colors.textPrimary }]}>{insight.title}</Text>
      <Text style={[s.insightBody, { color: colors.textSecondary }]}>{insight.body}</Text>
    </GlassCard>
  );
}

// ─── Tasks Card ──────────────────────────────────────────────────────────────

export function HomeTasksCard({ isLoading, totalCount, completedCount, progress, todayTasks, onSeeAll }: {
  isLoading: boolean; totalCount: number; completedCount: number;
  progress: number; todayTasks: Task[]; onSeeAll: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <GlassCard padding="md" style={s.card}>
      {/* Progress bar */}
      <View style={s.progressRow}>
        <View style={[s.progressBar, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { width: `${progress * 100}%` as any, backgroundColor: colors.accent }]} />
        </View>
        <Text style={[s.progressText, { color: colors.textSecondary }]}>{completedCount}/{totalCount}</Text>
      </View>

      {isLoading ? (
        <SectionErrorBoundary><HomeSkeletonList count={3} /></SectionErrorBoundary>
      ) : totalCount === 0 ? (
        <EmptyBlock icon="checkmark-circle-outline" message="Nothing due today — you're clear." cta="Add a task" onCta={onSeeAll} />
      ) : (
        <View style={s.taskList}>
          {todayTasks.slice(0, 4).map((task) => (
            <HomeTaskRow key={task.id} task={task} />
          ))}
          {totalCount > 4 && (
            <TouchableOpacity onPress={onSeeAll} style={s.showMore}>
              <Text style={[s.showMoreText, { color: colors.accentLight }]}>+{totalCount - 4} more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </GlassCard>
  );
}

function HomeTaskRow({ task }: { task: Task }) {
  const { colors } = useAppTheme();
  const catColor = categoryColors[task.category as keyof typeof categoryColors] ?? colors.accent;
  const isDone = task.status === 'done';
  return (
    <View style={[s.taskRow, { borderLeftColor: isDone ? colors.border : catColor }]}>
      <View style={s.taskContent}>
        <Text style={[s.taskTitle, { color: isDone ? colors.textMuted : colors.textPrimary }, isDone && s.taskDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.deadline && (
          <Text style={[s.taskMeta, { color: colors.textMuted }]}>
            {format(new Date(task.deadline), 'h:mm a')}
          </Text>
        )}
      </View>
      <View style={[s.priorityDot, { backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] ?? colors.muted }]} />
    </View>
  );
}

// ─── Upcoming Deadlines ──────────────────────────────────────────────────────

export function HomeDeadlines({ tasks, onOpenTasks }: { tasks: Task[]; onOpenTasks: () => void }) {
  const { colors } = useAppTheme();

  // Empty state — positive signal, not just silence
  if (tasks.length === 0) {
    return (
      <GlassCard padding="md" style={s.deadlineEmpty}>
        <View style={s.clearIconWrap}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        </View>
        <View style={s.clearTextWrap}>
          <Text style={[s.clearTitle, { color: colors.textPrimary }]}>All clear</Text>
          <Text style={[s.clearBody, { color: colors.textSecondary }]}>No deadlines coming up. Keep the momentum going.</Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <View style={s.deadlineList}>
      {tasks.slice(0, 3).map((task) => (
        <TouchableOpacity key={task.id} onPress={onOpenTasks} activeOpacity={0.8}>
          <GlassCard padding="md" style={[s.deadlineCard, { borderLeftColor: colors.danger, borderLeftWidth: 3 }]}>
            <View style={s.deadlineInner}>
              <Text style={[s.deadlineTitle, { color: colors.textPrimary }]} numberOfLines={1}>{task.title}</Text>
              <Text style={[s.deadlineDate, { color: colors.danger }]}>
                {format(new Date(task.deadline!), 'EEE, MMM d')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Balance Card ────────────────────────────────────────────────────────────

export function HomeBalanceCard({ balance, income, expense, savingsRate }: {
  balance: number; income: number; expense: number; savingsRate: number;
}) {
  const { colors } = useAppTheme();
  return (
    <GlassCard padding="md" style={s.card}>
      <View style={s.balanceTop}>
        <Text style={[s.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
        <View style={[s.savingsPill, { backgroundColor: colors.surfaceAccentStrong }]}>
          <Text style={[s.savingsText, { color: colors.accentLight }]}>Savings {savingsRate}%</Text>
        </View>
      </View>
      <Text style={[s.balanceAmount, { color: balance < 0 ? colors.danger : colors.textPrimary }]}>
        {fmt(balance)}
      </Text>
      <View style={[s.balanceDivider, { borderTopColor: colors.border }]}>
        <View style={s.balanceItem}>
          <Text style={[s.balanceItemLabel, { color: colors.textMuted }]}>Income</Text>
          <Text style={[s.balanceItemValue, { color: colors.success }]}>+{fmt(income)}</Text>
        </View>
        <View style={[s.balanceSep, { backgroundColor: colors.border }]} />
        <View style={s.balanceItem}>
          <Text style={[s.balanceItemLabel, { color: colors.textMuted }]}>Expenses</Text>
          <Text style={[s.balanceItemValue, { color: colors.danger }]}>-{fmt(expense)}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Recent Transactions ─────────────────────────────────────────────────────

export function HomeRecentTransactions({ transactions, onAddTransaction }: {
  transactions: Pick<Transaction, 'amount' | 'type' | 'transaction_date' | 'category' | 'description' | 'source'>[];
  onAddTransaction: () => void;
}) {
  const { colors } = useAppTheme();
  if (transactions.length === 0) {
    return (
      <GlassCard padding="md">
        <EmptyBlock icon="wallet-outline" message="No transactions recorded yet." cta="Add transaction" onCta={onAddTransaction} />
      </GlassCard>
    );
  }
  return (
    <GlassCard padding="md" style={s.card}>
      <View style={s.txList}>
        {transactions.slice(0, 4).map((tx, i) => (
          <TxRow key={`${tx.transaction_date}-${i}`} tx={tx} />
        ))}
      </View>
    </GlassCard>
  );
}

function TxRow({ tx }: {
  tx: Pick<Transaction, 'amount' | 'type' | 'transaction_date' | 'category' | 'description' | 'source'>;
}) {
  const { colors } = useAppTheme();
  const isIncome = tx.type === 'income';
  return (
    <View style={s.txRow}>
      <View style={[s.txIcon, { backgroundColor: isIncome ? colors.successSoft : `${colors.danger}1a` }]}>
        <CategoryIcon category={tx.category} size={15} color={isIncome ? colors.success : colors.danger} />
      </View>
      <View style={s.txBody}>
        <Text style={[s.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {tx.description || tx.category}
        </Text>
        <Text style={[s.txMeta, { color: colors.textMuted }]}>
          {tx.category} · {format(new Date(tx.transaction_date), 'MMM d')}
        </Text>
      </View>
      <Text style={[s.txAmount, { color: isIncome ? colors.success : colors.danger }]}>
        {isIncome ? '+' : '-'}{fmt(Number(tx.amount))}
      </Text>
    </View>
  );
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

export function HomeQuickActions({ onNavigate }: { onNavigate: (route: string) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={s.qaGrid}>
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={[s.qaItem, { borderColor: `${action.color}33`, backgroundColor: colors.surfaceElevated }]}
          onPress={() => onNavigate(action.route)}
          activeOpacity={0.75}
        >
          <View style={[s.qaIcon, { backgroundColor: `${action.color}1a` }]}>
            <Ionicons name={action.icon as any} size={20} color={action.color} />
          </View>
          <Text style={[s.qaLabel, { color: colors.textSecondary }]}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Shared empty block ──────────────────────────────────────────────────────

function EmptyBlock({ icon, message, cta, onCta }: {
  icon: string; message: string; cta?: string; onCta?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={s.emptyBlock}>
      <Ionicons name={icon as any} size={28} color={colors.textMuted} />
      <Text style={[s.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
      {cta && onCta && (
        <TouchableOpacity onPress={onCta} style={[s.emptyCta, { borderColor: `${colors.accent}55` }]}>
          <Text style={[s.emptyCtaText, { color: colors.accentLight }]}>{cta}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: { marginBottom: 0 },

  // Snapshot
  snapshotRow: { flexDirection: 'row', gap: spacing.sm },
  snapshotCard: { flex: 1, minHeight: 96, justifyContent: 'space-between' },
  snapshotLabel: { ...textStyles.metaText },
  snapshotValue: { fontSize: 20, fontWeight: '700', lineHeight: 26 },

  // Insight
  insightCard: { gap: 6 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightPillText: { ...textStyles.eyebrow },
  insightTitle: { ...textStyles.cardTitle },
  insightBody: { ...textStyles.bodySm },

  // Tasks
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  progressBar: { flex: 1, height: 5, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressText: { ...textStyles.metaText, width: 40, textAlign: 'right' },
  taskList: { gap: 10 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingLeft: 10, borderLeftWidth: 3, borderRadius: 2,
  },
  taskContent: { flex: 1 },
  taskTitle: { ...textStyles.bodySm, fontWeight: '500' },
  taskDone: { textDecorationLine: 'line-through' },
  taskMeta: { ...textStyles.metaText, marginTop: 1 },
  priorityDot: { width: 7, height: 7, borderRadius: 99 },
  showMore: { paddingTop: spacing.xs },
  showMoreText: { ...textStyles.bodySm },

  // Deadlines
  deadlineList: { gap: spacing.sm },
  deadlineCard: { flexDirection: 'row', alignItems: 'center' },
  deadlineInner: { flex: 1 },
  deadlineTitle: { ...textStyles.bodySm, fontWeight: '500' },
  deadlineDate: { ...textStyles.metaText, marginTop: 2 },
  deadlineEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clearIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  clearTextWrap: { flex: 1 },
  clearTitle: { ...textStyles.bodySm, fontWeight: '600', marginBottom: 2 },
  clearBody: { ...textStyles.metaText },

  // Balance
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  balanceLabel: { ...textStyles.bodySm },
  savingsPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  savingsText: { ...textStyles.eyebrow },
  balanceAmount: { fontSize: 28, fontWeight: '700', lineHeight: 34, marginBottom: spacing.md },
  balanceDivider: { flexDirection: 'row', paddingTop: spacing.md, borderTopWidth: 1 },
  balanceItem: { flex: 1 },
  balanceSep: { width: 1, marginHorizontal: spacing.sm },
  balanceItemLabel: { ...textStyles.metaText, marginBottom: 2 },
  balanceItemValue: { ...textStyles.bodySm, fontWeight: '600' },

  // Transactions
  txList: { gap: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  txIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  txBody: { flex: 1 },
  txTitle: { ...textStyles.bodySm, fontWeight: '500' },
  txMeta: { ...textStyles.metaText, marginTop: 1 },
  txAmount: { ...textStyles.bodySm, fontWeight: '600' },

  // Quick actions
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  qaItem: {
    flexBasis: '31%', flexGrow: 1, borderRadius: radius.xl, borderWidth: 1,
    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
    minHeight: 104, justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  qaIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { ...textStyles.metaText, fontWeight: '500', textAlign: 'center' },

  // Empty
  emptyBlock: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  emptyMessage: { ...textStyles.bodySm, textAlign: 'center' },
  emptyCta: { paddingHorizontal: spacing.md, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  emptyCtaText: { ...textStyles.bodySm, fontWeight: '500' },
});
