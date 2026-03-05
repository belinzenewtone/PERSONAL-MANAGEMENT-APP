import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth, addMonths,
  subMonths, addWeeks, subWeeks, parseISO, isToday, addDays,
} from 'date-fns';
import { useEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../src/features/calendar/calendar.hooks';
import { useTasks } from '../../src/features/tasks/tasks.hooks';
import { Button } from '../../src/components/ui/Button';
import { TextInput } from '../../src/components/ui/TextInput';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, fontSize, fontWeight, radius } from '../../src/lib/theme';
import type { CalendarEvent, EventType, Task } from '@personal-os/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<EventType, { color: string; label: string; icon: string }> = {
  meeting:  { color: colors.work,     label: 'Meeting',  icon: '🤝' },
  study:    { color: colors.growth,   label: 'Study',    icon: '📚' },
  personal: { color: colors.personal, label: 'Personal', icon: '🌿' },
  bill:     { color: colors.bill,     label: 'Bill',     icon: '💳' },
};

const VIEW_MODES = ['Month', 'Week', 'Day'] as const;
type ViewMode = typeof VIEW_MODES[number];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Schema ───────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  title:      z.string().min(1, 'Title is required'),
  type:       z.enum(['meeting', 'study', 'personal', 'bill']),
  start_time: z.string().min(1, 'Start time is required'),
  end_time:   z.string().min(1, 'End time is required'),
}).refine((d) => d.end_time > d.start_time, {
  message: 'End time must be after start time',
  path: ['end_time'],
});

type EventFormInput = z.infer<typeof eventSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ─── Event Chip ───────────────────────────────────────────────────────────────

