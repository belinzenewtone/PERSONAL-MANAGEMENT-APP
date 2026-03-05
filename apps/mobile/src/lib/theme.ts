export const colors = {
  // Base
  background: '#0a0a0c', // Deep near-black for better glass contrast
  surface: 'rgba(25, 25, 30, 0.7)', // Translucent surface by default
  surfaceElevated: 'rgba(35, 35, 45, 0.8)',
  border: 'rgba(255, 255, 255, 0.1)',

  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Accent
  accent: '#1877F2', // Nexus Blue
  accentLight: '#4D9AFF',
  accentDark: '#0D5BC4',

  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',

  // Category colors
  work: '#3b82f6',    // Blue
  growth: '#a855f7',  // Purple
  personal: '#22c55e', // Green
  bill: '#f59e0b',    // Orange

  // Task priority
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
