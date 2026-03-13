import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, fontSize, useAppTheme } from '../../lib/theme';
import { durations, easeOut, easeIn } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * SearchBar — collapsed to a 32px icon pill by default.
 * Tap expands to full-width input with a fast eased timing animation.
 * Uses native driver for opacity; JS-thread only for width (unavoidable).
 * Width is interpolated from a 0→1 value to keep the animation value clean.
 */
export function SearchBar({ value, onChange, placeholder = 'Search…' }: SearchBarProps) {
  const { colors } = useAppTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const dur = reducedMotion ? 0 : durations.fast;

  function expand() {
    setOpen(true);
    Animated.timing(anim, { toValue: 1, duration: dur, easing: easeOut, useNativeDriver: false }).start(() => {
      inputRef.current?.focus();
    });
    Animated.timing(opacityAnim, { toValue: 1, duration: dur * 1.2, easing: easeOut, useNativeDriver: true }).start();
  }

  function collapse() {
    onChange('');
    Animated.timing(anim, { toValue: 0, duration: dur, easing: easeIn, useNativeDriver: false }).start(() => {
      setOpen(false);
    });
    Animated.timing(opacityAnim, { toValue: 0, duration: dur * 0.8, easing: easeIn, useNativeDriver: true }).start();
  }

  const expandedWidth = anim.interpolate({ inputRange: [0, 1], outputRange: [32, 220] });
  const iconOpacity   = anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0, 0] });

  return (
    <Animated.View
      style={[
        s.wrap,
        {
          width: expandedWidth,
          borderColor: open ? colors.accent : colors.border,
          backgroundColor: open ? colors.surface : colors.surfaceSoft,
        },
      ]}
    >
      {/* Icon — fades out as bar expands */}
      {!open && (
        <Animated.View style={[s.iconOnly, { opacity: iconOpacity }]} pointerEvents={open ? 'none' : 'auto'}>
          <TouchableOpacity onPress={expand} hitSlop={10} style={s.iconBtn}>
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Expanded input — fades in on native thread */}
      {open && (
        <Animated.View style={[s.expanded, { opacity: opacityAnim }]}>
          <Ionicons name="search" size={14} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={[s.input, { color: colors.textPrimary }]}
            returnKeyType="search"
            onSubmitEditing={() => { if (!value.trim()) collapse(); }}
          />
          <TouchableOpacity onPress={collapse} hitSlop={10}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    height: 32, borderRadius: radius.full, borderWidth: 1,
    overflow: 'hidden', justifyContent: 'center',
  },
  iconOnly: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn:  { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  expanded: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, gap: 5,
  },
  input: { flex: 1, fontSize: fontSize.sm, paddingVertical: 0, height: 32 },
});
