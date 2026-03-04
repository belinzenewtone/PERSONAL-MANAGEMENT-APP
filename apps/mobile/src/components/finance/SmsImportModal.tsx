import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { format } from 'date-fns';
import { useImportMpesaSms, useCommitImport } from '../../features/finance/sms-import.hooks';
import { ParsedMpesaSms } from '../../features/finance/mpesa-parser';
import { CATEGORY_COLORS } from '../../features/finance/finance.constants';
import { Button } from '../ui/Button';
import { colors, spacing, fontSize, fontWeight, radius } from '../../lib/theme';

const fmt = (n: number) =>
  'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const KIND_ICON: Record<string, string> = {
  received:  '📥',
  deposit:   '📥',
  sent:      '📤',
  buy_goods: '🛒',
  paybill:   '🏠',
  airtime:   '📱',
  withdraw:  '💵',
  reversal:  '↩️',
  unknown:   '❓',
};

type Step = 'idle' | 'scanning' | 'preview' | 'importing' | 'done';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export function SmsImportModal({ visible, onClose }: Props) {
  const [step, setStep]           = useState<Step>('idle');
  const [result, setResult]       = useState<{ imported: ParsedMpesaSms[]; skipped: number; errors: number } | null>(null);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [daysBack, setDaysBack]   = useState(30);
  const [finalCount, setFinalCount] = useState(0);

  const scanMutation   = useImportMpesaSms();
  const commitMutation = useCommitImport();

  const handleScan = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'SMS auto-import is only available on Android devices.');
      return;
    }
    setStep('scanning');
    try {
      const res = await scanMutation.mutateAsync({ daysBack });
      setResult({ imported: res.imported, skipped: res.skipped, errors: res.errors.length });
      // Pre-select all
      setSelected(new Set(res.imported.map((p) => p.mpesa_code)));
      setStep('preview');
    } catch (err: any) {
      setStep('idle');
      Alert.alert('Scan Failed', err.message ?? 'Could not read SMS messages.');
    }
  };

  const handleCommit = async () => {
    if (!result) return;
    const toImport = result.imported.filter((p) => selected.has(p.mpesa_code));
    if (toImport.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one transaction to import.');
      return;
    }
    setStep('importing');
    try {
      await commitMutation.mutateAsync(toImport);
      setFinalCount(toImport.length);
      setStep('done');
    } catch (err: any) {
      setStep('preview');
      Alert.alert('Import Failed', err.message ?? 'Could not save transactions.');
    }
  };

  const handleClose = () => {
    setStep('idle');
    setResult(null);
    setSelected(new Set());
    onClose();
  };

  const toggleSelect = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleAll = () => {
    if (!result) return;
    if (selected.size === result.imported.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.imported.map((p) => p.mpesa_code)));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>M-Pesa SMS Import</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── IDLE ── */}
        {step === 'idle' && (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.heroWrap}>
              <Text style={styles.heroIcon}>📱</Text>
              <Text style={styles.heroTitle}>Scan M-Pesa Messages</Text>
              <Text style={styles.heroSubtitle}>
                Your M-Pesa SMS messages will be read locally on your device,
                parsed, and imported as transactions. No raw SMS data is sent
                to any server.
              </Text>
            </View>

            {Platform.OS !== 'android' && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️  SMS auto-import is available on Android only.
                </Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What gets imported?</Text>
              {['📥 Money received', '📤 Sent to contacts', '🛒 Buy Goods payments',
                '🏠 Paybill payments', '📱 Airtime purchases', '💵 Cash withdrawals',
              ].map((line) => (
                <Text key={line} style={styles.infoLine}>{line}</Text>
              ))}
            </View>

            {/* Days back selector */}
            <Text style={styles.fieldLabel}>Scan how far back?</Text>
            <View style={styles.daysRow}>
              {[7, 14, 30, 60, 90].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDaysBack(d)}
                  style={[styles.dayChip, daysBack === d && styles.dayChipActive]}
                >
                  <Text style={[styles.dayChipText, daysBack === d && styles.dayChipTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label={`Scan Last ${daysBack} Days`}
              onPress={handleScan}
              fullWidth
              size="lg"
              disabled={Platform.OS !== 'android'}
              style={{ marginTop: spacing.lg }}
            />
          </ScrollView>
        )}

        {/* ── SCANNING ── */}
        {step === 'scanning' && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.scanningText}>Reading M-Pesa messages…</Text>
            <Text style={styles.scanningSubtext}>Scanning last {daysBack} days</Text>
          </View>
        )}

        {/* ── PREVIEW ── */}
        {step === 'preview' && result && (
          <>
            {/* Summary bar */}
            <View style={styles.previewSummary}>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatVal}>{result.imported.length}</Text>
                <Text style={styles.previewStatLabel}>New</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatVal, { color: colors.textMuted }]}>{result.skipped}</Text>
                <Text style={styles.previewStatLabel}>Already imported</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatVal, { color: colors.warning }]}>{result.errors}</Text>
                <Text style={styles.previewStatLabel}>Parse errors</Text>
              </View>
            </View>

            {result.imported.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.heroIcon}>✅</Text>
                <Text style={styles.scanningText}>All up to date!</Text>
                <Text style={styles.scanningSubtext}>No new M-Pesa transactions found.</Text>
                <Button label="Done" onPress={handleClose} style={{ marginTop: spacing.xl }} />
              </View>
            ) : (
              <>
                {/* Select all toggle */}
                <TouchableOpacity onPress={toggleAll} style={styles.selectAll}>
                  <View style={[styles.checkbox, selected.size === result.imported.length && styles.checkboxChecked]}>
                    {selected.size === result.imported.length && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.selectAllText}>
                    {selected.size === result.imported.length ? 'Deselect all' : 'Select all'} ({result.imported.length})
                  </Text>
                </TouchableOpacity>

                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                  {result.imported.map((tx) => {
                    const isSelected = selected.has(tx.mpesa_code);
                    const catColor   = CATEGORY_COLORS[tx.category] ?? colors.textMuted;
                    return (
                      <TouchableOpacity
                        key={tx.mpesa_code}
                        onPress={() => toggleSelect(tx.mpesa_code)}
                        style={[styles.txRow, isSelected && styles.txRowSelected]}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <View style={[styles.txKindIcon, { backgroundColor: catColor + '22' }]}>
                          <Text>{KIND_ICON[tx.kind] ?? '💳'}</Text>
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                          <Text style={styles.txMeta}>
                            {tx.mpesa_code}  ·  {format(tx.date, 'MMM d, h:mm a')}
                          </Text>
                          <Text style={styles.txCat}>{tx.category}</Text>
                        </View>
                        <Text style={[
                          styles.txAmount,
                          { color: tx.transaction_type === 'income' ? colors.success : colors.textPrimary },
                        ]}>
                          {tx.transaction_type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.commitBar}>
                  <Button
                    label={`Import ${selected.size} Transaction${selected.size !== 1 ? 's' : ''}`}
                    onPress={handleCommit}
                    disabled={selected.size === 0}
                    fullWidth
                    size="lg"
                  />
                </View>
              </>
            )}
          </>
        )}

        {/* ── IMPORTING ── */}
        {step === 'importing' && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.scanningText}>Saving transactions…</Text>
          </View>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <View style={styles.centered}>
            <Text style={[styles.heroIcon, { color: colors.success }]}>✅</Text>
            <Text style={styles.scanningText}>{finalCount} transaction{finalCount !== 1 ? 's' : ''} imported!</Text>
            <Text style={styles.scanningSubtext}>Your Finance screen has been updated.</Text>
            <Button label="Done" onPress={handleClose} style={{ marginTop: spacing.xl }} size="lg" />
          </View>
        )}

      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title:    { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  closeBtn: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },

  body: { padding: spacing.lg, gap: spacing.md },

  heroWrap:     { alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm },
  heroIcon:     { fontSize: 56 },
  heroTitle:    { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  heroSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  warningCard: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  warningText: { color: colors.warning, fontSize: fontSize.sm },

  infoCard:  { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 6 },
  infoTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: 2 },
  infoLine:  { fontSize: fontSize.sm, color: colors.textSecondary },

  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  daysRow:    { flexDirection: 'row', gap: spacing.sm },
  dayChip:    {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  dayChipActive:    { backgroundColor: colors.accent, borderColor: colors.accent },
  dayChipText:      { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  dayChipTextActive: { color: '#fff' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  scanningText:    { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  scanningSubtext: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  previewSummary: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  previewStat:      { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  previewStatVal:   { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.accent },
  previewStatLabel: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  selectAll: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  selectAllText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },

  list:        { flex: 1 },
  listContent: { paddingBottom: 100 },

  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border + '55',
  },
  txRowSelected: { backgroundColor: colors.accent + '0d' },

  checkbox:        { width: 20, height: 20, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark:       { color: '#fff', fontSize: 12, fontWeight: fontWeight.bold },

  txKindIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txInfo:     { flex: 1 },
  txDesc:     { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  txMeta:     { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  txCat:      { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1 },
  txAmount:   { fontSize: fontSize.sm, fontWeight: fontWeight.bold },

  commitBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.md, paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
});
