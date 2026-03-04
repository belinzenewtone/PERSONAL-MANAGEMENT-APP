import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { useAuthStore } from '../../src/store/auth.store';
import { useTodayTasks } from '../../src/features/tasks/tasks.hooks';
import { authService } from '../../src/features/auth/auth.service';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { Task } from '@personal-os/types';

const PRIORITY_COLOR: Record<string, string> = {
  low: colors.low,
  medium: colors.medium,
  high: colors.high,
};

const CATEGORY_COLOR: Record<string, string> = {
  work: colors.work,
  growth: colors.growth,
  personal: colors.personal,
};

function TaskPreviewItem({ task }: { task: Task }) {
  return (
    <View style={styles.taskItem}>
      <View style={[styles.taskDot, { backgroundColor: CATEGORY_COLOR[task.category] }]} />
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, task.status === 'done' && styles.taskDone]} numberOfLines={1}>
          {task.title}
        </Text>
        {task.deadline && (
          <Text style={styles.taskDeadline}>
            {format(new Date(task.deadline), 'h:mm a')}
          </Text>
        )}
      </View>
      <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[task.priority] + '22' }]}>
        <Text style={[styles.priorityText, { color: PRIORITY_COLOR[task.priority] }]}>
          {task.priority}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: todayTasks, isLoading } = useTodayTasks();

  const today = new Date();
  const completedCount = todayTasks?.filter((t) => t.status === 'done').length ?? 0;
  const totalCount = todayTasks?.length ?? 0;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const greeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}, {firstName} 👋</Text>
            <Text style={styles.date}>{format(today, 'EEEE, MMMM d')}</Text>
          </View>
          <TouchableOpacity
            onPress={async () => { await authService.signOut(); router.replace('/(auth)/login'); }}
            style={styles.signOutBtn}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Tasks Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{totalCount} done</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />
          ) : totalCount === 0 ? (
            <Text style={styles.emptyText}>No tasks due today 🎉</Text>
          ) : (
            <View style={styles.taskList}>
              {todayTasks?.slice(0, 5).map((task) => (
                <TaskPreviewItem key={task.id} task={task} />
              ))}
            </View>
          )}
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Add Task', icon: '✅', route: '/(tabs)/tasks', color: colors.work },
            { label: 'Finance', icon: '💰', route: '/(tabs)/finance', color: colors.success },
            { label: 'Calendar', icon: '📅', route: '/(tabs)/calendar', color: colors.growth },
            { label: 'Insights', icon: '📊', route: '/(tabs)/insights', color: colors.warning },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.quickAction, { borderColor: action.color + '44' }]}
              onPress={() => router.push(action.route as any)}
            >
              <Text style={styles.quickActionIcon}>{action.icon}</Text>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards Row */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalCount}</Text>
            <Text style={styles.summaryLabel}>Tasks Today</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {totalCount > 0 ? Math.round(progress * 100) : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  signOutBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  signOutText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  card: { marginBottom: spacing.lg },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  seeAll: { fontSize: fontSize.sm, color: colors.accentLight },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  progressText: { fontSize: fontSize.xs, color: colors.textSecondary, width: 56 },

  taskList: { gap: spacing.sm },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  taskContent: { flex: 1 },
  taskTitle: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  taskDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskDeadline: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  priorityText: { fontSize: 10, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },

  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.md },

  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  quickActionIcon: { fontSize: 22 },
  quickActionLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: fontWeight.medium, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  summaryValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
