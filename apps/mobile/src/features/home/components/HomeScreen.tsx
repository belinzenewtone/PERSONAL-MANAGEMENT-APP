import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '../../../store/auth.store';
import { usePreferencesStore } from '../../../store/preferences.store';
import { useTodayTasks, useUpcomingTasks } from '../../tasks/tasks.hooks';
import { useBalanceTransactions } from '../../finance/finance.hooks';
import { useAiInsights } from '../../insights/insights.hooks';
import { useProfile } from '../../profile/profile.hooks';
import { appLayout, spacing, textStyles, useAppTheme } from '../../../lib/theme';
import { PageShell } from '../../../components/ui/PageShell';
import {
  HomeBalanceCard,
  HomeDeadlines,
  HomeInsightCard,
  HomeQuickActions,
  HomeRecentTransactions,
  HomeSnapshotStrip,
  HomeTasksCard,
} from './HomeDashboardSections';

export function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const assistantEnabled = usePreferencesStore((s) => s.assistantSuggestionsEnabled);

  // Memoized greeting — only recalculates when the current hour changes,
  // not on every render. The hour is the only thing it depends on.
  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, [new Date().getHours()]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: todayTasks = [], isLoading: loadingTasks } = useTodayTasks();
  const { data: upcomingDeadlines = [] } = useUpcomingTasks();
  const { data: balanceTxns = [], isLoading: loadingFinance } = useBalanceTransactions('month');
  const { data: aiData } = useAiInsights({ enabled: assistantEnabled });

  const today = new Date();
  const fallback = user?.email?.split('@')[0] ?? 'there';
  const firstName = profile?.full_name?.trim()?.split(/\s+/)[0] ?? fallback;
  const initials = (profile?.full_name?.trim() || fallback)
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  const completedCount = todayTasks.filter((t) => t.status === 'done').length;
  const totalCount = todayTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const { income, expense, balance, savingsRate } = useMemo(() => {
    const inc = balanceTxns.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = balanceTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return { income: inc, expense: exp, balance: inc - exp, savingsRate: inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0 };
  }, [balanceTxns]);

  const { todaySpend, weekSpend } = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const todayKey = now.toISOString().slice(0, 10);
    return balanceTxns.reduce(
      (acc, t) => {
        if (t.type !== 'expense') return acc;
        const amt = Number(t.amount);
        if (t.transaction_date.slice(0, 10) === todayKey) acc.todaySpend += amt;
        if (new Date(t.transaction_date) >= weekStart) acc.weekSpend += amt;
        return acc;
      },
      { todaySpend: 0, weekSpend: 0 },
    );
  }, [balanceTxns]);

  const isLoading = loadingTasks || loadingFinance;

  return (
    <SafeAreaView style={styles.container}>
      <PageShell>
        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>{format(today, 'EEEE, MMMM d')}</Text>
            <Text style={styles.headerTitle}>{greetingText}, {firstName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Spend snapshot ───────────────────────────────────────── */}
        <HomeSnapshotStrip todaySpend={todaySpend} weekSpend={weekSpend} />

        {/* ── AI insight (only when present) ───────────────────────── */}
        <HomeInsightCard
          insight={aiData?.insights?.[0] ?? null}
          onOpenInsights={() => router.push('/insights')}
        />

        {/* ── Today's tasks ─────────────────────────────────────────── */}
        <SectionHeader title="Today's Tasks" onSeeAll={() => router.push('/(tabs)/tasks')} />
        <HomeTasksCard
          isLoading={isLoading}
          totalCount={totalCount}
          completedCount={completedCount}
          progress={progress}
          todayTasks={todayTasks}
          onSeeAll={() => router.push('/(tabs)/tasks')}
        />

        {/* ── Upcoming deadlines ───────────────────────────────────── */}
        <SectionHeader title="Upcoming Deadlines" onSeeAll={() => router.push('/(tabs)/tasks')} />
        <HomeDeadlines tasks={upcomingDeadlines} onOpenTasks={() => router.push('/(tabs)/tasks')} />

        {/* ── Balance ──────────────────────────────────────────────── */}
        <SectionHeader title="This Month" onSeeAll={() => router.push('/(tabs)/finance')} />
        <HomeBalanceCard
          balance={balance}
          income={income}
          expense={expense}
          savingsRate={savingsRate}
        />

        {/* ── Recent transactions ──────────────────────────────────── */}
        <SectionHeader title="Recent Activity" onSeeAll={() => router.push('/(tabs)/finance')} />
        <HomeRecentTransactions
          transactions={balanceTxns}
          onAddTransaction={() => router.push('/(tabs)/finance')}
        />

        {/* ── Quick actions ─────────────────────────────────────────── */}
        <SectionHeader title="Quick Actions" />
        <HomeQuickActions onNavigate={(route) => router.push(route as never)} />
      </PageShell>
    </SafeAreaView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={sh.row}>
      <Text style={[sh.title, { color: colors.textPrimary }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[sh.seeAll, { color: colors.accentLight }]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  title: { ...textStyles.sectionTitle },
  seeAll: { fontSize: 13, fontWeight: '500' },
});

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: appLayout.sectionGap,
    },
    headerLeft: { flex: 1, gap: 3 },
    headerEyebrow: { ...textStyles.eyebrow, color: colors.accentLight },
    headerTitle: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, lineHeight: 32 },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceAccentStrong,
      borderWidth: 1.5,
      borderColor: `${colors.accent}55`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    avatarText: { fontSize: 14, fontWeight: '700', color: colors.accentLight },
  });
