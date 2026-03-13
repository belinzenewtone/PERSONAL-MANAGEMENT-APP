import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../lib/theme';
import { durations, easeInOut, easeOut } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FilterOption<T extends string> {
  value: T;
  label: string;
  color?: string;
}

interface FilterToggleProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

const ITEM_H = 44;

export function FilterToggle<T extends string>({ options, value, onChange }: FilterToggleProps<T>) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);

  const heightAnim  = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const panelH = options.length * ITEM_H + 2;
  const dur    = reducedMotion ? 0 : durations.fast;

  function toggle() {
    const next = !open;
    setOpen(next);
    Animated.timing(heightAnim,  { toValue: next ? panelH : 0, duration: dur, easing: easeInOut, useNativeDriver: false }).start();
    Animated.timing(opacityAnim, { toValue: next ? 1 : 0,      duration: dur, easing: next ? easeOut : easeInOut, useNativeDriver: true }).start();
    Animated.timing(chevronAnim, { toValue: next ? 1 : 0,      duration: dur, easing: easeInOut, useNativeDriver: true }).start();
  }

  function select(v: T) {
    onChange(v);
    setOpen(false);
    Animated.timing(heightAnim,  { toValue: 0, duration: dur, easing: easeInOut, useNativeDriver: false }).start();
    Animated.timing(opacityAnim, { toValue: 0, duration: dur, easing: easeInOut, useNativeDriver: true }).start();
    Animated.timing(chevronAnim, { toValue: 0, duration: dur, easing: easeInOut, useNativeDriver: true }).start();
  }

  const active       = options.find((o) => o.value === value);
  const activeColor  = active?.color ?? colors.accent;
  const chevronRot   = chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    // alignSelf:'flex-start' → pill hugs its content width, never stretches
    <View style={s.root}>
      {/* ── Trigger pill: just the active label + dot + chevron ── */}
      <TouchableOpacity
        onPress={toggle}
        style={[
          s.trigger,
          {
            borderColor: open ? `${activeColor}66` : colors.border,
            backgroundColor: open ? `${activeColor}12` : colors.surfaceSoft,
          },
        ]}
        activeOpacity={0.7}
      >
        <View style={[s.dot, { backgroundColor: activeColor }]} />
        <Text style={[s.triggerLabel, { color: open ? activeColor : colors.textSecondary }]}>
          {active?.label ?? 'Filter'}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRot }] }}>
          <Ionicons name="chevron-down" size={13} color={open ? activeColor : colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* ── Dropdown — absolutely positioned, floats OVER content below ── */}
      <Animated.View
        style={[s.panelWrap, { height: heightAnim }]}
        pointerEvents={open ? 'auto' : 'none'}
      >
        <Animated.View
          style={[
            s.panel,
            {
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              opacity: opacityAnim,
            },
          ]}
        >
          {options.map((opt, i) => {
            const isActive = opt.value === value;
            const c = opt.color ?? colors.accent;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => select(opt.value)}
                style={[
                  s.option,
                  i < options.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  isActive && { backgroundColor: `${c}10` },
                ]}
                activeOpacity={0.65}
              >
                <View style={[s.optDot, { backgroundColor: isActive ? c : colors.border }]} />
                <Text
                  style={[
                    s.optLabel,
                    {
                      color: isActive ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {isActive && <Ionicons name="checkmark" size={14} color={c} />}
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  // alignSelf flex-start → pill fits content, doesn't stretch
  root: { alignSelf: 'flex-start', position: 'relative' },

  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  triggerLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // Panel is absolute — floats over whatever is below
  panelWrap: {
    position: 'absolute',
    top: 36,
    left: 0,
    zIndex: 999,
    overflow: 'hidden',
    // min width so panel is never narrower than trigger
    minWidth: 160,
  },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: ITEM_H,
    // Each row is at least wide enough to read the label comfortably
    minWidth: 160,
  },
  optDot:   { width: 8, height: 8, borderRadius: 4 },
  optLabel: { fontSize: fontSize.sm, flex: 1 },
});
