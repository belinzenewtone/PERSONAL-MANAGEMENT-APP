import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Capsule } from '../../../components/ui/Capsule';
import { useAppTheme } from '../../../lib/theme';
import { DAYS_OF_WEEK, EVENT_TYPE_CONFIG } from './calendar-screen.shared';
import { useCalendarViewStyles } from './calendar-view.styles';
import type { CalendarEvent, Task } from '@personal-os/types';

export function EventChip({ event, onPress }: { event: CalendarEvent; onPress: () => void }) {
  const styles = useCalendarViewStyles();
  const config = EVENT_TYPE_CONFIG[event.type];
  return (
    <TouchableOpacity onPress={onPress} style={styles.eventChipContainer}>
      <Capsule label={event.title} color={config.color} size="sm" style={styles.fullWidthCapsule} />
    </TouchableOpacity>
  );
}

export function MonthView({
  currentDate,
  events,
  tasks,
  selectedDate,
  onSelectDate,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useCalendarViewStyles();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate)),
  });

  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const key = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!task.deadline) return;
      const key = format(parseISO(task.deadline), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  return (
    <View>
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => <Text key={day} style={styles.weekHeaderText}>{day}</Text>)}
      </View>
      <View style={styles.monthGrid}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[key] ?? [];
          const dayTasks = tasksByDay[key] ?? [];
          const isSelected = isSameDay(day, selectedDate);
          const todayDay = isToday(day);
          const inMonth = isSameMonth(day, currentDate);

          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSelectDate(day)}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
            >
              <View style={[styles.dayNumber, todayDay && styles.dayNumberToday, isSelected && !todayDay && styles.dayNumberSelected]}>
                <Text style={[styles.dayNumberText, !inMonth && styles.dayNumberOutside, todayDay && styles.dayNumberTodayText, isSelected && !todayDay && styles.dayNumberSelectedText]}>
                  {format(day, 'd')}
                </Text>
              </View>
              <View style={styles.dotRow}>
                {dayEvents.slice(0, 2).map((event) => (
                  <View key={event.id} style={[styles.monthEventDot, { backgroundColor: EVENT_TYPE_CONFIG[event.type].color }]} />
                ))}
                {dayTasks.slice(0, 2).map((task) => (
                  <View key={task.id} style={[styles.monthEventDot, { backgroundColor: colors.warning }]} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function WeekView({
  currentDate,
  events,
  tasks,
  selectedDate,
  onSelectDate,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const styles = useCalendarViewStyles();
  const days = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(currentDate), index));
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const key = format(parseISO(event.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!task.deadline) return;
      const key = format(parseISO(task.deadline), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  return (
    <View style={styles.weekView}>
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const todayDay = isToday(day);
        const isSelected = isSameDay(day, selectedDate);
        const eventCount = (eventsByDay[key] ?? []).length;
        const taskCount = (tasksByDay[key] ?? []).length;

        return (
          <TouchableOpacity
            key={key}
            style={[styles.weekDayCol, isSelected && styles.weekDayColSelected]}
            onPress={() => onSelectDate(day)}
            activeOpacity={0.82}
          >
            <Text style={[styles.weekDayName, todayDay && styles.weekDayNameToday]}>
              {format(day, 'EEE')}
            </Text>
            <Text
              style={[
                styles.weekDayNum,
                todayDay && styles.weekDayNumToday,
                isSelected && styles.weekDayNumSelected,
              ]}
            >
              {format(day, 'd')}
            </Text>
            <View style={styles.weekDots}>
              {Array.from({ length: Math.min(3, eventCount) }).map((_, index) => (
                <View key={`event-${key}-${index}`} style={styles.weekEventDot} />
              ))}
              {Array.from({ length: Math.min(2, taskCount) }).map((_, index) => (
                <View key={`task-${key}-${index}`} style={styles.weekTaskDot} />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function DayView({
  currentDate,
  events,
  onEventPress,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}) {
  const styles = useCalendarViewStyles();
  const eventsByHour = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events.filter((event) => isSameDay(parseISO(event.start_time), currentDate)).forEach((event) => {
      const hour = parseISO(event.start_time).getHours();
      if (!map[hour]) map[hour] = [];
      map[hour].push(event);
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
                {(eventsByHour[hour] ?? []).map((event) => {
                  const config = EVENT_TYPE_CONFIG[event.type];
                  return (
                    <TouchableOpacity
                      key={event.id}
                      onPress={() => onEventPress(event)}
                      style={[styles.dayEventBlock, { backgroundColor: `${config.color}22`, borderLeftColor: config.color }]}
                    >
                      <View style={localStyles.dayEventTitleRow}>
                        <Ionicons name={config.icon as never} size={14} color={config.color} />
                        <Text style={[localStyles.dayEventTitle, styles.dayEventTitle, { color: config.color }]} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </View>
                      <Text style={[styles.dayEventTime, { color: `${config.color}cc` }]}>
                        {format(parseISO(event.start_time), 'h:mm a')} – {format(parseISO(event.end_time), 'h:mm a')}
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

const localStyles = StyleSheet.create({
  dayEventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayEventTitle: { flex: 1 },
});
