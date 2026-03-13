import React, { useMemo } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { ParsedMpesaSms } from '../../features/finance/mpesa-parser';
import { CATEGORY_COLORS } from '../../features/finance/finance.constants';
import { Button } from '../ui/Button';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../lib/theme';
import { fmtCurrency, KIND_ICON } from './sms-import.shared';

function useSmsImportStyles() {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

export function SmsImportIdleView({
  daysBack,
  onSelectDays,
  onScan,
}: {
  daysBack: number;
  onSelectDays: (days: number) => void;
  onScan: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useSmsImportStyles();
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.heroWrap}>
        <Ionicons name="chatbox-ellipses-outline" size={46} color={colors.accentLight} />
        <Text style={styles.heroTitle}>Scan M-Pesa Messages</Text>
        <Text style={styles.heroSubtitle}>
          Your M-Pesa SMS messages will be read locally on your device, parsed,
          and imported as transactions. No raw SMS data is sent to any server.
        </Text>
      </View>

      {Platform.OS !== 'android' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>SMS auto-import is available on Android only.</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What gets imported?</Text>
        {[
          'Money received',
          'Sent to contacts',
          'Buy Goods payments',
          'Paybill payments',
          'Airtime purchases',
          'Cash withdrawals',
        ].map((line) => (
          <Text key={line} style={styles.infoLine}>{line}</Text>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Scan how far back?</Text>
      <View style={styles.daysRow}>
        {[7, 14, 30, 60, 90].map((days) => (
          <TouchableOpacity
            key={days}
            onPress={() => onSelectDays(days)}
            style={[styles.dayChip, daysBack === days && styles.dayChipActive]}
          >
            <Text style={[styles.dayChipText, daysBack === days && styles.dayChipTextActive]}>{days}d</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        label={`Scan Last ${daysBack} Days`}
        onPress={onScan}
        fullWidth
        size="lg"
        disabled={Platform.OS !== 'android'}
        style={styles.scanButton}
      />
    </ScrollView>
  );
}

export function SmsImportStatusView({
  icon,
  title,
  subtitle,
  loading,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useSmsImportStyles();
  return (
    <View style={styles.centered}>
      {loading ? <ActivityIndicator color={colors.accent} size="large" /> : <Ionicons name={(icon as any) || 'checkmark-circle-outline'} size={44} color={colors.accentLight} />}
      <Text style={styles.scanningText}>{title}</Text>
      {subtitle ? <Text style={styles.scanningSubtext}>{subtitle}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.statusButton} size="lg" /> : null}
    </View>
  );
}

export function SmsImportPreview({
  imported,
  skipped,
  errors,
  selected,
  onToggleAll,
  onToggleSelect,
  onCommit,
}: {
  imported: ParsedMpesaSms[];
  skipped: number;
  errors: number;
  selected: Set<string>;
  onToggleAll: () => void;
  onToggleSelect: (code: string) => void;
  onCommit: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useSmsImportStyles();
  return (
    <>
      <View style={styles.previewSummary}>
        <View style={styles.previewStat}>
          <Text style={styles.previewStatVal}>{imported.length}</Text>
          <Text style={styles.previewStatLabel}>New</Text>
        </View>
        <View style={styles.previewStat}>
          <Text style={[styles.previewStatVal, styles.previewStatMuted]}>{skipped}</Text>
          <Text style={styles.previewStatLabel}>Already imported</Text>
        </View>
        <View style={styles.previewStat}>
          <Text style={[styles.previewStatVal, styles.previewStatWarning]}>{errors}</Text>
          <Text style={styles.previewStatLabel}>Parse errors</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onToggleAll} style={styles.selectAll}>
        <View style={[styles.checkbox, selected.size === imported.length && styles.checkboxChecked]}>
          {selected.size === imported.length && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.selectAllText}>
          {selected.size === imported.length ? 'Deselect all' : 'Select all'} ({imported.length})
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {imported.map((tx) => {
          const isSelected = selected.has(tx.mpesa_code);
          const categoryColor = CATEGORY_COLORS[tx.category] ?? colors.textMuted;
          return (
            <TouchableOpacity
              key={tx.mpesa_code}
              onPress={() => onToggleSelect(tx.mpesa_code)}
              style={[styles.txRow, isSelected && styles.txRowSelected]}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={[styles.txKindIcon, { backgroundColor: `${categoryColor}22` }]}>
                <Ionicons name={(KIND_ICON[tx.kind] ?? 'card-outline') as any} size={18} color={categoryColor} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                <Text style={styles.txMeta}>{tx.mpesa_code}  ·  {format(tx.date, 'MMM d, h:mm a')}</Text>
                <Text style={styles.txCat}>{tx.category}</Text>
              </View>
              <Text style={[styles.txAmount, tx.transaction_type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                {tx.transaction_type === 'income' ? '+' : '-'}{fmtCurrency(tx.amount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.commitBar}>
        <Button
          label={`Import ${selected.size} Transaction${selected.size !== 1 ? 's' : ''}`}
          onPress={onCommit}
          disabled={selected.size === 0}
          fullWidth
          size="lg"
        />
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  heroWrap: { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  heroIcon: { fontSize: 56 },
  heroTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  heroSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  warningCard: {
    backgroundColor: `${colors.warning}22`,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warningText: { color: colors.warning, fontSize: fontSize.sm },
  infoCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 6 },
  infoTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  infoLine: { fontSize: fontSize.sm, color: colors.textSecondary },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  daysRow: { flexDirection: 'row', gap: spacing.sm },
  dayChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayChipText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  dayChipTextActive: { color: colors.textPrimary },
  scanButton: { marginTop: spacing.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  statusButton: { marginTop: spacing.xl },
  scanningText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  scanningSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  previewSummary: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  previewStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  previewStatVal: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.accent },
  previewStatMuted: { color: colors.textMuted },
  previewStatWarning: { color: colors.warning },
  previewStatLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  selectAll: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  selectAllText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  list: { flex: 1 },
  listContent: { paddingBottom: 100 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: `${colors.border}55` },
  txRowSelected: { backgroundColor: `${colors.accent}0d` },
  checkbox: { width: 20, height: 20, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.textPrimary, fontSize: 12, fontWeight: fontWeight.bold },
  txKindIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txDesc: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  txMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  txCat: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  txAmount: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  incomeAmount: { color: colors.success },
  expenseAmount: { color: colors.textPrimary },
  commitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
