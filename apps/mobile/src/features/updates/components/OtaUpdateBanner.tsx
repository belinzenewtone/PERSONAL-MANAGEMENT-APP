import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated, Modal, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OtaUpdateState =
  | { phase: 'idle' }
  | { phase: 'available'; sizeBytes: number | null; changelog: string[] | null }
  | { phase: 'downloading'; progress: number; totalBytes: number | null; downloadedBytes: number }
  | { phase: 'ready' }
  | { phase: 'error'; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPct(progress: number): string {
  return `${Math.round(progress * 100)}%`;
}

// ─── OtaUpdateBanner ──────────────────────────────────────────────────────────

interface OtaUpdateBannerProps {
  state: OtaUpdateState;
  appName?: string;
  onAccept: () => void;
  onDismiss: () => void;
}

export function OtaUpdateBanner({
  state,
  appName = 'Personal OS',
  onAccept,
  onDismiss,
}: OtaUpdateBannerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const barAnim     = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const visible = state.phase !== 'idle';

  // Pop-in / fade-out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180,              useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Progress bar
  useEffect(() => {
    const target =
      state.phase === 'downloading' ? state.progress :
      state.phase === 'ready'       ? 1 : 0;
    Animated.timing(barAnim, { toValue: target, duration: 300, useNativeDriver: false }).start();
  }, [state, barAnim]);

  if (!visible) return null;

  const isAvailable   = state.phase === 'available';
  const isDownloading = state.phase === 'downloading';
  const isReady       = state.phase === 'ready';
  const isError       = state.phase === 'error';

  const anyState      = state as any;
  const changelog     = anyState.changelog as string[] | null | undefined;
  const sizeBytes     = anyState.sizeBytes  as number  | null | undefined;
  const showProgress  = isDownloading || isReady;
  const barColor      = isError ? colors.danger : isReady ? colors.success : colors.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={isDownloading ? undefined : onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Tap-away to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={isDownloading ? undefined : onDismiss}
        />

        <Animated.View style={[
          styles.card,
          { backgroundColor: colors.surfaceElevated, transform: [{ scale: scaleAnim }] },
        ]}>

          {/* ── Header ──────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={[styles.appIcon, { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}44` }]}>
              <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Update {appName}
            </Text>
            {!isDownloading && (
              <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <View style={[styles.closeBadge, { backgroundColor: colors.surfaceSoft }]}>
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Description ─────────────────────────────────── */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            A newer update of the app is available. Please update now
            {isAvailable && sizeBytes ? ` (${formatBytes(sizeBytes)})` : ''}.
          </Text>

          {/* ── Changelog — numbered exactly like Sportzfy ──── */}
          {changelog && changelog.length > 0 && (
            <View style={styles.changelog}>
              {changelog.map((item, i) => (
                <Text key={i} style={[styles.changelogItem, { color: colors.textPrimary }]}>
                  {i + 1}. {item}
                </Text>
              ))}
            </View>
          )}

          {/* ── Progress bar + labels ────────────────────────── */}
          {showProgress && (
            <View style={styles.progressSection}>
              <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      backgroundColor: barColor,
                      width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressPct, { color: colors.accent }]}>
                  {isReady ? '100%' : formatPct((state as any).progress ?? 0)}
                </Text>
                {isDownloading && (
                  <Text style={[styles.progressSize, { color: colors.textMuted }]}>
                    {formatBytes((state as any).downloadedBytes)}
                    {(state as any).totalBytes ? ` / ${formatBytes((state as any).totalBytes)}` : ''}
                  </Text>
                )}
                {isReady && (
                  <Text style={[styles.progressSize, { color: colors.success }]}>✓ Ready to install</Text>
                )}
              </View>
            </View>
          )}

          {/* ── Error ───────────────────────────────────────── */}
          {isError && (
            <View style={[styles.errorBox, { backgroundColor: `${colors.danger}18`, borderColor: `${colors.danger}33` }]}>
              <Ionicons name="warning-outline" size={14} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {(state as any).message ?? 'Download failed. Please try again.'}
              </Text>
            </View>
          )}

          {/* ── Buttons — Cancel (outlined) | Action (dark pill) ─ */}
          <View style={styles.actions}>
            {!isDownloading && (
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.accent }]}
                onPress={onDismiss}
                activeOpacity={0.75}
              >
                <Text style={[styles.cancelText, { color: colors.accent }]}>
                  {isReady ? 'LATER' : 'CANCEL'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
                isDownloading && { flex: 2 },
              ]}
              onPress={onAccept}
              activeOpacity={0.75}
              disabled={isDownloading}
            >
              <Text style={[styles.primaryText, { color: isDownloading ? colors.textMuted : colors.textPrimary }]}>
                {isDownloading ? 'DOWNLOADING…'
                  : isReady    ? 'RESTART NOW'
                  : isError    ? 'RETRY'
                  :              'UPDATE NOW'}
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── useOtaUpdate ─────────────────────────────────────────────────────────────

export function useOtaUpdate(opts?: { sizeBytes?: number | null; changelog?: string[] | null }) {
  const [state, setState] = useState<OtaUpdateState>({ phase: 'idle' });

  function showAvailable() {
    setState({ phase: 'available', sizeBytes: opts?.sizeBytes ?? null, changelog: opts?.changelog ?? null });
  }

  function dismiss() { setState({ phase: 'idle' }); }

  async function startDownload() {
    setState({ phase: 'downloading', progress: 0, totalBytes: opts?.sizeBytes ?? null, downloadedBytes: 0 });
    try {
      await (Updates as any).fetchUpdateAsync({
        onProgress: (e: { totalBytesExpected: number; totalBytesWritten: number }) => {
          const total    = e.totalBytesExpected ?? 0;
          const written  = e.totalBytesWritten  ?? 0;
          setState({
            phase: 'downloading',
            progress: total > 0 ? written / total : 0,
            totalBytes: total > 0 ? total : opts?.sizeBytes ?? null,
            downloadedBytes: written,
          });
        },
      });
      setState({ phase: 'ready' });
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Download failed' });
    }
  }

  async function applyUpdate() {
    if (state.phase === 'ready') await Updates.reloadAsync();
    else if (state.phase === 'error') await startDownload();
  }

  return { state, showAvailable, startDownload, dismiss, applyUpdate };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  header:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  appIcon:    { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:      { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  closeBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  description:{ fontSize: fontSize.sm, lineHeight: 20 },
  changelog:  { gap: 5 },
  changelogItem: { fontSize: fontSize.sm, lineHeight: 20 },
  progressSection: { gap: 6 },
  track:      { height: 6, borderRadius: radius.full, overflow: 'hidden' },
  bar:        { height: '100%', borderRadius: radius.full },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct:  { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  progressSize: { fontSize: fontSize.xs },
  errorBox:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  errorText:  { fontSize: fontSize.xs, flex: 1 },
  actions:    { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn:  { flex: 1, height: 48, borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  primaryBtn: { flex: 1, height: 48, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryText:{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
});
