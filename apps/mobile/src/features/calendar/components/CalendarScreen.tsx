import { toast } from '../../../components/ui/Toast';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert, Animated, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  endOfWeek, format, isSameDay, parseISO, startOfWeek,
} from 'date-fns';
import { useDeleteEvent, useEvents } from '../calendar.hooks';
import { useTasks } from '../../tasks/tasks.hooks';
import { useCountdown } from '../../../hooks/useCountdown';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageShell } from '../../../components/ui/PageShell';
import { PageHeader } from '../../../components/ui/PageHeader';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { FloatingActionButton } from '../../../components/ui/FloatingActionButton';
import { Skeleton } from '../../../components/ui/Skeleton';
import { appLayout, spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { EventDetailModal } from './EventDetailModal';
import { EventFormModal } from './EventFormModal';
import { CalendarPager, shiftCalendarDate } from './CalendarPager';
import { EVENT_TYPE_CONFIG, VIEW_MODES, ViewMode } from './calendar-screen.shared';
import type { CalendarEvent } from '@personal-os/types';

// ─── Mini countdown badge for events/tasks ──────────────────────────────────
function CountdownBadge({ target }: { target: string }) {
  const { label, urgency } = useCountdown(target);
  if (!label) return null;
  const { colors } = useAppTheme();
  const color =
    urgency === 'overdue' ? colors.danger :
    urgency === 'urgent'  ? colors.danger :
    urgency === 'soon'    ? colors.warning :
    colors.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name="time-outline" size={11} color={color} />
      <Text style={{ fontSize: 11, color, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

// 40 % of usable card width — deliberate drag required before action fires
const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = Math.round((SCREEN_W - 32) * 0.40);

// ─── Swipeable Event Row ─────────────────────────────────────────────────────
function EventRow({
  event,
  onPress,
  onDelete,
}: {
  event: CalendarEvent;
  onPress: () => void;
  onDelete?: () => void;
}) {
  const { colors } = useAppTheme();
  const config = EVENT_TYPE_CONFIG[event.type];

  const renderRightAction = (_p: any, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.25, 0], outputRange: [1, 0.85, 0.6], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.25, 0], outputRange: [1, 0.7, 0], extrapolate: 'clamp' });
    return (
      <View style={evtStyles.deleteAction}>
        <Animated.View style={[evtStyles.actionInner, { transform: [{ scale }], opacity }]}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={evtStyles.actionLabel}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  const renderLeftAction = (_p: any, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.25, SWIPE_THRESHOLD], outputRange: [0.6, 0.85, 1], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.25, SWIPE_THRESHOLD], outputRange: [0, 0.7, 1], extrapolate: 'clamp' });
    return (
      <View style={evtStyles.completeAction}>
        <Animated.View style={[evtStyles.actionInner, { transform: [{ scale }], opacity }]}>
          <Ionicons name="checkmark-done" size={20} color="#fff" />
          <Text style={evtStyles.actionLabel}>Done</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={SWIPE_THRESHOLD}
      rightThreshold={SWIPE_THRESHOLD}
      renderRightActions={onDelete ? renderRightAction : undefined}
      renderLeftActions={onDelete ? renderLeftAction : undefined}
      onSwipeableOpen={(direction) => {
        // 'right' = left panel opened = user swiped right = Done (green)
        // 'left'  = right panel opened = user swiped left = Delete (red)
        if (onDelete) onDelete();
      }}
    >
      <TouchableOpacity onPress={onPress} style={[evtStyles.row, { borderLeftColor: config.color }]} activeOpacity={0.75}>
        <View style={evtStyles.rowMain}>
          <Text style={[evtStyles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>
            {format(parseISO(event.start_time), 'h:mm a')} – {format(parseISO(event.end_time), 'h:mm a')}
          </Text>
        </View>
        <CountdownBadge target={event.end_time} />
      </TouchableOpacity>
    </Swipeable>
  );
}

const evtStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, paddingHorizontal: 12,
    borderLeftWidth: 3, gap: 8,
    backgroundColor: 'transparent',
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '500' },
  deleteAction: {
    backgroundColor: '#ef5b67', justifyContent: 'center', alignItems: 'center',
    width: 76, borderRadius: 12,
  },
  completeAction: {
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
    width: 76, borderRadius: 12,
  },
  actionInner: { alignItems: 'center', gap: 3 },
  actionLabel: { fontSize: 11, fontWeight: '600', color: '#fff' },
});

