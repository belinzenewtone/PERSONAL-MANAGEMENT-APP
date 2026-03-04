import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput as RNInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  useTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask,
} from '../../src/features/tasks/tasks.hooks';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { Card } from '../../src/components/ui/Card';
import { TaskCardSkeleton } from '../../src/components/ui/Skeleton';
import { toast } from '../../src/components/ui/Toast';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@personal-os/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'growth', 'personal']),
  priority: z.enum(['low', 'medium', 'high']),
  deadline: z.string().optional(),
});
type TaskFormInput = z.infer<typeof taskSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: colors.work },
  { value: 'growth', label: 'Growth', color: colors.growth },
  { value: 'personal', label: 'Personal', color: colors.personal },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: colors.low },
  { value: 'medium', label: 'Medium', color: colors.medium },
  { value: 'high', label: 'High', color: colors.high },
];

const TABS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'work', label: 'Work' },
  { value: 'growth', label: 'Growth' },
  { value: 'personal', label: 'Personal' },
];

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const catColor = CATEGORIES.find((c) => c.value === task.category)?.color ?? colors.textMuted;
  const priColor = PRIORITIES.find((p) => p.value === task.priority)?.color ?? colors.textMuted;
  const isDone = task.status === 'done';

  return (
    <TouchableOpacity onLongPress={onDelete} activeOpacity={0.85}>
      <Card style={[styles.taskCard, isDone && styles.taskCardDone]}>
        <View style={styles.taskRow}>
          {/* Checkbox */}
          <TouchableOpacity onPress={onToggle} style={[styles.checkbox, isDone && styles.checkboxDone]}>
            {isDone && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.taskBody}>
            <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]} numberOfLines={2}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
            )}
            <View style={styles.taskMeta}>
              <View style={[styles.badge, { backgroundColor: catColor + '22' }]}>
                <Text style={[styles.badgeText, { color: catColor }]}>{task.category}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: priColor + '22' }]}>
                <Text style={[styles.badgeText, { color: priColor }]}>{task.priority}</Text>
              </View>
              {task.deadline && (
                <Text style={styles.deadline}>
                  {format(new Date(task.deadline), 'MMM d')}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createTask = useCreateTask();
  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: { category: 'work', priority: 'medium' },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const onSubmit = async (data: TaskFormInput) => {
    await createTask.mutateAsync({
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      priority: data.priority,
      deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      status: 'todo',
      estimated_minutes: null,
      ticket_reference: null,
      recurring: false,
    });
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>New Task</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Title *" placeholder="What needs to be done?" value={value}
                onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Description" placeholder="Optional details..." value={value ?? ''}
                onChangeText={onChange} onBlur={onBlur} multiline numberOfLines={3} />
            )}
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setValue('category', cat.value)}
                style={[styles.chip, selectedCategory === cat.value && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
              >
                <Text style={[styles.chipText, selectedCategory === cat.value && { color: cat.color }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Priority */}
          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((pri) => (
              <TouchableOpacity
                key={pri.value}
                onPress={() => setValue('priority', pri.value)}
                style={[styles.chip, selectedPriority === pri.value && { backgroundColor: pri.color + '33', borderColor: pri.color }]}
              >
                <Text style={[styles.chipText, selectedPriority === pri.value && { color: pri.color }]}>
                  {pri.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Create Task"
            onPress={handleSubmit(onSubmit)}
            loading={createTask.isPending}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState<TaskCategory | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const { data: tasks, isLoading } = useTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  const filtered = tasks?.filter((t) =>
    activeTab === 'all' ? true : t.category === activeTab
  ) ?? [];

  const handleToggle = (task: Task) => {
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateStatus.mutate({ id: task.id, status: next });
  };

  const handleDelete = (task: Task) => {
    deleteTask.mutate(task.id, {
      onSuccess: () => toast.info(`"${task.title}" deleted`),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Tasks</Text>
        <Text style={styles.taskCount}>{filtered.length} task{filtered.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      {isLoading ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {[0, 1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No tasks here</Text>
              <Text style={styles.emptySubtext}>Tap + to add a new task</Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onDelete={() => handleDelete(task)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTaskModal visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  taskCount: { fontSize: fontSize.sm, color: colors.textSecondary },

  tabsScroll: { maxHeight: 44 },
  tabsContainer: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: '#fff' },

  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },

  taskCard: { marginBottom: 0 },
  taskCardDone: { opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: fontWeight.bold },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  taskMeta: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap', alignItems: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  badgeText: { fontSize: 10, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
  deadline: { fontSize: 11, color: colors.textMuted },

  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose: { fontSize: fontSize.lg, color: colors.textSecondary },
  modalScroll: { padding: spacing.lg, gap: spacing.md },

  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
});
