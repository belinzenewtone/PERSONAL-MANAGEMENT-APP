import { toast } from '../../../components/ui/Toast';
import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../../../components/ui/Button';
import { Capsule } from '../../../components/ui/Capsule';
import { TextInput } from '../../../components/ui/TextInput';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from '../finance.constants';
import { useCreateTransaction, useUpdateTransaction } from '../finance.hooks';
import { merchantLearningService } from '../merchant-learning.service';
import { SOURCES, toLocalDateString, txSchema, TxFormInput } from './finance-screen.shared';
import type { Transaction, TransactionType } from '@personal-os/types';
import { useAuthStore } from '../../../store/auth.store';
import { successTap } from '../../../lib/feedback';

interface FinanceTransactionFormModalProps {
  visible: boolean;
  editTx?: Transaction | null;
  onClose: () => void;
}

export function FinanceTransactionFormModal({
  visible,
  editTx,
  onClose,
}: FinanceTransactionFormModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const isEditing = !!editTx;
  const userId = useAuthStore((state) => state.user?.id);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TxFormInput>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: editTx?.type ?? 'expense',
      amount: editTx ? String(editTx.amount) : '',
      category: editTx?.category ?? '',
      description: editTx?.description ?? '',
      source: editTx?.source ?? 'mpesa',
      mpesa_code: editTx?.mpesa_code ?? '',
      transaction_date: toLocalDateString(),
    },
  });

  const txType = watch('type');
  const source = watch('source');
  const category = watch('category');
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (data: TxFormInput) => {
    const payload = {
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      description: data.description || null,
      source: data.source,
      mpesa_code: data.mpesa_code || null,
      auto_imported: false,
      transaction_date: new Date(data.transaction_date).toISOString(),
    };

    try {
      if (isEditing && editTx) {
        await updateTx.mutateAsync({ id: editTx.id, ...payload });
        toast.success('Transaction updated');
      } else {
        await createTx.mutateAsync(payload);
        toast.success('Transaction added');
      }
      if (userId && data.source === 'mpesa') {
        await merchantLearningService.learnCategory(userId, data.description || data.mpesa_code || null, data.category).catch(() => {});
      }
      successTap();
      reset();
      onClose();
    } catch {
      toast.error(isEditing ? 'Could not update transaction' : 'Could not add transaction');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Transaction' : 'New Transaction'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <View style={styles.typeToggle}>
            {(['expense', 'income'] as TransactionType[]).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setValue('type', type);
                  setValue('category', '');
                }}
                style={[
                  styles.typeBtn,
                  txType === type && (type === 'expense'
                    ? styles.typeBtnExpenseActive
                    : styles.typeBtnIncomeActive),
                ]} 
              >
                <Text style={[styles.typeBtnText, txType === type && styles.typeBtnTextActive]}>
                  {type === 'expense' ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Amount (KES) *"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.amount?.message}
              />
            )}
          />

          <Text style={styles.fieldLabel}>Category *</Text>
          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const color = CATEGORY_COLORS[cat] ?? colors.textMuted;
              const selected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setValue('category', cat)}
                  style={styles.catChipWrapper}
                >
                  <Capsule
                    label={cat}
                    color={color}
                    variant={selected ? 'subtle' : 'outline'}
                    size="md"
                    style={styles.fullWidthCapsule}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category.message}</Text>}

          <Text style={styles.fieldLabel}>Source</Text>
          <View style={styles.chipRow}>
            {SOURCES.map((item) => (
              <TouchableOpacity
                key={item.value}
                onPress={() => setValue('source', item.value)}
                style={styles.chipWrapper}
              >
                <Capsule
                  label={item.label}
                  color={colors.accent}
                  variant={source === item.value ? 'subtle' : 'outline'}
                  size="md"
                  icon={<Text style={styles.chipIcon}>{item.icon}</Text>}
                />
              </TouchableOpacity>
            ))}
          </View>

          {source === 'mpesa' && (
            <Controller
              control={control}
              name="mpesa_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="M-Pesa Code (optional)"
                  placeholder="e.g. RHK2XD..."
                  autoCapitalize="characters"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description (optional)"
                placeholder="What was this for?"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                multiline
                numberOfLines={2}
              />
            )}
          />

          <Button
            label={isEditing ? 'Save Changes' : 'Add Transaction'}
            onPress={handleSubmit(onSubmit)}
            loading={createTx.isPending || updateTx.isPending}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  modalClose: { fontSize: fontSize.lg, color: colors.textSecondary, width: 40 },
  headerSpacer: { width: 40 },
  modalScroll: { padding: spacing.lg, gap: spacing.md },
  typeToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeBtnExpenseActive: { backgroundColor: `${colors.danger}22`, borderColor: colors.danger },
  typeBtnIncomeActive: { backgroundColor: `${colors.success}22`, borderColor: colors.success },
  typeBtnText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  typeBtnTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  catChipWrapper: { marginBottom: spacing.xs },
  fullWidthCapsule: { minWidth: 80 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chipWrapper: { marginBottom: spacing.xs },
  chipIcon: { fontSize: 14, marginRight: 4 },
  errorText: { fontSize: fontSize.xs, color: colors.danger },
  submitButton: { marginTop: spacing.md },
});
