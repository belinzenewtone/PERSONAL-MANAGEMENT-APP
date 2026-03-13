import { toast } from '../../../components/ui/Toast';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { fontSize, fontWeight, radius, spacing, useAppTheme } from '../../../lib/theme';
import { useDeleteRecurringTemplate, useMaterializeRecurringTemplates, useRecurringTemplates } from '../recurring.hooks';
import { safeFormatDate } from '../../../lib/date-utils';
import { RecurringTemplateModal } from './RecurringTemplateModal';
import type { RecurringTemplate } from '@personal-os/types';

export function RecurringScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data: templates = [] } = useRecurringTemplates();
  const materialize = useMaterializeRecurringTemplates();
  const deleteTemplate = useDeleteRecurringTemplate();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  function handleDelete(template: RecurringTemplate) {
    Alert.alert('Delete recurring template', `Remove "${template.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate.mutate(template.id, {
        onSuccess: () => toast.success(`"${template.title}" template deleted`),
        onError:   () => toast.error('Could not delete template'),
      }) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Automation"
          title="Recurring"
          subtitle="Templates that create tasks, events, expenses, or income on schedule."
          leading={
            <IconPillButton
              onPress={() => router.back()}
              icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />}
            />
          }
        />

        {/* Compact action row — no hero card overflow */}
        <View style={styles.actionRow}>
          <Button
            label="Run due items"
            onPress={() => materialize.mutate(undefined, {
              onSuccess: () => toast.success('Due items created'),
              onError:   () => toast.error('Could not run due items'),
            })}
            size="sm"
            loading={materialize.isPending}
          />
          <Button
            label="New template"
            onPress={() => { setEditingTemplate(null); setShowModal(true); }}
            size="sm"
            variant="secondary"
          />
        </View>

        {templates.length === 0 ? (
          <EmptyState
            icon="repeat-outline"
            title="No recurring templates yet"
            subtitle="Create one for rent, salary, weekly planning, or recurring study blocks."
            actionLabel="New template"
            onAction={() => {
              setEditingTemplate(null);
              setShowModal(true);
            }}
          />
        ) : (
          templates.map((template) => (
            <GlassCard key={template.id} style={styles.templateCard}>
              <View style={styles.templateTop}>
                <View>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateMeta}>{template.entity_type} · {template.frequency}</Text>
                </View>
                <View style={styles.templateActions}>
                  <TouchableOpacity onPress={() => { setEditingTemplate(template); setShowModal(true); }}>
                    <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(template)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.templateDescription}>{template.description || 'No extra notes'}</Text>
              <Text style={styles.templateNext}>Next run: {safeFormatDate(template.next_run_at, 'MMM d, yyyy · h:mm a')}</Text>
            </GlassCard>
          ))
        )}
      </PageShell>

      <RecurringTemplateModal visible={showModal} template={editingTemplate} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actionRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs },
  templateCard: { gap: spacing.sm },
  templateTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  templateTitle: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  templateMeta: { color: colors.textMuted, fontSize: fontSize.xs, textTransform: 'capitalize', marginTop: 2 },
  templateActions: { flexDirection: 'row', gap: spacing.md },
  templateDescription: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  templateNext: {
    color: colors.accentLight,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
});
