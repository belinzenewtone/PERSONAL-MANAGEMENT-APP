import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { TextInput } from '../../../components/ui/TextInput';
import { spacing, fontSize, fontWeight, useAppTheme } from '../../../lib/theme';

interface FinanceBudgetModalProps {
  visible: boolean;
  category: string;
  currentAmount?: number;
  onClose: () => void;
  onSave: (amount: number) => void;
}

export function FinanceBudgetModal({
  visible,
  category,
  currentAmount,
  onClose,
  onSave,
}: FinanceBudgetModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [amount, setAmount] = useState(currentAmount ? String(currentAmount) : '');

  useEffect(() => {
    setAmount(currentAmount ? String(currentAmount) : '');
  }, [currentAmount, category, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={onClose}>
        <GlassCard style={styles.content}>
          <Text style={styles.modalTitle}>Set Budget: {category}</Text>
          <TextInput
            label="Monthly Limit (KES)"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} style={styles.actionButton} />
            <Button label="Save" onPress={() => onSave(Number(amount))} style={styles.actionButton} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: `${colors.background}cc`,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: { width: '100%', padding: spacing.lg, gap: spacing.md },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionButton: { flex: 1 },
});
