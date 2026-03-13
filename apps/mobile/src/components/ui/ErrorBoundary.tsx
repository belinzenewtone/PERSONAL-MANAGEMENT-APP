import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../lib/theme';
import { captureErrorEvent } from '../../lib/telemetry';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface BoundaryImplProps extends Props {
  styles: ReturnType<typeof createStyles>;
}

class ErrorBoundaryImpl extends React.Component<BoundaryImplProps, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in dev; in production hook into crash reporting
    console.error('[ErrorBoundary]', error.message, info.componentStack);
    captureErrorEvent('react-error-boundary', error, {
      componentStack: info.componentStack ?? null,
    }).catch(() => {});
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    const { styles } = this.props;
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>💥</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error. Your data is safe.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>Dev details</Text>
              <Text style={styles.devText}>{this.state.error.message}</Text>
            </View>
          )}

          <TouchableOpacity onPress={this.reset} style={styles.btn}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

export function ErrorBoundary({ children, fallback }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ErrorBoundaryImpl styles={styles} fallback={fallback}>
      {children}
    </ErrorBoundaryImpl>
  );
}

/** Lightweight section-level boundary — shows inline error instead of full screen */
export function SectionErrorBoundary({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ErrorBoundary
      fallback={(
        <View style={styles.sectionError}>
          <Text style={styles.sectionErrorText}>⚠️  Failed to load this section</Text>
        </View>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: { fontSize: 64 },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  devBox: {
    backgroundColor: `${colors.danger}22`,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  devTitle: {
    fontSize: fontSize.xs,
    color: colors.danger,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  devText: { fontSize: fontSize.xs, color: colors.danger, fontFamily: 'monospace' },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.accentLight}55`,
  },
  btnText: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  sectionError: { padding: spacing.lg, alignItems: 'center' },
  sectionErrorText: { fontSize: fontSize.sm, color: colors.textMuted },
});
