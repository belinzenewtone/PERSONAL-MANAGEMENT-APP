import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { fontSize, fontWeight, spacing, useAppTheme } from '../../../lib/theme';
import type { AppUpdateRecord } from '@personal-os/types';

export function AppUpdatePrompt({
  update,
  onDismiss,
  onOpenStore,
}: {
  update: AppUpdateRecord | null;
  onDismiss: () => void;
  onOpenStore: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!update) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <GlassCard style={styles.card} tone="accent" padding="lg">
          <Text style={styles.title}>{update.title || 'Update available'}</Text>
          <Text style={styles.body}>
            {update.message || 'A newer app build is available with improvements and important fixes.'}
          </Text>
          <View style={styles.actions}>
            {!update.is_force && <Button label="Later" variant="secondary" onPress={onDismiss} size="sm" />}
            <Button label="Update" onPress={onOpenStore} size="sm" />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', gap: spacing.sm },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  body: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
});
