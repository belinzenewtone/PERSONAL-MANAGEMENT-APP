import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAiInsights } from '../insights.hooks';
import { useLearningSessions, useDeleteSession, useToggleSession } from '../../learning/learning.hooks';
import { useTasks } from '../../tasks/tasks.hooks';
import { useTransactions } from '../../finance/finance.hooks';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageShell } from '../../../components/ui/PageShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { toast } from '../../../components/ui/Toast';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InsightCardSkeleton } from '../../../components/ui/Skeleton';
import { appLayout, spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { safeFormatDate } from '../../../lib/date-utils';
import { AddSessionModal, SessionItem } from './LearningSessionComponents';
import { AiCard, LearningHoursChart, MonthlySpendChart, TaskCompletionChart } from './InsightsCharts';
import { INSIGHT_TABS } from './insights-screen.shared';

export function InsightsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [showAddSession, setShowAddSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'analytics' | 'learning'>('ai');

  const { data: aiData, isLoading: aiLoading, refetch: refetchAi, error: aiError } = useAiInsights({ enabled: false });
  const { data: sessions = [] } = useLearningSessions(30);
  const { data: tasks = [] } = useTasks();
  const { data: transactions = [] } = useTransactions('all');
  const toggleSession = useToggleSession();
  const deleteSession = useDeleteSession();

  const totalHours = useMemo(
    () => Math.round((sessions.reduce((sum, session) => sum + Number(session.duration_minutes), 0) / 60) * 10) / 10,
    [sessions],
  );
  const completedSessions = sessions.filter((session) => session.completed).length;

  function handleDeleteSession(id: string) {
    Alert.alert('Delete Session', 'Remove this learning session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSession.mutate(id, {
        onSuccess: () => toast.success('Session deleted'),
        onError:   () => toast.error('Could not delete session'),
      }) },
    ]);
  }

  async function handleRefreshAi() {
    try {
      await refetchAi();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh AI insights.');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageShell scroll={false} contentContainerStyle={styles.shell} accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="AI & Learning"
          title="Insights"
          subtitle="AI guidance, analytics, and learning momentum in one tool hub."
          leading={
            <IconPillButton
              onPress={() => router.back()}
              icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />}
            />
          }
          action={activeTab === 'learning' ? (
            <IconPillButton
              onPress={() => setShowAddSession(true)}
              icon={<Ionicons name="add" size={18} color={colors.accentLight} />}
              label="Log"
            />
          ) : activeTab === 'ai' ? (
            <IconPillButton
              onPress={handleRefreshAi}
              icon={<Ionicons name="refresh" size={18} color={colors.accentLight} />}
              label="Sync"
            />
          ) : undefined}
        />

        <SegmentedControl
          options={INSIGHT_TABS.map((tab) => ({ label: tab.label, value: tab.key }))}
          value={activeTab}
          onChange={setActiveTab}
          style={styles.tabs}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'ai' && (
          <>
            {aiLoading ? (
              <View style={styles.analyticsSection}>
                <InsightCardSkeleton />
                <InsightCardSkeleton />
              </View>
            ) : aiError ? (
              <GlassCard style={styles.errorCard}>
                <Ionicons name="warning" size={48} color={colors.danger} />
                <Text style={styles.errorTitle}>Insights unavailable</Text>
                <Text style={styles.errorBody}>
                  {(aiError as Error).message?.includes('OPENAI_API_KEY')
                    ? 'Set your OPENAI_API_KEY secret in Supabase Dashboard.'
                    : (aiError as Error).message ?? 'Could not load AI insights.'}
                </Text>
                <Button label="Retry" onPress={handleRefreshAi} variant="secondary" style={styles.retryButton} />
              </GlassCard>
            ) : aiData ? (
              <>
                <GlassCard style={styles.dataSummary} tone="accent" padding="md">
                  {[
                    { label: 'Spending', val: aiData.data_summary.transactions_analysed },
                    { label: 'Tasks', val: aiData.data_summary.tasks_analysed },
                    { label: 'Learning', val: aiData.data_summary.sessions_analysed },
                  ].map(({ label, val }) => (
                    <View key={label} style={styles.dataSummaryStat}>
                      <Text style={styles.dataSummaryVal}>{val}</Text>
                      <Text style={styles.dataSummaryLabel}>{label}</Text>
                    </View>
                  ))}
                </GlassCard>
                  <Text style={styles.generatedAt}>Generated {safeFormatDate(aiData.generated_at, 'MMM d · h:mm a')}</Text>
                {aiData.insights.map((card) => <AiCard key={card.id} card={card} />)}
              </>
            ) : (
              <EmptyState
                icon="sparkles-outline"
                title="No insights yet"
                subtitle="Add transactions and tasks to generate AI analysis."
                actionLabel="Generate Insights"
                onAction={handleRefreshAi}
              />
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.analyticsSection}>
            <TaskCompletionChart tasks={tasks} />
            <MonthlySpendChart transactions={transactions} />
            <LearningHoursChart sessions={sessions} />
            {tasks.length === 0 && transactions.length === 0 && (
              <EmptyState
                icon="bar-chart-outline"
                title="No data yet"
                subtitle="Charts will appear as you add tasks and transactions."
              />
            )}
          </View>
        )}

        {activeTab === 'learning' && (
          <>
            <View style={styles.learningStats}>
              <GlassCard style={styles.learningStat} padding="md">
                <Text style={styles.learningStatVal}>{totalHours}h</Text>
                <Text style={styles.learningStatLabel}>Total (30d)</Text>
              </GlassCard>
              <GlassCard style={styles.learningStat} padding="md">
                <Text style={[styles.learningStatVal, styles.completedStat]}>{completedSessions}</Text>
                <Text style={styles.learningStatLabel}>Completed</Text>
              </GlassCard>
              <GlassCard style={styles.learningStat} padding="md">
                <Text style={[styles.learningStatVal, styles.totalStat]}>{sessions.length}</Text>
                <Text style={styles.learningStatLabel}>Total</Text>
              </GlassCard>
            </View>

            <LearningHoursChart sessions={sessions} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
            </View>

            {sessions.length === 0 ? (
              <EmptyState
                icon="book-outline"
                title="No sessions yet"
                subtitle='Tap "Log" to record a study session.'
              />
            ) : (
              <GlassCard style={styles.sessionList}>
                {sessions.slice(0, 15).map((session, index, subset) => (
                  <View key={session.id}>
                    <SessionItem
                      session={session}
                      onToggle={() => toggleSession.mutate(
                        { id: session.id, completed: !session.completed },
                        {
                          onSuccess: () => toast.info(session.completed ? 'Session marked incomplete' : 'Session completed'),
                          onError:   () => toast.error('Could not update session'),
                        },
                      )}
                      onDelete={() => handleDeleteSession(session.id)}
                    />
                    {index < subset.length - 1 && <View style={styles.divider} />}
                  </View>
                ))}
              </GlassCard>
            )}
          </>
        )}
        </ScrollView>
      </PageShell>

      <AddSessionModal visible={showAddSession} onClose={() => setShowAddSession(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  shell: { flex: 1, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },
  tabs: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: appLayout.pageBottom, gap: spacing.md, flexGrow: 1 },
  dataSummary: { flexDirection: 'row', paddingVertical: spacing.md, marginBottom: 0 },
  dataSummaryStat: { flex: 1, alignItems: 'center' },
  dataSummaryVal: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.accentLight },
  dataSummaryLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase' },
  generatedAt: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginBottom: -4 },
  analyticsSection: { gap: spacing.md },
  learningStats: { flexDirection: 'row', gap: spacing.sm },
  learningStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  learningStatVal: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  learningStatLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase' },
  completedStat: { color: colors.success },
  totalStat: { color: colors.accent },
  sectionHeader: { marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  sessionList: { padding: 0, gap: 0, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  loadingText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary, marginTop: spacing.sm },
  loadingSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  emptyText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  errorCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  errorTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  errorBody: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryButton: { marginTop: spacing.sm },
  generateButton: { marginTop: spacing.lg },
});
