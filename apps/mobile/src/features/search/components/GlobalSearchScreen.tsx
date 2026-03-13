import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/auth.store';
import { EmptyState } from '../../../components/ui/EmptyState';
import { GlassCard } from '../../../components/ui/GlassCard';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { PageShell } from '../../../components/ui/PageShell';
import { TextInput } from '../../../components/ui/TextInput';
import { fontSize, fontWeight, spacing, useAppTheme } from '../../../lib/theme';
import { searchService } from '../search.service';

export function GlobalSearchScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const userId = useAuthStore((state) => state.user?.id);
  const [query, setQuery] = useState('');

  const { data: sections = [] } = useQuery({
    queryKey: ['workspace-search', userId, query],
    queryFn: () => searchService.searchWorkspace(userId!, query),
    enabled: !!userId && query.trim().length > 1,
    staleTime: 1000 * 30,
  });

  return (
    <SafeAreaView style={styles.container}>
      <PageShell accentColor={colors.glowTeal}>
        <PageHeader
          eyebrow="Tool Hub"
          title="Global Search"
          subtitle="Search tasks, finance, calendar, and recurring templates in one place."
          leading={<IconPillButton onPress={() => router.back()} icon={<Ionicons name="arrow-back" size={16} color={colors.accentLight} />} />}
        />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your workspace..."
          containerStyle={styles.searchField}
        />

        {query.trim().length <= 1 ? (
          <EmptyState
            icon="search-outline"
            title="Start typing to search"
            subtitle="Try a merchant, task title, event name, or recurring item."
          />
        ) : sections.length === 0 ? (
          <EmptyState
            icon="file-tray-outline"
            title="No matching results"
            subtitle="Try a broader keyword or search from another feature."
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.results}>
            {sections.map((section) => (
              <GlassCard key={section.title} style={styles.sectionCard} padding="md">
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.resultRow, index > 0 && styles.resultBorder]}
                    onPress={() => router.push(item.route as never)}
                  >
                    <View style={styles.resultCopy}>
                      <Text style={styles.resultTitle}>{item.title}</Text>
                      <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </GlassCard>
            ))}
          </ScrollView>
        )}
      </PageShell>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchField: { marginBottom: spacing.sm },
  results: { gap: spacing.md, paddingBottom: 140 },
  sectionCard: { gap: spacing.xs },
  sectionTitle: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  resultBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  resultCopy: { flex: 1, paddingRight: spacing.md },
  resultTitle: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  resultSubtitle: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2, textTransform: 'capitalize' },
});
