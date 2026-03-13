import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { useAppTheme, fontSize, fontWeight, spacing } from '../../../lib/theme';
import { formatKES } from '../../../lib/currency';
import { useTasks } from '../../tasks/tasks.hooks';
import { useTransactions } from '../../finance/finance.hooks';
import { useEvents } from '../../calendar/calendar.hooks';

export function WeekReviewScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: tasks = [] } = useTasks();
  const { data: transactions = [] } = useTransactions('week');
  const { data: events = [] } = useEvents();

  const review = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'done').length;
    const open = tasks.filter((task) => task.status !== 'done').length;
    const spend = transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const income = transactions.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const upcoming = events.filter((event) => new Date(event.start_time) >= new Date()).length;
    return { completed, open, spend, income, upcoming };
  }, [events, tasks, transactions]);

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Review"
          title="Week in Review"
          subtitle="One glance at the week’s execution, money flow, and calendar load."
          leading={<IconPillButton onPress={() => router.back()} icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />} />}
        />

        <GlassCard style={styles.hero} tone="accent" padding="lg">
          <Text style={styles.heroTitle}>Momentum check</Text>
          <Text style={styles.heroBody}>
            {review.completed} task{review.completed === 1 ? '' : 's'} completed, {review.upcoming} upcoming event{review.upcoming === 1 ? '' : 's'}, and a weekly net of {formatKES(review.income - review.spend, { decimals: 0 })}.
          </Text>
        </GlassCard>

        <View style={styles.grid}>
          <GlassCard style={styles.card} padding="md">
            <Text style={styles.value}>{review.completed}</Text>
            <Text style={styles.label}>Completed</Text>
          </GlassCard>
          <GlassCard style={styles.card} padding="md">
            <Text style={styles.value}>{review.open}</Text>
            <Text style={styles.label}>Open Tasks</Text>
          </GlassCard>
          <GlassCard style={styles.card} padding="md">
            <Text style={styles.value}>{formatKES(review.spend, { decimals: 0 })}</Text>
            <Text style={styles.label}>Weekly Spend</Text>
          </GlassCard>
          <GlassCard style={styles.card} padding="md">
            <Text style={styles.value}>{formatKES(review.income, { decimals: 0 })}</Text>
            <Text style={styles.label}>Weekly Income</Text>
          </GlassCard>
        </View>
      </PageShell>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { gap: spacing.sm },
  heroTitle: { color: colors.textPrimary, fontSize: fontSize.xl + 2, fontWeight: fontWeight.bold, lineHeight: 30 },
  heroBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '47.5%', minHeight: 112, justifyContent: 'center', gap: spacing.xs },
  value: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  label: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: 'uppercase' },
});
