import React, { useMemo, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from '../../../components/ui/Toast';
import { useCreateEvent, useUpdateEvent } from '../calendar.hooks';
import { Button } from '../../../components/ui/Button';
import { Capsule } from '../../../components/ui/Capsule';
import { TextInput } from '../../../components/ui/TextInput';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { EVENT_TYPE_CONFIG, eventSchema, EventFormInput, toLocalDatetimeString } from './calendar-screen.shared';
import type { CalendarEvent, EventType } from '@personal-os/types';

type PickerTarget = 'start_date' | 'start_time' | 'end_date' | 'end_time' | null;

export function EventFormModal({
  visible,
  initialDate,
  editEvent,
  onClose,
}: {
  visible: boolean;
  initialDate: Date;
  editEvent?: CalendarEvent | null;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!editEvent;
  const [activePicker, setActivePicker] = useState<PickerTarget>(null);

  const makeDefault = (date: Date, hours: number) => {
    const copy = new Date(date);
    copy.setHours(hours, 0, 0, 0);
    return copy;
  };

  const [startDate, setStartDate] = useState<Date>(
    editEvent ? new Date(editEvent.start_time) : makeDefault(initialDate, 9)
  );
  const [endDate, setEndDate] = useState<Date>(
    editEvent ? new Date(editEvent.end_time) : makeDefault(initialDate, 10)
  );

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<EventFormInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: editEvent?.title ?? '',
      type: editEvent?.type ?? 'personal',
      start_time: toLocalDatetimeString(editEvent ? new Date(editEvent.start_time) : makeDefault(initialDate, 9)),
      end_time: toLocalDatetimeString(editEvent ? new Date(editEvent.end_time) : makeDefault(initialDate, 10)),
    },
  });

  const selectedType = watch('type');

  function handlePickerChange(target: PickerTarget, date?: Date) {
    if (!date) return;
    if (Platform.OS === 'android') setActivePicker(null);

    if (target === 'start_date') {
      const merged = new Date(date);
      merged.setHours(startDate.getHours(), startDate.getMinutes());
      setStartDate(merged);
      setValue('start_time', toLocalDatetimeString(merged));
      // Auto-push end date if it's now before start
      if (merged >= endDate) {
        const newEnd = new Date(merged);
        newEnd.setHours(merged.getHours() + 1);
        setEndDate(newEnd);
        setValue('end_time', toLocalDatetimeString(newEnd));
      }
    } else if (target === 'start_time') {
      const merged = new Date(startDate);
      merged.setHours(date.getHours(), date.getMinutes());
      setStartDate(merged);
      setValue('start_time', toLocalDatetimeString(merged));
      if (merged >= endDate) {
        const newEnd = new Date(merged);
        newEnd.setHours(merged.getHours() + 1);
        setEndDate(newEnd);
        setValue('end_time', toLocalDatetimeString(newEnd));
      }
    } else if (target === 'end_date') {
      const merged = new Date(date);
      merged.setHours(endDate.getHours(), endDate.getMinutes());
      setEndDate(merged);
      setValue('end_time', toLocalDatetimeString(merged));
    } else if (target === 'end_time') {
      const merged = new Date(endDate);
      merged.setHours(date.getHours(), date.getMinutes());
      setEndDate(merged);
      setValue('end_time', toLocalDatetimeString(merged));
    }
  }

  const onSubmit = async (data: EventFormInput) => {
    const payload = {
      title: data.title,
      type: data.type,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      related_task_id: null,
    };
    try {
      if (isEditing && editEvent) {
        await updateEvent.mutateAsync({ id: editEvent.id, ...payload });
        toast.success('Event updated');
      } else {
        await createEvent.mutateAsync(payload);
        toast.success('Event created');
      }
      reset();
      onClose();
    } catch {
      toast.error(isEditing ? 'Could not update event' : 'Could not create event');
    }
  };

  function DateTimeRow({
    label,
    date,
    dateTarget,
    timeTarget,
  }: {
    label: string;
    date: Date;
    dateTarget: PickerTarget;
    timeTarget: PickerTarget;
  }) {
    return (
      <View style={styles.dtSection}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.dtRow}>
          <TouchableOpacity
            style={[styles.dtBtn, activePicker === dateTarget && styles.dtBtnActive]}
            onPress={() => setActivePicker(activePicker === dateTarget ? null : dateTarget)}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.dtBtnText, { color: colors.textPrimary }]}>
              {format(date, 'EEE, MMM d')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dtBtn, activePicker === timeTarget && styles.dtBtnActive]}
            onPress={() => setActivePicker(activePicker === timeTarget ? null : timeTarget)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={15} color={colors.textMuted} />
            <Text style={[styles.dtBtnText, { color: colors.textPrimary }]}>
              {format(date, 'h:mm a')}
            </Text>
          </TouchableOpacity>
        </View>

        {(activePicker === dateTarget || activePicker === timeTarget) && (
          <>
            <DateTimePicker
              value={date}
              mode={activePicker === dateTarget ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, picked) => handlePickerChange(activePicker, picked)}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.doneDateBtn} onPress={() => setActivePicker(null)}>
                <Text style={styles.doneDateBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Title *"
                placeholder="Event name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.chipRow}>
            {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([type, config]) => (
              <TouchableOpacity key={type} onPress={() => setValue('type', type)}>
                <Capsule
                  label={config.label}
                  color={config.color}
                  variant={selectedType === type ? 'subtle' : 'outline'}
                  size="md"
                  icon={<Ionicons name={config.icon as never} size={14} color={config.color} />}
                />
              </TouchableOpacity>
            ))}
          </View>

          <DateTimeRow label="Start" date={startDate} dateTarget="start_date" timeTarget="start_time" />
          <DateTimeRow label="End" date={endDate} dateTarget="end_date" timeTarget="end_time" />

          {errors.end_time && (
            <Text style={styles.errorText}>{errors.end_time.message}</Text>
          )}

          <Button
            label={isEditing ? 'Save Changes' : 'Create Event'}
            onPress={handleSubmit(onSubmit)}
            loading={createEvent.isPending || updateEvent.isPending}
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerSpacer: { width: 40 },
  modalScroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  fieldLabel: {
    fontSize: fontSize.xs, color: colors.textSecondary,
    fontWeight: fontWeight.bold, textTransform: 'uppercase',
    marginBottom: 4, letterSpacing: 0.4,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  dtSection: { gap: 6 },
  dtRow: { flexDirection: 'row', gap: spacing.sm },
  dtBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
  },
  dtBtnActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}12`,
  },
  dtBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },
  doneDateBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    marginTop: 4,
  },
  doneDateBtnText: { color: colors.accentLight, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  errorText: { color: colors.danger, fontSize: fontSize.xs, marginTop: -4 },
  submitButton: { marginTop: spacing.sm },
});
