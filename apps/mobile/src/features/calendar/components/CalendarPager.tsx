import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { addDays, addMonths, addWeeks, subMonths, subWeeks } from 'date-fns';
import { spacing } from '../../../lib/theme';
import { DayView, MonthView, WeekView } from './CalendarViews';
import type { ViewMode } from './calendar-screen.shared';
import type { CalendarEvent, Task } from '@personal-os/types';

export function shiftCalendarDate(date: Date, direction: 1 | -1, mode: ViewMode) {
  if (mode === 'Month') return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
  if (mode === 'Week') return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  return addDays(date, direction);
}

export function CalendarPager({
  viewMode,
  currentDate,
  selectedDate,
  events,
  tasks,
  onSelectDate,
  onShift,
  onEventPress,
}: {
  viewMode: ViewMode;
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  tasks: Task[];
  onSelectDate: (date: Date) => void;
  onShift: (direction: 1 | -1) => void;
  onEventPress: (event: CalendarEvent) => void;
}) {
  const [pagerWidth, setPagerWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  // Track whether the scroll snap to centre is programmatic (suppress onMomentumEnd)
  const isProgrammatic = useRef(false);

  const pagedDates = useMemo(
    () => [
      shiftCalendarDate(currentDate, -1, viewMode),
      currentDate,
      shiftCalendarDate(currentDate, 1, viewMode),
    ],
    [currentDate, viewMode],
  );

  // When currentDate changes (from nav arrows or programmatic swipe), snap to centre
  // without animation so there's no visible jump. The animation was already played by
  // the user's finger swipe — we just need to reset the offset so the next swipe works.
  useEffect(() => {
    if (pagerWidth > 0 && viewMode !== 'Day') {
      isProgrammatic.current = true;
      scrollRef.current?.scrollTo({ x: pagerWidth, animated: false });
      // Give the scroll a frame to settle before re-enabling momentum handling
      const t = setTimeout(() => { isProgrammatic.current = false; }, 50);
      return () => clearTimeout(t);
    }
  }, [currentDate, pagerWidth, viewMode]);

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pagerWidth === 0 || isProgrammatic.current) return;
      const page = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
      if (page === 1) return; // still on centre — no-op
      onShift(page > 1 ? 1 : -1);
      // The useEffect above will snap back to centre once currentDate updates
    },
    [pagerWidth, onShift],
  );

  if (viewMode === 'Day') {
    return <DayView currentDate={currentDate} events={events} onEventPress={onEventPress} />;
  }

  return (
    <View
      style={styles.viewport}
      onLayout={(e) => setPagerWidth(e.nativeEvent.layout.width)}
    >
      {pagerWidth > 0 && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // "fast" gives snappier feel; combined with pagingEnabled this is smooth
          decelerationRate="fast"
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          // Start positioned at the middle page
          contentOffset={{ x: pagerWidth, y: 0 }}
          // Disable bouncing — prevents a rubber-band jump at the edges
          bounces={false}
          overScrollMode="never"
        >
          {pagedDates.map((date) => (
            <View
              key={`${viewMode}-${date.toISOString()}`}
              style={[styles.page, { width: pagerWidth }]}
            >
              {viewMode === 'Month' ? (
                <MonthView
                  currentDate={date}
                  events={events}
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onSelectDate={onSelectDate}
                />
              ) : (
                <WeekView
                  currentDate={date}
                  events={events}
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onSelectDate={onSelectDate}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { width: '100%' },
  page: { paddingBottom: spacing.xs },
});
