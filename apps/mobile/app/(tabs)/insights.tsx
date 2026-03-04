import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { BarChart } from 'react-native-chart-kit';
import { useAiInsights } from '../../src/features/insights/insights.hooks';
import { InsightCard } from '../../src/features/insights/insights.service';
import { useLearningSessions, useCreateSession, useToggleSession, useDeleteSession } from '../../src/features/learning/learning.hooks';
import { learningService } from '../../src/features/learning/learning.service';
import { useTasks } from '../../src/features/tasks/tasks.hooks';
import { useTransactions } from '../../src/features/finance/finance.hooks';
import { TextInput } from '../../src/components/ui/TextInput';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { LearningSession } from '@personal-os/types';

const { width: W } = Dimensions.get('window');
const CHART_W = W - spacing.md * 2 - spacing.md * 2 - 2;

// ─── Schema ───────────────────────────────────────────────────────────────────

const sessionSchema = z.object({
  topic:            z.string().min(1, 'Topic required'),
  duration_minutes: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter minutes'),
  completed:        z.boolean(),
});
type SessionInput = z.infer<typeof sessionSchema>;

// ─── Priority colours ─────────────────────────────────────────────────────────

const PRIORITY_COLOR = { high: colors.danger, medium: colors.warning, low: colors.success };
const TYPE_BG: Record<InsightCard['type'], string> = {
  spending:     colors.danger   + '22',
  productivity: colors.accent   + '22',
  learning:     colors.growth   + '22',
  forecast:     colors.info     + '22',
  tip:          colors.success  + '22',
};
const TYPE_ICON: Record<InsightCard['type'], string> = {
  spending: '💸', productivity: '✅', learning: '📚', forecast: '🔮', tip: '💡',
};

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function AiCard({ card }: { card: InsightCard }) {
  const [expanded, setExpanded] = useState(false);
  const priColor = PRIORITY_COLOR[card.priority];

  return (
    <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.85}>
      <View style={[styles.aiCard, { backgroundColor: TYPE_BG[card.type], borderLeftColor: priColor }]}>
        <View style={styles.aiCardHeader}>
          <Text style={styles.aiCardIcon}>{card.icon ?? TYPE_ICON[card.type]}</Text>
          <View style={styles.aiCardMeta}>
            <Text style={styles.aiCardTitle}>{card.title}</Text>
            <View style={[styles.priorityPill, { backgroundColor: priColor + '33' }]}>
              <Text style={[styles.priorityPillText, { color: priColor }]}>{card.priority}</Text>
            </View>
          </View>
          <Text style={styles.expandChevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
        {expanded && <Text style={styles.aiCardBody}>{card.body}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── Task Completion Chart ────────────────────────────────────────────────────

function TaskCompletionChart({ tasks }: { tasks: any[] }) {
  const stats = useMemo(() => {
    const cats = ['work', 'growth', 'personal'] as const;
    return cats.map((c) => {
      const sub   = tasks.filter((t) => t.category === c);
      const done  = sub.filter((t) => t.status === 'done').length;
      return { label: c[0].toUpperCase() + c.slice(1), rate: sub.length > 0 ? Math.round((done / sub.length) * 100) : 0 };
    });
  }, [tasks]);

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Task Completion Rate</Text>
      {stats.map(({ label, rate }) => (
        <View key={label} style={styles.completionRow}>
          <Text style={styles.completionLabel}>{label}</Text>
          <View style={styles.completionBar}>
            <View style={[styles.completionFill, {
              width: `${rate}%` as any,
              backgroundColor: label === 'Work' ? colors.work : label === 'Growth' ? colors.growth : colors.personal,
            }]} />
          </View>
          <Text style={styles.completionPct}>{rate}%</Text>
        </View>
      ))}
    </Card>
  );
}

// ─── Monthly Spend Comparison ─────────────────────────────────────────────────

function MonthlySpendChart({ transactions }: { transactions: any[] }) {
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 4 }, (_, i) => subMonths(new Date(), 3 - i));
    return months.map((m) => {
      const start = startOfMonth(m).toISOString();
      const end   = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const total = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date >= start && t.transaction_date <= end)
        .reduce((s: number, t: any) => s + Number(t.amount), 0);
      return { label: format(m, 'MMM'), total };
    });
  }, [transactions]);

  const hasData = monthlyData.some((m) => m.total > 0);
  if (!hasData) return null;

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Monthly Spending (4 months)</Text>
      <BarChart
        data={{
          labels:   monthlyData.map((m) => m.label),
          datasets: [{ data: monthlyData.map((m) => m.total) }],
        }}
        width={CHART_W}
        height={160}
        yAxisLabel="KES "
        yAxisSuffix=""
        chartConfig={{
          backgroundColor:         colors.surface,
          backgroundGradientFrom:  colors.surface,
          backgroundGradientTo:    colors.surface,
          decimalPlaces:           0,
          color: (opacity = 1)  => `rgba(99,102,241,${opacity})`,
          labelColor:              () => colors.textMuted,
          propsForBackgroundLines: { stroke: colors.border + '55' },
        }}
        style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
        showValuesOnTopOfBars
        withInnerLines={false}
      />
    </Card>
  );
}