function EventChip({ event, onPress }: { event: CalendarEvent; onPress: () => void }) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.eventChip, { backgroundColor: cfg.color + '33', borderLeftColor: cfg.color }]}
    >
      <Text style={[styles.eventChipText, { color: cfg.color }]} numberOfLines={1}>
        {event.title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  currentDate, events, tasks, selectedDate, onSelectDate, onEventPress,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onEventPress: (e: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end:   endOfWeek(endOfMonth(currentDate)),
  });

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const key = format(parseISO(e.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (t.deadline) {
        const key = format(parseISO(t.deadline), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  return (
    <View>
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((d) => (
          <Text key={d} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>
      <View style={styles.monthGrid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[key] ?? [];
          const dayTasks  = tasksByDay[key]  ?? [];
          const isSelected = isSameDay(day, selectedDate);
          const todayDay   = isToday(day);
          const inMonth    = isSameMonth(day, currentDate);
          const totalDots  = dayEvents.length + dayTasks.length;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelectDate(day)}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            >
              <View style={[
                styles.dayNumber,
                todayDay && styles.dayNumberToday,
                isSelected && !todayDay && styles.dayNumberSelected,
              ]}>
                <Text style={[
                  styles.dayNumberText,
                  !inMonth && styles.dayNumberOutside,
                  todayDay && styles.dayNumberTodayText,
                  isSelected && !todayDay && styles.dayNumberSelectedText,
                ]}>
                  {format(day, 'd')}
                </Text>
              </View>
              <View style={styles.dotRow}>
                {dayEvents.slice(0, 2).map((ev) => (
                  <View
                    key={ev.id}
                    style={[styles.monthEventDot, { backgroundColor: EVENT_TYPE_CONFIG[ev.type].color }]}
                  />
                ))}
                {dayTasks.slice(0, 2).map((t) => (
                  <View
                    key={t.id}
                    style={[styles.monthEventDot, { backgroundColor: colors.warning }]}
                  />
                ))}
              </View>
              {totalDots > 4 && (
                <Text style={styles.moreEvents}>+{totalDots - 4}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ currentDate, events, onEventPress }: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventPress: (e: CalendarEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate), i));

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const key = format(parseISO(e.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.weekView}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const todayDay = isToday(day);
          return (
            <View key={key} style={styles.weekDayCol}>
              <View style={[styles.weekDayHeader, todayDay && styles.weekDayHeaderToday]}>
                <Text style={[styles.weekDayName, todayDay && styles.weekDayNameToday]}>
                  {format(day, 'EEE')}
                </Text>
                <Text style={[styles.weekDayNum, todayDay && styles.weekDayNumToday]}>
                  {format(day, 'd')}
                </Text>
              </View>
              <View style={styles.weekDayEvents}>
                {(eventsByDay[key] ?? []).map((ev) => (
                  <EventChip key={ev.id} event={ev} onPress={() => onEventPress(ev)} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ currentDate, events, onEventPress }: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventPress: (e: CalendarEvent) => void;
}) {
  const eventsByHour = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events
      .filter((e) => isSameDay(parseISO(e.start_time), currentDate))
      .forEach((e) => {
        const h = parseISO(e.start_time).getHours();
        if (!map[h]) map[h] = [];
        map[h].push(e);
      });
    return map;
  }, [events, currentDate]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.dayView}>
        {Array.from({ length: 24 }, (_, hour) => {
          const isPast = isToday(currentDate) && hour < new Date().getHours();
          return (
            <View key={hour} style={styles.dayHourRow}>
              <Text style={[styles.dayHourLabel, isPast && styles.dayHourLabelPast]}>
                {format(new Date().setHours(hour, 0), 'h a')}
              </Text>
              <View style={styles.dayHourLine} />
              <View style={styles.dayHourEvents}>
                {(eventsByHour[hour] ?? []).map((ev) => {
                  const cfg = EVENT_TYPE_CONFIG[ev.type];
                  return (
                    <TouchableOpacity
                      key={ev.id}
                      onPress={() => onEventPress(ev)}
                      style={[styles.dayEventBlock, { backgroundColor: cfg.color + '22', borderLeftColor: cfg.color }]}
                    >
                      <Text style={[styles.dayEventTitle, { color: cfg.color }]} numberOfLines={1}>
                        {cfg.icon} {ev.title}
                      </Text>
                      <Text style={[styles.dayEventTime, { color: cfg.color + 'cc' }]}>
                        {format(parseISO(ev.start_time), 'h:mm a')} – {format(parseISO(ev.end_time), 'h:mm a')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Event Detail Modal ───────────────────────────────────────────────────────

function EventDetailModal({ event, onClose, onEdit, onDelete }: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = EVENT_TYPE_CONFIG[event.type];
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Event Details</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={[styles.eventTypeHeader, { backgroundColor: cfg.color + '22' }]}>
            <Text style={styles.eventTypeIcon}>{cfg.icon}</Text>
            <View>
              <Text style={styles.eventDetailTitle}>{event.title}</Text>
              <Text style={[styles.eventDetailType, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Card>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Starts</Text>
              <Text style={styles.detailValue}>
                {format(parseISO(event.start_time), 'EEE, MMM d · h:mm a')}
              </Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Ends</Text>
              <Text style={styles.detailValue}>
                {format(parseISO(event.end_time), 'EEE, MMM d · h:mm a')}
              </Text>
            </View>
          </Card>
          <Button label="Delete Event" onPress={onDelete} variant="danger" fullWidth style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────

function EventFormModal({ visible, initialDate, editEvent, onClose }: {
  visible: boolean;
  initialDate: Date;
  editEvent?: CalendarEvent | null;
  onClose: () => void;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!editEvent;

  const makeDefault = (d: Date, hours: number) => {
    const copy = new Date(d);
    copy.setHours(hours, 0, 0, 0);
    return toLocalDatetimeString(copy);
  };

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<EventFormInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title:      editEvent?.title ?? '',
      type:       editEvent?.type  ?? 'personal',
      start_time: editEvent ? toLocalDatetimeString(parseISO(editEvent.start_time)) : makeDefault(initialDate, 9),
      end_time:   editEvent ? toLocalDatetimeString(parseISO(editEvent.end_time))   : makeDefault(initialDate, 10),
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: EventFormInput) => {
    const payload = {
      title:           data.title,
      type:            data.type,
      start_time:      new Date(data.start_time).toISOString(),
      end_time:        new Date(data.end_time).toISOString(),
      related_task_id: null,
    };
    if (isEditing && editEvent) {
      await updateEvent.mutateAsync({ id: editEvent.id, ...payload });
    } else {
      await createEvent.mutateAsync(payload);
    }
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'New Event'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput label="Title *" placeholder="Event name" value={value}
                onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
            )}
          />

          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.chipRow}>
            {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
              <TouchableOpacity
                key={type}
                onPress={() => setValue('type', type)}
                style={[styles.chip, selectedType === type && { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}
              >
                <Text style={styles.chipIcon}>{cfg.icon}</Text>
                <Text style={[styles.chipText, selectedType === type && { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Controller
            control={control}
            name="start_time"
            render={({ field: { onChange, value } }) => (
              <TextInput label="Start (YYYY-MM-DDTHH:MM)" placeholder="2026-03-04T09:00"
                value={value} onChangeText={onChange} error={errors.start_time?.message} />
            )}
          />

          <Controller
            control={control}
            name="end_time"
            render={({ field: { onChange, value } }) => (
              <TextInput label="End (YYYY-MM-DDTHH:MM)" placeholder="2026-03-04T10:00"
                value={value} onChangeText={onChange} error={errors.end_time?.message} />
            )}
          />

          <Button
            label={isEditing ? 'Save Changes' : 'Create Event'}
            onPress={handleSubmit(onSubmit)}
            loading={createEvent.isPending || updateEvent.isPending}
            fullWidth size="lg"
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: events = [], isLoading } = useEvents();
  const { data: tasks = [] } = useTasks();
  const deleteEvent = useDeleteEvent();

  const navigate = (dir: 1 | -1) => {
    if (viewMode === 'Month')      setCurrentDate(dir === 1 ? addMonths(currentDate, 1)  : subMonths(currentDate, 1));
    else if (viewMode === 'Week')  setCurrentDate(dir === 1 ? addWeeks(currentDate, 1)   : subWeeks(currentDate, 1));
    else                           setCurrentDate(addDays(currentDate, dir));
  };

  const headerLabel = () => {
    if (viewMode === 'Month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'Week') {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d')}`;
    }
    return format(currentDate, 'EEEE, MMMM d');
  };

  const selectedDayEvents = useMemo(() =>
    events
      .filter((e) => isSameDay(parseISO(e.start_time), selectedDate))
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [events, selectedDate]
  );

  const selectedDayTasks = useMemo(() =>
    tasks.filter((t) => t.deadline && isSameDay(parseISO(t.deadline), selectedDate)),
    [tasks, selectedDate]
  );

  const handleDeleteEvent = () => {
    if (!detailEvent) return;
    Alert.alert('Delete Event', `Delete "${detailEvent.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteEvent.mutate(detailEvent.id); setDetailEvent(null); } },
    ]);
  };

  const handleEditPress = () => {
    setEditEvent(detailEvent);
    setDetailEvent(null);
    setShowEditModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Calendar</Text>
        <TouchableOpacity onPress={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
          <Text style={styles.todayBtn}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* View mode tabs */}
      <View style={styles.modeTabs}>
        {VIEW_MODES.map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setViewMode(mode)}
            style={[styles.modeTab, viewMode === mode && styles.modeTabActive]}
          >
            <Text style={[styles.modeTabText, viewMode === mode && styles.modeTabTextActive]}>
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navLabel}>{headerLabel()}</Text>
        <TouchableOpacity onPress={() => navigate(1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {viewMode === 'Month' && (
            <>
              <MonthView
                currentDate={currentDate}
                events={events}
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onEventPress={setDetailEvent}
              />
              {(selectedDayEvents.length > 0 || selectedDayTasks.length > 0) && (
                <View style={styles.selectedDayStrip}>
                  <Text style={styles.selectedDayTitle}>
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </Text>
                  {selectedDayEvents.map((ev) => (
                    <EventChip key={ev.id} event={ev} onPress={() => setDetailEvent(ev)} />
                  ))}
                  {selectedDayTasks.map((task) => (
                    <View
                      key={task.id}
                      style={[styles.taskChip, task.status === 'done' && styles.taskChipDone]}
                    >
                      <View style={[styles.taskChipDot, { backgroundColor: colors.warning }]} />
                      <Text
                        style={[styles.taskChipText, task.status === 'done' && styles.taskChipTextDone]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <Text style={styles.taskChipBadge}>{task.priority}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          {viewMode === 'Week' && (
            <WeekView currentDate={currentDate} events={events} onEventPress={setDetailEvent} />
          )}
          {viewMode === 'Day' && (
            <DayView currentDate={currentDate} events={events} onEventPress={setDetailEvent} />
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <EventFormModal visible={showAddModal} initialDate={selectedDate} onClose={() => setShowAddModal(false)} />

      {showEditModal && editEvent && (
        <EventFormModal
          visible={showEditModal}
          initialDate={parseISO(editEvent.start_time)}
          editEvent={editEvent}
          onClose={() => { setShowEditModal(false); setEditEvent(null); }}
        />
      )}

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={handleEditPress}
          onDelete={handleDeleteEvent}
        />
      )}
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
  todayBtn: { fontSize: fontSize.sm, color: colors.accentLight, fontWeight: fontWeight.medium },

  modeTabs: {
    flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 3,
  },
  modeTab: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: radius.sm },
  modeTabActive: { backgroundColor: colors.accent },
  modeTabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  modeTabTextActive: { color: '#fff' },

  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { fontSize: 28, color: colors.textSecondary, lineHeight: 30 },
  navLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },

  content: { flex: 1 },

  // Month
  weekHeader: { flexDirection: 'row', paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
  weekHeaderText: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.semibold },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  dayCell: { width: '14.28%', minHeight: 56, alignItems: 'center', paddingVertical: 4 },
  dayCellSelected: { backgroundColor: colors.accent + '11', borderRadius: radius.sm },
  dayNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  dayNumberToday: { backgroundColor: colors.accent },
  dayNumberSelected: { borderWidth: 1.5, borderColor: colors.accent },
  dayNumberText: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },
  dayNumberOutside: { color: colors.textMuted },
  dayNumberTodayText: { color: '#fff', fontWeight: fontWeight.bold },
  dayNumberSelectedText: { color: colors.accentLight },
  dotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' },
  monthEventDot: { width: 6, height: 6, borderRadius: 3 },
  moreEvents: { fontSize: 9, color: colors.textMuted },

  selectedDayStrip: { margin: spacing.md, gap: spacing.xs },
  selectedDayTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.xs },

  taskChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.warning + '18',
    borderLeftWidth: 3, borderLeftColor: colors.warning,
    marginBottom: 2,
  },
  taskChipDone: { opacity: 0.5 },
  taskChipDot: { width: 6, height: 6, borderRadius: 3 },
  taskChipText: { flex: 1, fontSize: 11, fontWeight: fontWeight.medium, color: colors.textPrimary },
  taskChipTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskChipBadge: { fontSize: 10, color: colors.textMuted, textTransform: 'capitalize' },

  // Event chip
  eventChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, borderLeftWidth: 3, marginBottom: 2 },
  eventChipText: { fontSize: 11, fontWeight: fontWeight.medium },

  // Week
  weekView: { flexDirection: 'row', paddingHorizontal: spacing.sm },
  weekDayCol: { width: 120, marginRight: spacing.xs },
  weekDayHeader: { alignItems: 'center', paddingVertical: spacing.xs, marginBottom: spacing.xs, borderRadius: radius.sm },
  weekDayHeaderToday: { backgroundColor: colors.accent + '22' },
  weekDayName: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  weekDayNameToday: { color: colors.accentLight },
  weekDayNum: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary },
  weekDayNumToday: { color: colors.accent },
  weekDayEvents: { gap: 3 },

  // Day
  dayView: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  dayHourRow: { flexDirection: 'row', minHeight: 52, borderTopWidth: 1, borderTopColor: colors.border + '55' },
  dayHourLabel: { width: 44, paddingTop: spacing.xs, fontSize: fontSize.xs, color: colors.textMuted },
  dayHourLabelPast: { color: colors.border },
  dayHourLine: { width: 1, backgroundColor: colors.border + '55', marginTop: spacing.xs, marginRight: spacing.sm },
  dayHourEvents: { flex: 1, gap: 3, paddingTop: 4, paddingBottom: 4 },
  dayEventBlock: { borderRadius: radius.sm, borderLeftWidth: 3, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  dayEventTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  dayEventTime: { fontSize: fontSize.xs, marginTop: 1 },

  // FAB
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  editBtn: { fontSize: fontSize.md, color: colors.accentLight, fontWeight: fontWeight.semibold, width: 40, textAlign: 'right' },
  modalScroll: { padding: spacing.lg, gap: spacing.md },

  // Event detail
  eventTypeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm,
  },
  eventTypeIcon: { fontSize: 40 },
  eventDetailTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  eventDetailType: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, textTransform: 'capitalize' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm },
  detailLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium },

  // Form
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
});
