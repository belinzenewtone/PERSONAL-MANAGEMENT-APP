import { toast } from '../../components/ui/Toast';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCommitImport, useImportMpesaSms } from '../../features/finance/sms-import.hooks';
import { checkSmsPermission, requestSmsPermission } from '../../features/finance/sms-import.service';
import type { ParsedMpesaSms } from '../../features/finance/mpesa-parser';
import { spacing, fontSize, fontWeight, useAppTheme } from '../../lib/theme';
import { SmsImportIdleView, SmsImportPreview, SmsImportStatusView } from './SmsImportViews';
import type { SmsImportStep } from './sms-import.shared';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SmsImportModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<SmsImportStep>('idle');
  const [result, setResult] = useState<{ imported: ParsedMpesaSms[]; skipped: number; errors: number } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [daysBack, setDaysBack] = useState(30);
  const [finalCount, setFinalCount] = useState(0);

  const scanMutation = useImportMpesaSms();
  const commitMutation = useCommitImport();

  function confirmPermissionPrompt(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      Alert.alert(
        'Allow SMS import?',
        'To import M-Pesa messages, allow SMS access. You can skip now and enable later.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => finish(false) },
          { text: 'Continue', onPress: () => finish(true) },
        ],
        { cancelable: true, onDismiss: () => finish(false) },
      );
    });
  }

  async function ensureSmsPermissionForImport(): Promise<boolean> {
    const alreadyGranted = await checkSmsPermission();
    if (alreadyGranted) return true;

    const shouldRequest = await confirmPermissionPrompt();
    if (!shouldRequest) return false;

    const granted = await requestSmsPermission();
    if (granted) return true;

    Alert.alert(
      'SMS permission not granted',
      'Import needs SMS access. You can enable READ_SMS permission from system settings.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
      ],
    );
    return false;
  }

  async function handleScan() {
    if (Platform.OS !== 'android') {
      Alert.alert('Android Only', 'SMS auto-import is only available on Android devices.');
      return;
    }

    const hasSmsPermission = await ensureSmsPermissionForImport();
    if (!hasSmsPermission) {
      return;
    }

    setStep('scanning');
    try {
      const res = await scanMutation.mutateAsync({ daysBack });
      setResult({ imported: res.imported, skipped: res.skipped, errors: res.errors.length });
      setSelected(new Set(res.imported.map((item) => item.mpesa_code)));
      setStep('preview');
    } catch (error: any) {
      setStep('idle');
      Alert.alert('Scan Failed', error.message ?? 'Could not read SMS messages.');
    }
  }

  async function handleCommit() {
    if (!result) return;
    const toImport = result.imported.filter((item) => selected.has(item.mpesa_code));
    if (toImport.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one transaction to import.');
      return;
    }

    setStep('importing');
    try {
      await commitMutation.mutateAsync(toImport);
      setFinalCount(toImport.length);
      setStep('done');
      toast.success(`${toImport.length} transaction${toImport.length === 1 ? '' : 's'} imported`);
    } catch (error: any) {
      setStep('preview');
      toast.error(error.message ?? 'Could not save transactions');
    }
  }

  function handleClose() {
    setStep('idle');
    setResult(null);
    setSelected(new Set());
    onClose();
  }

  function toggleSelect(code: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    setSelected(
      selected.size === result.imported.length
        ? new Set()
        : new Set(result.imported.map((item) => item.mpesa_code)),
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>M-Pesa SMS Import</Text>
          <View style={styles.headerSpacer} />
        </View>

        {step === 'idle' && (
          <SmsImportIdleView daysBack={daysBack} onSelectDays={setDaysBack} onScan={handleScan} />
        )}

        {step === 'scanning' && (
          <SmsImportStatusView
            title="Reading M-Pesa messages…"
            subtitle={`Scanning last ${daysBack} days`}
            loading
          />
        )}

        {step === 'preview' && result && (
          result.imported.length === 0 ? (
            <SmsImportStatusView
              icon="checkmark-circle-outline"
              title="All up to date!"
              subtitle="No new M-Pesa transactions found."
              actionLabel="Done"
              onAction={handleClose}
            />
          ) : (
            <SmsImportPreview
              imported={result.imported}
              skipped={result.skipped}
              errors={result.errors}
              selected={selected}
              onToggleAll={toggleAll}
              onToggleSelect={toggleSelect}
              onCommit={handleCommit}
            />
          )
        )}

        {step === 'importing' && (
          <SmsImportStatusView title="Saving transactions…" loading />
        )}

        {step === 'done' && (
          <SmsImportStatusView
            icon="checkmark-circle-outline"
            title={`${finalCount} transaction${finalCount !== 1 ? 's' : ''} imported!`}
            subtitle="Your Finance screen has been updated."
            actionLabel="Done"
            onAction={handleClose}
          />
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  closeBtn: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  headerSpacer: { width: 40 },
});