// ─── Learning Hours Chart ─────────────────────────────────────────────────────

function LearningHoursChart({ sessions }: { sessions: LearningSession[] }) {
  const weekData = useMemo(() => learningService.getWeeklyHours(sessions), [sessions]);
  const hasData  = weekData.some((d) => d.hours > 0);

  if (!hasData) return null;

  return (
    <Card style={styles.chartCard}>
      <Text style={styles.chartTitle}>Weekly Learning Hours</Text>
      <BarChart
        data={{
          labels:   weekData.map((d) => d.day),
          datasets: [{ data: weekData.map((d) => d.hours) }],
        }}
        width={CHART_W}
        height={140}
        yAxisLabel=""
        yAxisSuffix="h"
        chartConfig={{
          backgroundColor:         colors.surface,
          backgroundGradientFrom:  colors.surface,
          backgroundGradientTo:    colors.surface,
          decimalPlaces:           1,
          color: (opacity = 1)  => `rgba(168,85,247,${opacity})`,
          labelColor:              () => colors.textMuted,
          propsForBackgroundLines: { stroke: colors.border + '55' },
        }}
        style={{ borderRadius: radius.md, marginLeft: -spacing.sm }}
        withInnerLines={false}
      />
    </Card>
  );
}

// ─── Add Session Modal ────────────────────────────────────────────────────────

function AddSessionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const create = useCreateSession();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<SessionInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { topic: '', duration_minutes: '', completed: false },
  });

  const onSubmit = async (data: SessionInput) => {
    await create.mutateAsync({
      topic:            data.topic,
      duration_minutes: Number(data.duration_minutes),
      completed:        data.completed,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Log Learning Session</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <Controller control={control} name="topic"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Topic *" placeholder="e.g. Python, SQL, Data Engineering"
                value={value} onChangeText={onChange} onBlur={onBlur} error={errors.topic?.message} />
            )} />
          <Controller control={control} name="duration_minutes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Duration (minutes) *" placeholder="e.g. 60"
                keyboardType="numeric" value={value} onChangeText={onChange}
                onBlur={onBlur} error={errors.duration_minutes?.message} />
            )} />
          <Button label="Log Session" onPress={handleSubmit(onSubmit)}
            loading={create.isPending} fullWidth size="lg" style={{ marginTop: spacing.sm }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Learning Session Item ────────────────────────────────────────────────────

function SessionItem({ session, onToggle, onDelete }: {
  session: LearningSession;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const hrs = Math.floor(session.duration_minutes / 60);
  const min = session.duration_minutes % 60;
  const dur = hrs > 0 ? `${hrs}h ${min}m` : `${min}m`;

  return (
    <TouchableOpacity onLongPress={onDelete} style={styles.sessionRow}>
      <TouchableOpacity onPress={onToggle}
        style={[styles.sessionCheck, session.completed && styles.sessionCheckDone]}>
        {session.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.sessionBody}>
        <Text style={[styles.sessionTopic, session.completed && styles.sessionDone]}>{session.topic}</Text>
        <Text style={styles.sessionMeta}>{dur}  ·  {format(parseISO(session.created_at), 'MMM d')}</Text>
      </View>
      <View style={[styles.sessionDurBadge, session.completed && { backgroundColor: colors.success + '22' }]}>
        <Text style={[styles.sessionDurText, session.completed && { color: colors.success }]}>{dur}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Insights Screen ─────────────────────────────────────────────────────

export default function InsightsScreen() {
  const [showAddSession, setShowAddSession] = useState(false);
  const [activeTab, setActiveTab]           = useState<'ai' | 'analytics' | 'learning'>('ai');

  const { data: aiData,    isLoading: aiLoading,    refetch: refetchAi, error: aiError } = useAiInsights();
  const { data: sessions = [] } = useLearningSessions(30);
  const { data: tasks    = [] } = useTasks();
  const { data: transactions = [] } = useTransactions('all');

  const toggleSession = useToggleSession();
  const deleteSession = useDeleteSession();

  const totalHours = useMemo(
    () => Math.round(sessions.reduce((s, l) => s + Number(l.duration_minutes), 0) / 60 * 10) / 10,
    [sessions]
  );
  const completedSessions = sessions.filter((s) => s.completed).length;

  const handleDeleteSession = (id: string) => {
    Alert.alert('Delete Session', 'Remove this learning session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession.mutate(id) },
    ]);
  };

  const TABS = [
    { key: 'ai',        label: '🤖 AI',        },
    { key: 'analytics', label: '📊 Analytics', },
    { key: 'learning',  label: '📚 Learning',  },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Insights</Text>
        {activeTab === 'learning' && (
          <TouchableOpacity onPress={() => setShowAddSession(true)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Log</Text>
          </TouchableOpacity>
        )}
        {activeTab === 'ai' && (
          <TouchableOpacity onPress={() => refetchAi()} style={styles.addBtn}>
            <Text style={styles.addBtnText}>↻ Refresh</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── AI TAB ── */}
        {activeTab === 'ai' && (
          <>
            {aiLoading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={styles.loadingText}>Generating AI insights…</Text>
                <Text style={styles.loadingSubtext}>Analysing your finance, tasks & learning data</Text>
              </View>
            ) : aiError ? (
              <Card style={styles.errorCard}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorTitle}>Insights unavailable</Text>
                <Text style={styles.errorBody}>
                  {(aiError as Error).message?.includes('OPENAI_API_KEY')
                    ? 'Set your OPENAI_API_KEY secret in Supabase Dashboard → Edge Functions → Secrets.'
                    : (aiError as Error).message ?? 'Could not load AI insights. Please try again.'}
                </Text>
                <Button label="Retry" onPress={() => refetchAi()} variant="secondary" style={{ marginTop: spacing.sm }} />
              </Card>
            ) : aiData ? (
              <>
                {/* Summary bar */}
                <Card style={styles.dataSummary}>
                  {[
                    { label: 'Transactions', val: aiData.data_summary.transactions_analysed },
                    { label: 'Tasks',        val: aiData.data_summary.tasks_analysed },
                    { label: 'Sessions',     val: aiData.data_summary.sessions_analysed },
                  ].map(({ label, val }) => (
                    <View key={label} style={styles.dataSummaryStat}>
                      <Text style={styles.dataSummaryVal}>{val}</Text>
                      <Text style={styles.dataSummaryLabel}>{label}</Text>
                    </View>
                  ))}
                </Card>
                <Text style={styles.generatedAt}>
                  Generated {format(parseISO(aiData.generated_at), 'MMM d · h:mm a')}
                </Text>
                {aiData.insights.map((card) => (
                  <AiCard key={card.id} card={card} />
                ))}
              </>
            ) : (
              <View style={styles.centered}>
                <Text style={styles.emptyIcon}>🤖</Text>
                <Text style={styles.emptyText}>No insights yet</Text>
                <Text style={styles.emptySubtext}>Add transactions & tasks to generate AI analysis</Text>
                <Button label="Generate Insights" onPress={() => refetchAi()} style={{ marginTop: spacing.lg }} />
              </View>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <>
            <TaskCompletionChart tasks={tasks} />
            <MonthlySpendChart   transactions={transactions} />
            <LearningHoursChart  sessions={sessions} />
            {tasks.length === 0 && transactions.length === 0 && (
              <View style={styles.centered}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyText}>No data yet</Text>
                <Text style={styles.emptySubtext}>Charts will appear as you add tasks and transactions</Text>
              </View>
            )}
          </>
        )}

        {/* ── LEARNING TAB ── */}
        {activeTab === 'learning' && (
          <>
            {/* Stats row */}
            <View style={styles.learningStats}>
              <Card style={styles.learningStat}>
                <Text style={styles.learningStatVal}>{totalHours}h</Text>
                <Text style={styles.learningStatLabel}>Total (30d)</Text>
              </Card>
              <Card style={styles.learningStat}>
                <Text style={[styles.learningStatVal, { color: colors.success }]}>{completedSessions}</Text>
                <Text style={styles.learningStatLabel}>Completed</Text>
              </Card>
              <Card style={styles.learningStat}>
                <Text style={[styles.learningStatVal, { color: colors.accent }]}>{sessions.length}</Text>
                <Text style={styles.learningStatLabel}>Sessions</Text>
              </Card>
            </View>

            <LearningHoursChart sessions={sessions} />

            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>No sessions yet</Text>
                <Text style={styles.emptySubtext}>Tap "+ Log" to record a study session</Text>
              </View>
            ) : (
              <Card style={styles.sessionList}>
                {sessions.slice(0, 15).map((s, i) => (
                  <View key={s.id}>
                    <SessionItem
                      session={s}
                      onToggle={() => toggleSession.mutate({ id: s.id, completed: !s.completed })}
                      onDelete={() => handleDeleteSession(s.id)}
                    />
                    {i < sessions.slice(0, 15).length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </ScrollView>

      <AddSessionModal visible={showAddSession} onClose={() => setShowAddSession(false)} />
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
  addBtn:      { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  addBtnText:  { fontSize: fontSize.sm, color: colors.accentLight, fontWeight: fontWeight.medium },

  tabs: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: 3 },
  tab:         { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: radius.sm },
  tabActive:   { backgroundColor: colors.accent },
  tabText:     { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: '#fff' },

  scroll: { padding: spacing.md, paddingBottom: 100, gap: spacing.md },

  // AI Cards
  aiCard: { borderRadius: radius.lg, padding: spacing.md, borderLeftWidth: 4, marginBottom: 0 },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiCardIcon:   { fontSize: 28, width: 36 },
  aiCardMeta:   { flex: 1, gap: 3 },
  aiCardTitle:  { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  aiCardBody:   { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.sm },
  expandChevron:{ fontSize: fontSize.xs, color: colors.textMuted },
  priorityPill: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  priorityPillText: { fontSize: 10, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },

  dataSummary: { flexDirection: 'row', paddingVertical: spacing.sm },
  dataSummaryStat:  { flex: 1, alignItems: 'center' },
  dataSummaryVal:   { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.accent },
  dataSummaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  generatedAt:      { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },

  // Charts
  chartCard:  { gap: spacing.sm },
  chartTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  completionLabel: { width: 64, fontSize: fontSize.sm, color: colors.textSecondary },
  completionBar:   { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  completionFill:  { height: '100%', borderRadius: radius.full },
  completionPct:   { width: 36, fontSize: fontSize.xs, color: colors.textPrimary, textAlign: 'right', fontWeight: fontWeight.medium },

  // Learning
  learningStats:     { flexDirection: 'row', gap: spacing.sm },
  learningStat:      { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  learningStatVal:   { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  learningStatLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  sectionTitle:      { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  sessionList:       { padding: 0, gap: 0, overflow: 'hidden' },
  sessionRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  sessionCheck:      { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sessionCheckDone:  { backgroundColor: colors.growth, borderColor: colors.growth },
  checkmark:         { color: '#fff', fontSize: 13, fontWeight: fontWeight.bold },
  sessionBody:       { flex: 1 },
  sessionTopic:      { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  sessionDone:       { textDecorationLine: 'line-through', color: colors.textMuted },
  sessionMeta:       { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  sessionDurBadge:   { backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  sessionDurText:    { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  divider:           { height: 1, backgroundColor: colors.border + '66', marginHorizontal: spacing.md },

  // Error / empty
  centered:     { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  loadingText:  { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginTop: spacing.sm },
  loadingSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  emptyIcon:    { fontSize: 48 },
  emptyText:    { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  errorCard:    { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  errorIcon:    { fontSize: 36 },
  errorTitle:   { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  errorBody:    { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  // Modal
  modal:       { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose:  { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  modalScroll: { padding: spacing.lg, gap: spacing.md },
});
