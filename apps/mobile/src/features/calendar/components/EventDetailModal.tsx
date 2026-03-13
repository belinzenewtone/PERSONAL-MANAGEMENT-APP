import React, { useMemo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { spacing, fontSize, fontWeight, radius, useAppTheme } from '../../../lib/theme';
import { EVENT_TYPE_CONFIG } from './calendar-screen.shared';
import type { CalendarEvent } from '@personal-os/types';

export function EventDetailModal({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Event Details</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editBtn}>Edit</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={[styles.eventTypeHeader, { backgroundColor: `${config.color}22` }]}>
            <View style={[styles.eventTypeIconWrap, { backgroundColor: `${config.color}18` }]}>
              <Ionicons name={config.icon as never} size={24} color={config.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventDetailTitle} numberOfLines={3}>{event.title}</Text>
              <Text style={[styles.eventDetailType, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <GlassCard>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Starts</Text>
              <Text style={styles.detailValue}>{format(parseISO(event.start_time), 'EEE, MMM d · h:mm a')}</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailLabel}>Ends</Text>
              <Text style={styles.detailValue}>{format(parseISO(event.end_time), 'EEE, MMM d · h:mm a')}</Text>
            </View>
          </GlassCard>
          <Button label="Delete Event" onPress={onDelete} variant="danger" fullWidth style={styles.deleteButton} />
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
  editBtn: { fontSize: fontSize.md, color: colors.accentLight, fontWeight: fontWeight.semibold },
  modalScroll: { padding: spacing.lg, gap: spacing.md },
  eventTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  eventTypeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDetailTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  eventDetailType: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md },
  detailLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: fontWeight.bold, width: 48, paddingTop: 2 },
  detailValue: { flex: 1, fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: fontWeight.medium, flexWrap: 'wrap' },
  deleteButton: { marginTop: spacing.lg },
});
