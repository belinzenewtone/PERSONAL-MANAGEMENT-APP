import React, { memo, useMemo } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useCountdown } from '../../../hooks/useCountdown';
import { spacing, textStyles, radius, useAppTheme, categoryColors, priorityColors } from '../../../lib/theme';
import { URGENCY_COLORS } from './tasks-screen.shared';
import type { Task, TaskStatus } from '@personal-os/types';

function CountdownBadge({ deadline, status }: { deadline: string | null; status: TaskStatus }) {
  const { colors } = useAppTheme();
  const { label, urgency } = useCountdown(status === 'done' ? null : deadline);
  if (!label) return null;
  const color = URGENCY_COLORS[urgency];
  return (
    <View style={[s.countdown, { borderColor: `${color}55`, backgroundColor: `${color}12` }]}>
      <Ionicons name="time-outline" size={10} color={color} />
      <Text style={[s.countdownText, { color }]}>{label}</Text>
    </View>
  );
}

// 40 % of usable card width — deliberate drag required before action fires
const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = Math.round((SCREEN_W - 32) * 0.40);

export const TaskCard = memo(function TaskCard({ task, onToggle, onEdit, onDelete, onTogglePinned }: {
  task: Task; onToggle: () => void; onEdit: () => void;
  onDelete: () => void; onTogglePinned?: () => void;
}) {
  const { colors } = useAppTheme();
  const isDone = task.status === 'done';
  const isInProgress = task.status === 'in_progress';

  // Left border color — category drives it, status modifies it
  const borderColor = isDone
    ? colors.border
    : isInProgress
    ? colors.warning
    : categoryColors[task.category as keyof typeof categoryColors] ?? colors.accent;

  const renderRightAction = (_p: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.4, 0], outputRange: [1, 0.88, 0.7], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.25, 0], outputRange: [1, 0.8, 0], extrapolate: 'clamp' });
    return (
      <View style={s.rightAction}>
        <Animated.View style={[s.actionIcon, { transform: [{ scale }], opacity }]}>
          <Ionicons name="trash" size={22} color={colors.textPrimary} />
          <Text style={[s.actionLabel, { color: colors.textPrimary }]}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  const renderLeftAction = (_p: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.4, SWIPE_THRESHOLD], outputRange: [0.7, 0.88, 1], extrapolate: 'clamp' });
    const opacity = dragX.interpolate({ inputRange: [0, SWIPE_THRESHOLD * 0.25, SWIPE_THRESHOLD], outputRange: [0, 0.8, 1], extrapolate: 'clamp' });
    return (
      <View style={[s.leftAction, isDone ? { backgroundColor: colors.warning } : { backgroundColor: colors.success }]}>
        <Animated.View style={[s.actionIcon, { transform: [{ scale }], opacity }]}>
          <Ionicons name={isDone ? 'arrow-undo' : 'checkmark-done'} size={22} color={colors.textPrimary} />
          <Text style={[s.actionLabel, { color: colors.textPrimary }]}>{isDone ? 'Undo' : 'Done'}</Text>
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
      renderRightActions={renderRightAction}
      renderLeftActions={renderLeftAction}
      onSwipeableOpen={(direction) => {
        if (direction === 'right') onDelete();  // swiped left  → right (delete) panel reveals
        if (direction === 'left') onToggle();   // swiped right → left (done) panel reveals
      }}
    >
      <TouchableOpacity onPress={onEdit} activeOpacity={0.85}>
        <GlassCard style={[s.card, isDone && s.cardDone, { borderLeftColor: borderColor, borderLeftWidth: 3 }]} padding="md">
          <View style={s.row}>
            {/* Checkbox */}
            <TouchableOpacity
              onPress={onToggle}
              style={[
                s.checkbox,
                isDone && { backgroundColor: colors.accent, borderColor: colors.accent },
                isInProgress && { borderColor: colors.warning },
              ]}
            >
              {isDone && <Ionicons name="checkmark" size={13} color={colors.textPrimary} />}
              {isInProgress && <View style={[s.inProgressDot, { backgroundColor: colors.warning }]} />}
            </TouchableOpacity>

            {/* Body */}
            <View style={s.body}>
              <Text style={[s.title, { color: isDone ? colors.textMuted : colors.textPrimary }, isDone && s.titleDone]} numberOfLines={2}>
                {task.title}
              </Text>
              {task.description && !isDone && (
                <Text style={[s.desc, { color: colors.textSecondary }]} numberOfLines={1}>{task.description}</Text>
              )}
              <View style={s.meta}>
                {/* Category label */}
                <View style={[s.catPill, { backgroundColor: `${borderColor}18`, borderColor: `${borderColor}44` }]}>
                  <Text style={[s.catPillText, { color: borderColor }]}>{task.category}</Text>
                </View>
                {/* Priority dot */}
                <View style={[s.priorityDot, { backgroundColor: priorityColors[task.priority as keyof typeof priorityColors] ?? colors.muted }]} />
                <Text style={[s.priorityText, { color: colors.textMuted }]}>{task.priority}</Text>
                {/* Deadline */}
                {task.deadline && (
                  <Text style={[s.deadlineText, { color: colors.textMuted }]}>
                    {format(new Date(task.deadline), 'MMM d')}
                  </Text>
                )}
                {/* Recurring badge */}
                {task.recurring && (
                  <Ionicons name="repeat-outline" size={12} color={colors.accentLight} />
                )}
                <CountdownBadge deadline={task.deadline ?? null} status={task.status} />
              </View>
            </View>

            {/* Trailing */}
            <TouchableOpacity onPress={onTogglePinned} hitSlop={8} style={s.pin}>
              <Ionicons
                name={task.is_pinned ? 'star' : 'star-outline'}
                size={15}
                color={task.is_pinned ? colors.warning : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Swipeable>
  );
});

const s = StyleSheet.create({
  card: { marginBottom: 0, borderRadius: radius.xl },
  cardDone: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  inProgressDot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1 },
  title: { ...textStyles.bodySm, fontWeight: '600', marginBottom: 3 },
  titleDone: { textDecorationLine: 'line-through' },
  desc: { ...textStyles.metaText, marginBottom: 6 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  catPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  catPillText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  priorityDot: { width: 6, height: 6, borderRadius: 99 },
  priorityText: { fontSize: 11 },
  deadlineText: { fontSize: 11 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  countdownText: { fontSize: 10, fontWeight: '600' },
  pin: { paddingTop: 2 },

  // Swipe actions
  rightAction: {
    backgroundColor: '#ef5b67',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.xl,
    flexDirection: 'column',
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.xl,
    flexDirection: 'column',
  },
  actionIcon: { alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 11, fontWeight: '600' },
});
