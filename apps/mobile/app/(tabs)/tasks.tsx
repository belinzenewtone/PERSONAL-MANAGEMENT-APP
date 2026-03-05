import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useTasks, useCreateTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask,
} from '../../src/features/tasks/tasks.hooks';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { Card } from '../../src/components/ui/Card';
import { TaskCardSkeleton } from '../../src/components/ui/Skeleton';
import { toast } from '../../src/components/ui/Toast';
import { useCountdown } from '../../src/hooks/useCountdown';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@personal-os/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['work', 'growth', 'personal']),
  priority: z.enum(['low', 'medium', 'high']),
});
type TaskFormInput = z.infer<typeof taskSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: TaskCategory; label: string; color: string }[] = [
  { value: 'work',     label: 'Work',     color: colors.work },
  { value: 'growth',   label: 'Growth',   color: colors.growth },
  { value: 'personal', label: 'Personal', color: colors.personal },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: colors.low },
  { value: 'medium', label: 'Medium', color: colors.medium },
  { value: 'high',   label: 'High',   color: colors.high },
];

const TABS: { value: TaskCategory | 'all'; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'work',     label: 'Work' },
  { value: 'growth',   label: 'Growth' },
  { value: 'personal', label: 'Personal' },
];

// ─── Countdown Badge ──────────────────────────────────────────────────────────

const URGENCY_COLORS = {
  overdue: colors.danger,
  urgent:  colors.danger,
  soon:    colors.warning,
  normal:  colors.textMuted,
} as const;

function CountdownBadge({ deadline, status }: { deadline: string | null; status: TaskStatus }) {
  const { label, urgency } = useCountdown(status === 'done' ? null : deadline);
  if (!label) return null;
  const color = URGENCY_COLORS[urgency];
  return (
    <View style={[styles.countdownBadge, { borderColor: color + '66', backgroundColor: color + '15' }]}>
      <Ionicons name="time-outline" size={10} color={color} />
      <Text style={[styles.countdownText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onEdit, onDelete }: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const catColor = CATEGORIES.find((c) => c.value === task.category)?.color ?? colors.textMuted;
  const priColor = PRIORITIES.find((p) => p.value === task.priority)?.color ?? colors.textMuted;
  const isDone = task.status === 'done';

  return (
    <TouchableOpacity onPress={onEdit} onLongPress={onDelete} activeOpacity={0.85}>
      <Card style={[styles.taskCard, isDone && styles.taskCardDone]}>
        <View style={styles.taskRow}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={onToggle}
            style={[styles.checkbox, isDone && styles.checkboxDone]}
          >
            {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
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
                <View style={styles.deadlineBadge}>
                  <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
                  <Text style={styles.deadlineText}>
                    {format(new Date(task.deadline), 'MMM d')}
                  </Text>
                </View>
              )}
              <CountdownBadge deadline={task.deadline ?? null} status={task.status} />
            </View>
          </View>

          {/* Edit hint */}
          <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ─── Task Modal (Add & Edit) ──────────────────────────────────────────────────

function TaskModal({ visible, task, onClose }: {
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
}) {
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title:       task?.title       ?? '',
      description: task?.description ?? '',
      category:    task?.category    ?? 'work',
      priority:    task?.priority    ?? 'medium',
    },
  });

  // Re-populate form when task changes
  useEffect(() => {
    reset({
      title:       task?.title       ?? '',
      description: task?.description ?? '',
      category:    task?.category    ?? 'work',
      priority:    task?.priority    ?? 'medium',
    });
    setDeadlineDate(task?.deadline ? new Date(task.deadline) : null);
  }, [task, visible]);

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const onSubmit = async (data: TaskFormInput) => {
    const payload = {
      title:              data.title,
      description:        data.description ?? null,
      category:           data.category,
      priority:           data.priority,
      deadline:           deadlineDate ? deadlineDate.toISOString() : null,
      status:             (task?.status ?? 'todo') as TaskStatus,
      estimated_minutes:  null,
      ticket_reference:   null,
      recurring:          false,
    };

    if (isEditing && task) {
      await updateTask.mutateAsync({ id: task.id, ...payload });
      toast.success('Task updated');
    } else {
      await createTask.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Title *"
                placeholder="What needs to be done?"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description"
                placeholder="Optional details…"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={3}
              />
            )}
          />

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setValue('category', cat.value)}
                style={[
                  styles.chip,
                  selectedCategory === cat.value && {
                    backgroundColor: cat.color + '33',
                    borderColor: cat.color,
                  },
                ]}
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
                style={[
                  styles.chip,
                  selectedPriority === pri.value && {
                    backgroundColor: pri.color + '33',
                    borderColor: pri.color,
                  },
                ]}
              >
                <Text style={[styles.chipText, selectedPriority === pri.value && { color: pri.color }]}>
                  {pri.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Deadline */}
          <Text style={styles.fieldLabel}>Deadline</Text>
          <TouchableOpacity
            style={styles.deadlineBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.deadlineBtnText, deadlineDate && { color: colors.textPrimary }]}>
              {deadlineDate ? format(deadlineDate, 'EEE, MMM d yyyy') : 'Set deadline (optional)'}
            </Text>
            {deadlineDate && (
              <TouchableOpacity onPress={() => setDeadlineDate(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={deadlineDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(event, date) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (date) setDeadlineDate(date);
              }}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity
              style={styles.doneDateBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.doneDateBtnText}>Done</Text>
            </TouchableOpacity>
          )}

          <Button
            label={isEditing ? 'Save Changes' : 'Create Task'}
            onPress={handleSubmit(onSubmit)}
            loading={createTask.isPending || updateTask.isPending}
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
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
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No tasks here</Text>
              <Text style={styles.emptySubtext}>Tap + to add a new task</Text>
            </View>
          ) : (
            filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onEdit={() => setEditTask(task)}
                onDelete={() => handleDelete(task)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <TaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Modal */}
      {editTask && (
        <TaskModal
          visible={!!editTask}
          task={editTask}
          onClose={() => setEditTask(null)}
        />
      )}
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
  screenTitle: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  taskCount:   { fontSize: fontSize.sm, color: colors.textSecondary },

  tabsScroll:     { maxHeight: 44 },
  tabsContainer:  { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive:     { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText:       { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: '#fff' },

  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 110 },

  taskCard:     { marginBottom: 0 },
  taskCardDone: { opacity: 0.55 },
  taskRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: radius.sm,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  taskBody:      { flex: 1 },
  taskTitle:     { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textPrimary },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDesc:      { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  taskMeta:      { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, flexWrap: 'wrap', alignItems: 'center' },
  badge:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  badgeText:     { fontSize: 10, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
  deadlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  deadlineText:  { fontSize: 11, color: colors.textMuted },
  countdownBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: radius.sm, borderWidth: 1,
  },
  countdownText: { fontSize: 10, fontWeight: fontWeight.semibold },

  empty:        { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyText:    { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textMuted },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 100,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

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
  modalTitle:  { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
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

  deadlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  deadlineBtnText: { flex: 1, fontSize: fontSize.md, color: colors.textMuted },

  doneDateBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  doneDateBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
