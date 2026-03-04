import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Dimensions } from 'react-native';
import { create } from 'zustand';
import { colors, fontSize, fontWeight, radius, spacing } from '../../lib/theme';

const { width: W } = Dimensions.get('window');

// ─── Store ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  visible:  boolean;
  message:  string;
  type:     ToastType;
  show:     (message: string, type?: ToastType) => void;
  hide:     () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type:    'info',
  show:    (message, type = 'info') => set({ visible: true, message, type }),
  hide:    () => set({ visible: false }),
}));

/** Convenience helpers */
export const toast = {
  success: (msg: string) => useToastStore.getState().show(msg, 'success'),
  error:   (msg: string) => useToastStore.getState().show(msg, 'error'),
  info:    (msg: string) => useToastStore.getState().show(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().show(msg, 'warning'),
};

// ─── Component ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: colors.success, icon: '✅' },
  error:   { bg: colors.danger,  icon: '❌' },
  info:    { bg: colors.accent,  icon: 'ℹ️' },
  warning: { bg: colors.warning, icon: '⚠️' },
};

const DURATION = 3000;

export function ToastContainer() {
  const { visible, message, type, hide } = useToastStore();
  const slideAnim  = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Clear existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in
      Animated.parallel([
        Animated.spring(slideAnim,  { toValue: 0,   useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(opacityAnim,{ toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();

      // Auto-hide
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim,   { toValue: -80, duration: 250, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0,   duration: 250, useNativeDriver: true }),
        ]).start(() => hide());
      }, DURATION);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, message]);

  if (!visible && opacityAnim) return null;

  const cfg = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: cfg.bg, transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={styles.icon}>{cfg.icon}</Text>
      <Text style={styles.text} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:       'absolute',
    top:            spacing.xl,
    left:           spacing.lg,
    right:          spacing.lg,
    zIndex:         1000,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing.sm,
    padding:        spacing.md,
    borderRadius:   radius.lg,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.25,
    shadowRadius:   8,
    elevation:      8,
    maxWidth:       W - spacing.lg * 2,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: '#fff', lineHeight: 18 },
});
