import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { appLayout, spacing, useAppTheme } from '../../lib/theme';
import { durations, easeOut } from '../../lib/animation';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageShellProps {
  children: React.ReactNode;
  accentColor?: string;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

export function PageShell({
  children,
  accentColor,
  scroll = true,
  contentContainerStyle,
  style,
}: PageShellProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reducedMotion = useReducedMotion();
  const resolvedAccentColor = accentColor ?? colors.glowBlue;
  const opacity   = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 8)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: durations.standard, easing: easeOut, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: durations.standard, easing: easeOut, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, reducedMotion]);

  const animatedContent = (
    <Animated.View
      style={[
        scroll ? styles.revealScroll : styles.revealStatic,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );

  const content = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      style={styles.flex}
    >
      {animatedContent}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, contentContainerStyle]}>{animatedContent}</View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.topGlow, { backgroundColor: resolvedAccentColor }]} pointerEvents="none" />
      <View style={styles.bottomGlow} pointerEvents="none" />
      <View style={styles.overlay} pointerEvents="none" />
      {content}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  flex: { flex: 1 },
  revealScroll: { gap: spacing.xs },
  revealStatic: { flex: 1, gap: spacing.xs, minHeight: 0 },
  scrollContent: {
    paddingHorizontal: appLayout.pageHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: appLayout.pageBottom,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: appLayout.pageHorizontal,
    paddingTop: appLayout.pageTop,
    paddingBottom: appLayout.pageTop,
  },
  topGlow: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: -150,
    right: -50,
    opacity: 0.24,
  },
  bottomGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    bottom: -130,
    left: -80,
    backgroundColor: colors.glowTeal,
    opacity: 0.11,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    opacity: 0.22,
  },
});
