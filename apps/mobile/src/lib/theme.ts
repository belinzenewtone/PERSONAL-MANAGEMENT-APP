import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { usePreferencesStore } from '../store/preferences.store';

export const sharedColors = {
  accent: '#2f80ff',
  accentLight: '#74b3ff',
  accentDark: '#1662d4',
  accentSoft: 'rgba(47, 128, 255, 0.16)',
  glowBlue: 'rgba(77, 154, 255, 0.24)',
  glowTeal: 'rgba(38, 196, 182, 0.18)',
  glowIndigo: 'rgba(132, 104, 255, 0.16)',
  teal: '#26c4b6',
  tealLight: '#66ddd0',
  indigo: '#8b6dff',
  amber: '#f4a838',
  amberSoft: 'rgba(244, 168, 56, 0.16)',
  rose: '#ef5b67',
  successSoft: 'rgba(31, 199, 123, 0.18)',
  success: '#1fc77b',
  warning: '#f4a838',
  danger: '#ef5b67',
  info: '#3f8cff',
  work: '#4f8cff',
  growth: '#8b6dff',
  personal: '#2dcf91',
  bill: '#f39a4d',
  low: '#2dcf91',
  medium: '#f4a838',
  high: '#ef5b67',
  muted: '#74839a',
} as const;

export const darkColors = {
  background: '#04070f',
  surface: 'rgba(16, 23, 38, 0.76)',
  surfaceElevated: 'rgba(20, 30, 50, 0.86)',
  surfaceMuted: 'rgba(14, 20, 34, 0.78)',
  surfaceAccent: 'rgba(14, 44, 84, 0.82)',
  surfaceAccentStrong: 'rgba(28, 82, 170, 0.24)',
  surfaceAccentAlt: 'rgba(21, 67, 101, 0.74)',
  surfaceWarm: 'rgba(60, 42, 18, 0.42)',
  surfaceSuccess: 'rgba(14, 58, 40, 0.4)',
  surfaceSoft: 'rgba(255, 255, 255, 0.035)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  overlay: 'rgba(4, 8, 18, 0.64)',
  shadowDark: 'rgba(0, 0, 0, 0.42)',
  textPrimary: '#f7fbff',
  textSecondary: '#a8b5c9',
  textMuted: '#74839a',
  ...sharedColors,
} as const;

export const lightColors = {
  background: '#f3f8ff',
  surface: 'rgba(255, 255, 255, 0.82)',
  surfaceElevated: 'rgba(255, 255, 255, 0.92)',
  surfaceMuted: 'rgba(237, 244, 255, 0.92)',
  surfaceAccent: 'rgba(227, 239, 255, 0.96)',
  surfaceAccentStrong: 'rgba(47, 128, 255, 0.12)',
  surfaceAccentAlt: 'rgba(215, 236, 255, 0.94)',
  surfaceWarm: 'rgba(255, 247, 233, 0.9)',
  surfaceSuccess: 'rgba(230, 251, 240, 0.95)',
  surfaceSoft: 'rgba(17, 24, 39, 0.035)',
  border: 'rgba(25, 44, 79, 0.08)',
  borderStrong: 'rgba(25, 44, 79, 0.13)',
  overlay: 'rgba(255, 255, 255, 0.14)',
  shadowDark: 'rgba(17, 24, 39, 0.12)',
  textPrimary: '#122033',
  textSecondary: '#49607e',
  textMuted: '#74839a',
  ...sharedColors,
} as const;

export type ThemeColors = typeof darkColors;
export const colors = darkColors;
export type ThemeMode = 'dark' | 'light' | 'system';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const controlHeights = {
  chipSm: 32,
  chipMd: 38,
  chipLg: 46,
  buttonSm: 38,
  buttonMd: 46,
  buttonLg: 54,
  input: 40,
} as const;

export const cardPadding = {
  sm: 14,
  md: 18,
  lg: 22,
  inner: 18,
} as const;

export const appLayout = {
  pageHorizontal: spacing.lg,
  pageTop: spacing.md,
  pageBottom: 172,
  sectionGap: 20,
  cardGap: spacing.md,
  listGap: spacing.sm,
  headerGap: spacing.md,
  fabBottom: 132,
} as const;

// ─── Coherent design tokens ───────────────────────────────────────────────────

/** Typography scale with semantic names */
export const textStyles = {
  pageTitle: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  sectionTitle: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  cardTitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  bodyMd: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySm: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  eyebrow: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  metaText: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  amount: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  amountLg: { fontSize: 30, fontWeight: '700' as const, lineHeight: 36 },
} as const;

/** Category colors — the single source of truth for work/growth/personal */
export const categoryColors = {
  work: '#4f8cff',
  growth: '#8b6dff',
  personal: '#2dcf91',
  bill: '#f39a4d',
} as const;

/** Priority colors */
export const priorityColors = {
  low: '#2dcf91',
  medium: '#f4a838',
  high: '#ef5b67',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 21,
  xxl: 26,
  xxxl: 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export function resolveThemeMode(mode: ThemeMode, systemScheme: string | null | undefined) {
  if (mode === 'system') {
    return systemScheme === 'light' ? 'light' : 'dark';
  }
  return mode;
}

export function useAppTheme() {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const systemScheme = useColorScheme();
  const resolvedMode = resolveThemeMode(themeMode, systemScheme);
  const activeColors = resolvedMode === 'light' ? lightColors : darkColors;

  return useMemo(
    () => ({
      colors: activeColors,
      isDark: resolvedMode === 'dark',
      themeMode,
      resolvedMode,
    }),
    [activeColors, resolvedMode, themeMode],
  );
}
