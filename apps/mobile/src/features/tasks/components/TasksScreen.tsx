import React, { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import {
  useCreateTask, useDeleteTask, useSetTaskPinned,
  useTasks, useUpdateTaskStatus,
} from '../tasks.hooks';
import { tasksService } from '../tasks.service';
import { SearchBar } from '../../../components/ui/SearchBar';
import { FilterToggle } from '../../../components/ui/FilterToggle';
import { TaskCardSkeleton } from '../../../components/ui/Skeleton';
import { toast } from '../../../components/ui/Toast';
import { appLayout, spacing, categoryColors, useAppTheme } from '../../../lib/theme';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { TABS } from './tasks-screen.shared';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import type { Task, TaskCategory, TaskStatus } from '@personal-os/types';
import { successTap } from '../../../lib/feedback';

export function TasksScreen() {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TaskCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);

  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const setPinned = useSetTaskPinned();

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesTab = activeTab === 'all' || task.category === activeTab;
      const q = deferredSearch.toLowerCase();
      const matchesSearch = !q || task.title.toLowerCase().includes(q) ||
        (task.description?.toLowerCase().includes(q) ?? false);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, deferredSearch, tasks]);

  const tabOptions = useMemo(() => TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    color: tab.value === 'all'
      ? colors.accent
      : categoryColors[tab.value as keyof typeof categoryColors] ?? colors.accent,
  })), [colors]);

  async function handleToggle(task: Task) {
    let next: TaskStatus = 'todo';
    if (task.status === 'todo') next = 'in_progress';
    else if (task.status === 'in_progress') next = 'done';
    try {
      await updateStatus.mutateAsync({ id: task.id, status: next });
      if (next === 'done') {
        successTap();
        if (task.recurring && task.frequency) {
          const nextDeadline = tasksService.getNextDeadline(
            task.deadline || new Date(),
            task.frequency as Parameters<typeof tasksService.getNextDeadline>[1],
          );
          await createTask.mutateAsync({
            title: task.title, description: task.description,
            category: task.category, priority: task.priority,
            deadline: nextDeadline, status: 'todo', recurring: true,
            frequency: task.frequency,
            recurring_parent_id: task.recurring_parent_id || task.id,
            estimated_minutes: task.estimated_minutes,
            ticket_reference: task.ticket_reference,
          });
          toast.success(`"${task.title}" done — next due ${format(new Date(nextDeadline), 'MMM d')}`);
        } else {
          toast.success(`"${task.title}" completed`);
        }
      } else if (next === 'in_progress') {
        toast.info(`"${task.title}" started`);
      } else {
        toast.info(`"${task.title}" moved back to to-do`);
      }
    } catch {
      toast.error('Could not update task');
    }
  }

  function handleDelete(task: Task) {
    deleteTask.mutate(task.id, {
      onSuccess: () => toast.success(`"${task.title}" deleted`),
      onError:   () => toast.error('Could not delete task'),
    });
  }

  function handlePin(task: Task) {
    setPinned.mutate(
      { id: task.id, isPinned: !task.is_pinned },
      {
        onSuccess: () => toast.info(task.is_pinned ? `"${task.title}" unpinned` : `"${task.title}" pinned`),
        onError:   () => toast.error('Could not update pin'),
      },
    );
  }

  const countLabel = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <PageShell scroll={false} contentContainerStyle={{ flex: 1, paddingBottom: 0 }}>
        <PageHeader
          eyebrow="Focus"
          title="Tasks"
          subtitle="Move your commitments forward."
          action={
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
              {countLabel}
            </Text>
          }
        />

        {/* Tool row lives OUTSIDE the list so its absolute dropdown is never clipped */}
        <View style={s.toolRowWrap}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks…"
          />
          <FilterToggle
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
          />
        </View>

        {isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {[0, 1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onToggle={() => handleToggle(item)}
                onEdit={() => setEditTask(item)}
                onDelete={() => handleDelete(item)}
                onTogglePinned={() => handlePin(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: spacing.xs,
              paddingBottom: appLayout.pageBottom + spacing.md,
              gap: spacing.sm,
            }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={7}
            ListEmptyComponent={
              <EmptyState
                icon="checkmark-done-circle-outline"
                title="No tasks here"
                subtitle={activeTab === 'all'
                  ? 'Add a task to start building momentum.'
                  : `No ${activeTab} tasks. Switch filter or add one.`}
                actionLabel="Add task"
                onAction={() => setShowAddModal(true)}
              />
            }
          />
        )}
      </PageShell>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />
      <TaskModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
      <TaskModal visible={!!editTask} task={editTask} onClose={() => setEditTask(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  toolRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    zIndex: 100,          // ensures dropdown floats above list items
    elevation: 100,       // Android
  },
});
