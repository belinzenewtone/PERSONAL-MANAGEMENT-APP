import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { cardPadding, radius, useAppTheme } from '../../lib/theme';

type GlassTone = 'standard' | 'accent' | 'muted';
type GlassPadding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  className?: string;
  tone?: GlassTone;
  accentColor?: string;
  padding?: GlassPadding;
}

/**
 * Frosted card — iOS gets real blur, Android gets a solid surface that
 * correctly reflects the tone hierarchy (standard / accent / muted).
 * Each tone has its own distinct background so cards have visual hierarchy
 * on Android just like on iOS.
 */
export function GlassCard({
  children,
  style,
  intensity = 28,
  className,
  tone = 'standard',
  accentColor,
  padding = 'none',
}: GlassCardProps) {
  const { colors, isDark } = useAppTheme();
  const resolvedAccentColor = accentColor ?? colors.accent;

  // Tone-based surface — same values used on both platforms.
  // iOS: these become the BlurView tint overlay.
  // Android: these become the solid background.
  const toneStyle: ViewStyle = tone === 'accent'
    ? {
        backgroundColor: colors.surfaceAccent,
        borderColor: `${resolvedAccentColor}44`,
        shadowColor: resolvedAccentColor,
      }
    : tone === 'muted'
    ? {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        shadowColor: colors.shadowDark,
      }
    : {
        // 'standard' — most prominent surface, clearly distinct from muted
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.borderStrong,
        shadowColor: colors.shadowDark,
      };

  const paddingStyle = padding === 'none' ? null : { padding: cardPadding[padding] };

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.base, toneStyle, paddingStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android: solid surface with a subtle inner highlight on the top edge
  // to simulate depth without blur. Each tone maps to a distinct background
  // so the card hierarchy is visible.
  const androidBg = tone === 'accent'
    ? isDark ? 'rgba(14, 44, 84, 0.95)' : 'rgba(227, 239, 255, 0.98)'
    : tone === 'muted'
    ? isDark ? 'rgba(14, 20, 34, 0.95)' : 'rgba(237, 244, 255, 0.98)'
    : isDark ? 'rgba(20, 30, 50, 0.98)' : 'rgba(255, 255, 255, 0.98)';

  return (
    <View style={[styles.base, styles.androidBase, toneStyle, { backgroundColor: androidBg }, paddingStyle, style]}>
      {/* Subtle top-edge highlight line for depth */}
      <View style={styles.androidHighlight} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  androidBase: {
    // Slightly higher elevation on Android for stronger shadow
    elevation: 6,
  },
  androidHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },
});
