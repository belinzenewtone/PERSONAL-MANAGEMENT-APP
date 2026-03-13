import React, { memo, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Wallet, CheckSquare, Bot } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { radius, spacing, useAppTheme } from '../../lib/theme';
import { selectionTap } from '../../lib/feedback';
import { durations, easeOut, easeIn } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const TAB_CONFIG: Record<string, { Icon: any; label: string }> = {
  index:     { Icon: Home,         label: 'Home'  },
  calendar:  { Icon: Calendar,     label: 'Plan'  },
  finance:   { Icon: Wallet,       label: 'Money' },
  tasks:     { Icon: CheckSquare,  label: 'Tasks' },
  assistant: { Icon: Bot,          label: 'AI'    },
};

/** Height of the tab bar pill (used by screens that need to clear it) */
export const TAB_BAR_HEIGHT = 64; // paddingVertical sm*2 + icon 28 + label ~12

function TabItem({
  routeName, isFocused, onPress, colors,
}: {
  routeName: string; isFocused: boolean; onPress: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const cfg = TAB_CONFIG[routeName];
  if (!cfg) return null;
  const { Icon, label } = cfg;
  const reducedMotion = useReducedMotion();

  const scale  = useRef(new Animated.Value(1)).current;
  const pillOp = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(pillOp, {
      toValue: isFocused ? 1 : 0,
      duration: reducedMotion ? 0 : durations.fast,
      easing: isFocused ? easeOut : easeIn,
      useNativeDriver: true,
    }).start();
  }, [isFocused, pillOp, reducedMotion]);

  useEffect(() => {
    if (!isFocused || reducedMotion) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 70, easing: easeIn,  useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1,    tension: 300, friction: 9,      useNativeDriver: true }),
    ]).start();
  }, [isFocused, scale, reducedMotion]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.65}
    >
      <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
        <Animated.View
          style={[
            styles.activePill,
            { backgroundColor: `${colors.accent}1e`, borderColor: `${colors.accent}44`, opacity: pillOp },
          ]}
          pointerEvents="none"
        />
        <Icon size={18} color={isFocused ? colors.accent : colors.textMuted} strokeWidth={isFocused ? 2.5 : 1.8} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          {
            color: isFocused ? colors.accent : colors.textMuted,
            opacity: pillOp.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export const FloatingTabBar = memo(({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const bottom = insets.bottom + 8;

  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);

  const pill = (
    <View style={styles.pill}>
      {visibleRoutes.map((route) => {
        const idx       = state.routes.indexOf(route);
        const isFocused = state.index === idx;
        const onPress   = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            selectionTap();
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            onPress={onPress}
            colors={colors}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { bottom }]} pointerEvents="box-none">
      {Platform.OS === 'ios' ? (
        <BlurView intensity={64} tint={isDark ? 'dark' : 'light'} style={[styles.shell, { borderColor: colors.borderStrong }]}>
          {pill}
        </BlurView>
      ) : (
        <View style={[styles.shell, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceElevated }]}>
          {pill}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 16, right: 16, zIndex: 1000 },
  shell: {
    borderRadius: radius.xxl, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
  },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 4 },
  iconWrap:  { width: 42, height: 28, alignItems: 'center', justifyContent: 'center' },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
});
