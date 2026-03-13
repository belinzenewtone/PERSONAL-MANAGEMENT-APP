import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useIsOffline } from '../../hooks/useNetworkStatus';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontWeight, spacing, useAppTheme } from '../../lib/theme';

export function OfflineBanner() {
  const isOffline  = useIsOffline();
  const slideAnim  = useRef(new Animated.Value(-40)).current;
  const { colors } = useAppTheme();
  const styles = createStyles(colors);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue:         isOffline ? 0 : -40,
      useNativeDriver: true,
      speed:           20,
      bounciness:      4,
    }).start();
  }, [isOffline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Ionicons name="cloud-offline-outline" size={14} color={colors.background} />
      <Text style={styles.text}>You're offline — showing cached data</Text>
    </Animated.View>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  banner: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    zIndex:          999,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing.xs,
    backgroundColor: colors.warning,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.background },
});
