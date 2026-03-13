import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, Dimensions, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../lib/theme';
import { durations, easeOut, easeIn } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const { width: W } = Dimensions.get('window');

// ─── Store ─────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id:      number;
  message: string;
  type:    ToastType;
}

interface ToastState {
  queue:   ToastEntry[];
  current: ToastEntry | null;
  show:    (message: string, type?: ToastType) => void;
  next:    () => void;
}

let _id = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  queue:   [],
  current: null,
  show(message, type = 'info') {
    const entry: ToastEntry = { id: ++_id, message, type };
    const { current } = get();
    if (!current) {
      set({ current: entry });
    } else {
      set((s) => ({ queue: [...s.queue, entry] }));
    }
  },
  next() {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
}));

/** Convenience helpers — call anywhere, no hook needed */
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().show(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().show(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().show(msg, 'warning'),
};

// ─── Config per type ────────────────────────────────────────────────────────

const DURATION = 3200; // ms visible

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<ToastType, { icon: IconName; iconFilled: IconName }> = {
  success: { icon: 'checkmark-circle-outline', iconFilled: 'checkmark-circle'  },
  error:   { icon: 'close-circle-outline',     iconFilled: 'close-circle'       },
  info:    { icon: 'information-circle-outline',iconFilled: 'information-circle' },
  warning: { icon: 'warning-outline',           iconFilled: 'warning'            },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { colors } = useAppTheme();
  const insets      = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { current, next } = useToastStore();

  const slideAnim   = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dur = reducedMotion ? 0 : durations.fast;

  // Colour map — uses a tinted pill on the app surface (not a solid colour banner)
  const colorMap: Record<ToastType, string> = {
    success: colors.success,
    error:   colors.danger,
    info:    colors.accent,
    warning: colors.warning,
  };

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: -100, duration: dur, easing: easeIn, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,    duration: dur, easing: easeIn, useNativeDriver: true }),
    ]).start(() => next());
  }

  useEffect(() => {
    if (!current) return;

    // Reset to hidden, then slide in
    slideAnim.setValue(-100);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: 0, duration: dur, easing: easeOut, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: dur, easing: easeOut, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(dismiss, DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current?.id]);

  if (!current) return null;

  const accentColor = colorMap[current.type];
  const cfg         = TYPE_CONFIG[current.type];

  const topOffset = insets.top + spacing.sm;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: topOffset,
          backgroundColor: colors.surfaceElevated,
          borderColor: `${accentColor}40`,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          // Subtle left accent bar via borderLeftColor
          borderLeftColor: accentColor,
          borderLeftWidth: 3,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
        <Ionicons name={cfg.iconFilled} size={16} color={accentColor} />
      </View>

      {/* Message */}
      <Text style={[styles.text, { color: colors.textPrimary }]} numberOfLines={2}>
        {current.message}
      </Text>

      {/* Dismiss tap */}
      <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Ionicons name="close" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:      'absolute',
    left:          spacing.md,
    right:         spacing.md,
    zIndex:        9999,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing.sm,
    paddingVertical:   spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius:  radius.lg,
    borderWidth:   StyleSheet.hairlineWidth,
    // Shadow
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius:  16,
    elevation:     12,
    maxWidth:      W - spacing.md * 2,
  },
  iconWrap: {
    width: 28, height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    fontSize:   fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
});
