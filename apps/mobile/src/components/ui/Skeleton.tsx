import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { radius, useAppTheme } from '../../lib/theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface SkeletonProps {
  width?:  number | string;
  height?: number;
  style?:  ViewStyle;
  rounded?: boolean;
}

function useSkeletonStyles() {
  const { colors } = useAppTheme();
  return createStyles(colors);
}

export function Skeleton({ width = '100%', height = 16, style, rounded = false }: SkeletonProps) {
  const styles = useSkeletonStyles();
  const reducedMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reducedMotion) {
      anim.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width:        width as any,
          height,
          opacity:      anim,
          borderRadius: rounded ? (height as number) / 2 : radius.sm,
        },
        style,
      ]}
    />
  );
}

// ─── Composite skeletons ──────────────────────────────────────────────────────

export function TaskCardSkeleton() {
  const styles = useSkeletonStyles();
  return (
    <View style={styles.card}>
      <Skeleton width={20} height={20} rounded style={{ marginRight: 12 }} />
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={10} />
      </View>
      <Skeleton width={48} height={20} rounded />
    </View>
  );
}

export function TransactionSkeleton() {
  const styles = useSkeletonStyles();
  return (
    <View style={styles.card}>
      <Skeleton width={40} height={40} rounded />
      <View style={{ flex: 1, gap: 6, marginHorizontal: 12 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
      <Skeleton width={72} height={16} />
    </View>
  );
}

export function InsightCardSkeleton() {
  const styles = useSkeletonStyles();
  return (
    <View style={[styles.card, { flexDirection: 'column', gap: 8, padding: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Skeleton width={32} height={32} rounded />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="30%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={10} />
      <Skeleton width="80%"  height={10} />
    </View>
  );
}

export function HomeSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function FinanceSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  base: { backgroundColor: colors.surfaceElevated },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
