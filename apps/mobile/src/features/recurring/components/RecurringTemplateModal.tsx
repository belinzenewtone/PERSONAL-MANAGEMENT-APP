import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';
import { toast } from '../../../components/ui/Toast';
import { useCreateRecurringTemplate, useUpdateRecurringTemplate } from '../recurring.hooks';
import type { RecurringEntityType, RecurringFrequency, RecurringTemplate } from '@personal-os/types';

const ENTITY_TYPES: RecurringEntityType[] = ['task', 'event', 'expense', 'income'];
const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function RecurringTemplateModal({ visible, template, onClose }: { visible: boolean; template?: RecurringTemplate | null; onClose: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createTemplate = useCreateRecurringTemplate();
  const updateTemplate = useUpdateRecurringTemplate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<RecurringEntityType>('task');
  const [frequency, setFrequency] = useState<RecurringFrequency>('weekly');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (!template) return;
    setTitle(template.title);
    setDescription(template.description ?? '');
    setEntityType(template.entity_type);
    setFrequency(template.frequency);
    setAmount(String(template.config.amount ?? ''));
    setCategory(String(template.config.category ?? ''));
  }, [template]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      entity_type: entityType,
      frequency,
      start_date: template?.start_date ?? new Date().toISOString(),
      next_run_at: template?.next_run_at ?? new Date().toISOString(),
      active: true,
      config: {
        category,
        amount: amount ? Number(amount) : undefined,
      },
    };

    try {
      if (template) await updateTemplate.mutateAsync({ id: template.id, ...payload });
      else await createTemplate.mutateAsync(payload);
      toast.success(template ? 'Recurring template updated' : 'Recurring template created');
      onClose();
    } catch {
      toast.error(template ? 'Could not update template' : 'Could not create template');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{template ? 'Edit recurring item' : 'New recurring item'}</Text>
          <TextInput label="Title" value={title} onChangeText={setTitle} placeholder="Weekly planning" />
          <TextInput label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes" />
          <TextInput label="Amount (finance only)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" />
          <TextInput label="Category" value={category} onChangeText={setCategory} placeholder="work, transport, salary..." />

          <View style={styles.chipGroup}>
            {ENTITY_TYPES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, entityType === item && styles.chipActive]} onPress={() => setEntityType(item)}>
                <Text style={[styles.chipText, entityType === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chipGroup}>
            {FREQUENCIES.map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, frequency === item && styles.chipActive]} onPress={() => setFrequency(item)}>
                <Text style={[styles.chipText, frequency === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Cancel" onPress={onClose} variant="secondary" size="sm" />
            <Button label={template ? 'Update' : 'Create'} onPress={handleSave} size="sm" loading={createTemplate.isPending || updateTemplate.isPending} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: `${colors.background}cc`, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderStrong,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.xs },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}55` },
  chipText: { color: colors.textSecondary, fontSize: fontSize.sm, textTransform: 'capitalize' },
  chipTextActive: { color: colors.textPrimary, fontWeight: fontWeight.semibold },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
});