// ─── Task row in the selected-day strip ─────────────────────────────────────
function TaskRow({ task }: { task: { id: string; title: string; deadline: string | null; status: string } }) {
  const { colors } = useAppTheme();
  const isDone = task.status === 'done';
  return (
    <View style={[styles.itemRow, { borderLeftColor: colors.warning, opacity: isDone ? 0.4 : 1 }]}>
      <View style={styles.itemMain}>
        <Text style={[styles.itemTitle, { color: colors.textPrimary, textDecorationLine: isDone ? 'line-through' : 'none' }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>Task deadline</Text>
      </View>
      {task.deadline && !isDone && <CountdownBadge target={task.deadline} />}
    </View>
  );
}

// ─── Full Events list modal (when "View Events" toggle is on) ────────────────
function AllEventsList({ events, onPress, onDelete }: { events: CalendarEvent[]; onPress: (e: CalendarEvent) => void; onDelete: (e: CalendarEvent) => void }) {
  const { colors } = useAppTheme();
  const sorted = useMemo(
    () => [...events].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [events],
  );
  if (sorted.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
        <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: fontSize.sm }}>No events yet. Tap + to add one.</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={sorted}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => (
        <EventRow
          event={item}
          onPress={() => onPress(item)}
          onDelete={() => onDelete(item)}
        />
      )}
      contentContainerStyle={{ gap: spacing.xs }}
      scrollEnabled={false}
    />
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const { data: events = [], isLoading } = useEvents();
  const { data: tasks = [] } = useTasks();
  const deleteEvent = useDeleteEvent();

  const selectedDayEvents = useMemo(
    () => events
      .filter((e) => isSameDay(parseISO(e.start_time), selectedDate))
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [events, selectedDate],
  );

  const selectedDayTasks = useMemo(
    () => tasks.filter((t) => t.deadline && isSameDay(parseISO(t.deadline), selectedDate)),
    [tasks, selectedDate],
  );

  const headerLabel = useMemo(() => {
    if (viewMode === 'Month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'Week') return `${format(startOfWeek(currentDate), 'MMM d')} – ${format(endOfWeek(currentDate), 'MMM d')}`;
    return format(currentDate, 'EEEE, MMMM d');
  }, [currentDate, viewMode]);

  const handleDeleteEvent = useCallback(() => {
    if (!detailEvent) return;
    const title = detailEvent.title;
    Alert.alert('Delete Event', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteEvent.mutate(detailEvent.id, {
            onSuccess: () => toast.success(`"${title}" deleted`),
            onError:   () => toast.error('Could not delete event'),
          });
          setDetailEvent(null);
        },
      },
    ]);
  }, [deleteEvent, detailEvent]);

  // Direct delete for swipe actions (no confirmation needed — action is explicit)
  const handleSwipeDelete = useCallback((event: CalendarEvent) => {
    deleteEvent.mutate(event.id, {
      onSuccess: () => toast.success(`"${event.title}" deleted`),
      onError:   () => toast.error('Could not delete event'),
    });
  }, [deleteEvent]);

  function navigate(direction: 1 | -1) {
    setCurrentDate((prev) => shiftCalendarDate(prev, direction, viewMode));
    setSelectedDate((prev) => shiftCalendarDate(prev, direction, viewMode));
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (viewMode !== 'Day') setCurrentDate(date);
  }

  const hasDayContent = selectedDayEvents.length > 0 || selectedDayTasks.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <PageShell scroll={false} contentContainerStyle={{ flex: 1, paddingBottom: 0 }} accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Time"
          title="Calendar"
          subtitle="Events and deadlines in one place."
          action={
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <IconPillButton
                onPress={() => { const t = new Date(); setCurrentDate(t); setSelectedDate(t); }}
                icon={<Ionicons name="today-outline" size={16} color={colors.accentLight} />}
                label="Today"
              />
              <TouchableOpacity
                onPress={() => setShowAllEvents((v) => !v)}
                style={[evtToggleStyle(colors, showAllEvents)]}
              >
                <Ionicons
                  name={showAllEvents ? 'list' : 'list-outline'}
                  size={15}
                  color={showAllEvents ? '#ffffff' : colors.textSecondary}
                />
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: showAllEvents ? '#ffffff' : colors.textSecondary,
                }}>
                  Events
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        <SegmentedControl
          options={VIEW_MODES.map((m) => ({ label: m, value: m }))}
          value={viewMode}
          onChange={setViewMode}
          style={{ marginTop: spacing.xs }}
        />

        {isLoading ? (
          <GlassCard padding="md" style={{ gap: spacing.md }}>
            <Skeleton width="48%" height={18} />
            <Skeleton width="100%" height={220} style={{ marginTop: spacing.sm }} />
          </GlassCard>
        ) : showAllEvents ? (
          /* ── All Events view ─────────────────────────────────────── */
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: appLayout.pageBottom }}>
            <GlassCard padding="md" style={{ gap: spacing.sm }}>
              <Text style={[styles.stripTitle, { color: colors.textPrimary }]}>All Events</Text>
              <AllEventsList events={events} onPress={setDetailEvent} onDelete={handleSwipeDelete} />
            </GlassCard>
          </ScrollView>
        ) : (
          /* ── Calendar view ────────────────────────────────────────── */
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: appLayout.pageBottom }}>
            <GlassCard padding="md" style={{ marginBottom: spacing.md }}>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => navigate(-1)} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.navLabel, { color: colors.textPrimary }]}>{headerLabel}</Text>
                <TouchableOpacity onPress={() => navigate(1)} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <CalendarPager
                viewMode={viewMode}
                currentDate={currentDate}
                selectedDate={selectedDate}
                events={events}
                tasks={tasks}
                onSelectDate={handleSelectDate}
                onShift={navigate}
                onEventPress={setDetailEvent}
              />
            </GlassCard>

            {/* Selected day strip */}
            {hasDayContent && (
              <GlassCard padding="md" style={{ marginBottom: spacing.md, gap: spacing.xs }}>
                <Text style={[styles.stripTitle, { color: colors.textPrimary }]}>
                  {format(selectedDate, 'EEEE, MMMM d')}
                </Text>
                {selectedDayEvents.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    onPress={() => setDetailEvent(e)}
                    onDelete={() => handleSwipeDelete(e)}
                  />
                ))}
                {selectedDayTasks.map((t) => (
                  <TaskRow key={t.id} task={t as any} />
                ))}
              </GlassCard>
            )}
          </ScrollView>
        )}
      </PageShell>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <EventFormModal visible={showAddModal} initialDate={selectedDate} onClose={() => setShowAddModal(false)} />
      {editEvent && (
        <EventFormModal
          visible={!!editEvent}
          initialDate={parseISO(editEvent.start_time)}
          editEvent={editEvent}
          onClose={() => setEditEvent(null)}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
          onDelete={handleDeleteEvent}
        />
      )}
    </SafeAreaView>
  );
}

// small helper outside component to avoid hook rules issues
function evtToggleStyle(colors: ReturnType<typeof useAppTheme>['colors'], active: boolean) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: active ? colors.accent : colors.border,
    backgroundColor: active ? colors.accent : colors.surfaceSoft,
  };
}

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md },
  navBtn: { padding: spacing.xs },
  navLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  stripTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, marginBottom: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    backgroundColor: 'transparent',
    gap: spacing.sm,
  },
  itemMain: { flex: 1, gap: 2 },
  itemTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
