import { toast } from '../../../components/ui/Toast';
import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { useCreateSession } from '../../learning/learning.hooks';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { sessionSchema, SessionInput } from './insights-screen.shared';
import type { LearningSession } from '@personal-os/types';

export function AddSessionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const createSession = useCreateSession();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<SessionInput>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { topic: '', duration_minutes: '', completed: false },
  });

  const onSubmit = async (data: SessionInput) => {
    try {
      await createSession.mutateAsync({
        topic: data.topic,
        duration_minutes: Number(data.duration_minutes),
        completed: data.completed,
      });
      toast.success('Learning session logged');
      reset();
      onClose();
    } catch {
      toast.error('Could not save session');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Log Learning Session</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
          <Controller
            control={control}
            name="topic"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Topic *"
                placeholder="e.g. Python, SQL, Data Engineering"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.topic?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="duration_minutes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Duration (minutes) *"
                placeholder="e.g. 60"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.duration_minutes?.message}
              />
            )}
          />
          <Button
            label="Log Session"
            onPress={handleSubmit(onSubmit)}
            loading={createSession.isPending}
            fullWidth
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

export function SessionItem({
  session,
  onToggle,
  onDelete,
}: {
  session: LearningSession;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hours = Math.floor(session.duration_minutes / 60);
  const minutes = session.duration_minutes % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <TouchableOpacity onLongPress={onDelete} style={styles.sessionRow}>
      <TouchableOpacity onPress={onToggle} style={[styles.sessionCheck, session.completed && styles.sessionCheckDone]}>
        {session.completed && <Ionicons name="checkmark" size={14} color={colors.textPrimary} />}
      </TouchableOpacity>
      <View style={styles.sessionBody}>
        <Text style={[styles.sessionTopic, session.completed && styles.sessionDone]}>{session.topic}</Text>
        <Text style={styles.sessionMeta}>{duration}  ·  {format(parseISO(session.created_at), 'MMM d')}</Text>
      </View>
      <View style={[styles.sessionDurBadge, { backgroundColor: session.completed ? `${colors.success}22` : colors.surfaceSoft }]}>
        <Text style={[styles.sessionDurText, { color: session.completed ? colors.success : colors.textSecondary }]}>{duration}</Text>
      </View>
    </TouchableOpacity>
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
  headerSpacer: { width: 24 },
  modalScroll: { padding: spacing.lg, gap: spacing.md },
  submitButton: { marginTop: spacing.sm },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  sessionCheck: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  sessionCheckDone: { backgroundColor: colors.growth, borderColor: colors.growth },
  sessionBody: { flex: 1 },
  sessionTopic: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  sessionDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  sessionMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  sessionDurBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  sessionDurText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});
