import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { toast } from '../../../components/ui/Toast';
import { useCreateTask, useUpdateTask } from '../tasks.hooks';
import { TaskChipSelector } from './TaskChipSelector';
import { CATEGORIES, FREQUENCIES, PRIORITIES, TaskFormInput, taskSchema } from './tasks-screen.shared';
import type { Task, TaskStatus } from '@personal-os/types';

export function TaskModal({ visible, task, onClose }: {
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [deadlineDate, setDeadlineDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      category: task?.category ?? 'work',
      priority: task?.priority ?? 'medium',
      recurring: task?.recurring ?? false,
      frequency: task?.frequency ?? 'weekly',
    },
  });

  useEffect(() => {
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      category: task?.category ?? 'work',
      priority: task?.priority ?? 'medium',
      recurring: task?.recurring ?? false,
      frequency: task?.frequency ?? 'weekly',
    });
    setDeadlineDate(task?.deadline ? new Date(task.deadline) : null);
  }, [task, visible, reset]);

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');
  const isRecurring = watch('recurring');
  const selectedFrequency = watch('frequency');

  const onSubmit = async (data: TaskFormInput) => {
    const payload = {
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      priority: data.priority,
      deadline: deadlineDate ? deadlineDate.toISOString() : null,
      status: (task?.status ?? 'todo') as TaskStatus,
      estimated_minutes: null,
      ticket_reference: null,
      recurring: data.recurring,
      frequency: data.recurring ? (data.frequency ?? null) : null,
      recurring_parent_id: task?.recurring_parent_id ?? null,
    };

    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({ id: task.id, ...payload });
        toast.success('Task updated');
      } else {
        await createTask.mutateAsync(payload);
        toast.success('Task created');
      }
      reset();
      onClose();
    } catch {
      toast.error(isEditing ? 'Could not update task' : 'Could not create task');
    }
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

          <TaskChipSelector
            label="Category"
            options={CATEGORIES}
            selectedValue={selectedCategory}
            onSelect={(value) => setValue('category', value as TaskFormInput['category'])}
          />

          <TaskChipSelector
            label="Priority"
            options={PRIORITIES}
            selectedValue={selectedPriority}
            onSelect={(value) => setValue('priority', value as TaskFormInput['priority'])}
          />

          <Text style={styles.fieldLabel}>Deadline</Text>

          {/* Date button */}
          <TouchableOpacity
            style={styles.deadlineBtn}
            onPress={() => { setShowTimePicker(false); setShowDatePicker(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.deadlineBtnText, deadlineDate && styles.deadlineBtnTextActive]}>
              {deadlineDate ? format(deadlineDate, 'EEE, MMM d yyyy') : 'Set date (optional)'}
            </Text>
            {deadlineDate && (
              <TouchableOpacity onPress={() => setDeadlineDate(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Time button — only shown once a date is set */}
          {deadlineDate && (
            <TouchableOpacity
              style={[styles.deadlineBtn, { marginTop: 8 }]}
              onPress={() => { setShowDatePicker(false); setShowTimePicker(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.deadlineBtnText, styles.deadlineBtnTextActive]}>
                {format(deadlineDate, 'h:mm a')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Date picker */}
          {showDatePicker && (
            <DateTimePicker
              value={deadlineDate ?? new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_event, date) => {
                if (Platform.OS === 'android') setShowDatePicker(false);
                if (date) {
                  // Preserve existing time if set, otherwise default to 9am
                  const merged = new Date(date);
                  if (deadlineDate) {
                    merged.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
                  } else {
                    merged.setHours(9, 0, 0, 0);
                  }
                  setDeadlineDate(merged);
                }
              }}
            />
          )}
          {Platform.OS === 'ios' && showDatePicker && (
            <TouchableOpacity style={styles.doneDateBtn} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.doneDateBtnText}>Done</Text>
            </TouchableOpacity>
          )}

          {/* Time picker */}
          {showTimePicker && deadlineDate && (
            <DateTimePicker
              value={deadlineDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, date) => {
                if (Platform.OS === 'android') setShowTimePicker(false);
                if (date) {
                  const merged = new Date(deadlineDate);
                  merged.setHours(date.getHours(), date.getMinutes());
                  setDeadlineDate(merged);
                }
              }}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <TouchableOpacity style={styles.doneDateBtn} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.doneDateBtnText}>Done</Text>
            </TouchableOpacity>
          )}

          <View style={styles.recurrenceRow}>
            <View style={styles.recurrenceCopy}>
              <Text style={styles.fieldLabel}>Recurring Task</Text>
              <Text style={styles.fieldSublabel}>Repeat this task automatically</Text>
            </View>
            <TouchableOpacity
              onPress={() => setValue('recurring', !isRecurring)}
              style={[styles.toggleBase, isRecurring && styles.toggleActive]}
            >
              <View style={[styles.toggleThumb, isRecurring && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {isRecurring && (
            <View style={styles.frequencySection}>
              <TaskChipSelector
                label="Frequency"
                options={FREQUENCIES}
                selectedValue={selectedFrequency}
                onSelect={(value) => setValue('frequency', value as TaskFormInput['frequency'])}
                selectedColor={colors.accentLight}
              />
            </View>
          )}

          <Button
            label={isEditing ? 'Save Changes' : 'Create Task'}
            onPress={handleSubmit(onSubmit)}
            loading={createTask.isPending || updateTask.isPending}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  modalScroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
  deadlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  deadlineBtnText: { flex: 1, color: colors.textMuted, fontSize: fontSize.sm },
  deadlineBtnTextActive: { color: colors.textPrimary },
  doneDateBtn: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  doneDateBtnText: { color: colors.accentLight, fontWeight: fontWeight.semibold },
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recurrenceCopy: { flex: 1 },
  fieldSublabel: { marginTop: 2, fontSize: fontSize.sm, color: colors.textMuted },
  toggleBase: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    padding: 3,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.accent },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textPrimary,
  },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
  frequencySection: { gap: spacing.sm },
  submitButton: { marginTop: spacing.md },
});
