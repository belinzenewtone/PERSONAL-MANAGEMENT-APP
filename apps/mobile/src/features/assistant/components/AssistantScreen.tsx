import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList, InteractionManager, Keyboard,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAiInsights } from '../../insights/insights.hooks';
import { useAssistantConversations, useAssistantMessages, useSendAssistantMessage } from '../assistant.hooks';
import { useTodayTasks } from '../../tasks/tasks.hooks';
import { useBalanceTransactions } from '../../finance/finance.hooks';
import { Capsule } from '../../../components/ui/Capsule';
import { TAB_BAR_HEIGHT } from '../../../components/ui/FloatingTabBar';
import { IconPillButton } from '../../../components/ui/IconPillButton';
import { toast } from '../../../components/ui/Toast';
import { EmptyState } from '../../../components/ui/EmptyState';
import { InsightCardSkeleton, Skeleton } from '../../../components/ui/Skeleton';
import { fontSize, fontWeight, radius, spacing, textStyles, useAppTheme } from '../../../lib/theme';
import { usePreferencesStore } from '../../../store/preferences.store';
import { successTap } from '../../../lib/feedback';

const QUICK_PROMPTS = [
  'What should I focus on today?',
  'Summarize my spending patterns',
  'What is at risk this week?',
  'How am I doing on learning?',
];

export function AssistantScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const { refetch } = useAiInsights({ enabled: false });
  const { data: conversations = [] } = useAssistantConversations();
  const { data: todayTasks = [] } = useTodayTasks();
  const { data: balanceTransactions = [] } = useBalanceTransactions('month');
  const assistantSuggestionsEnabled = usePreferencesStore((s) => s.assistantSuggestionsEnabled);
  const sendMessage = useSendAssistantMessage();

  const [conversationId, setConversationId] = useState<string | undefined>();
  const { data: messages = [], isLoading: loadingMessages } = useAssistantMessages(conversationId);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  // ── Keyboard height — exactly like Flutter's MediaQuery.viewInsetsOf(context).bottom ──
  // We track the raw keyboard height and apply it as padding to the composer
  // (AnimatedPadding equivalent). The composer stays in normal flex flow — no
  // absolute positioning. Flutter pattern: Column > Expanded(ListView) > AnimatedPadding(composer)
  const keyboardInset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const duration  = 180; // matches Flutter's 180ms

    const show = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardInset, {
        toValue: e.endCoordinates.height,
        duration,
        useNativeDriver: false,
      }).start();
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardInset, {
        toValue: 0,
        duration,
        useNativeDriver: false,
      }).start();
    });

    return () => { show.remove(); hide.remove(); };
  }, [keyboardInset]);

  // Tab bar clearance at rest (no keyboard)
  const tabBarClearance = insets.bottom + 8 + TAB_BAR_HEIGHT + 12;

  // Composer bottom padding = tabBarClearance when keyboard hidden,
  // collapses to just spacing.sm when keyboard is up (keyboard already lifts content)
  // This mirrors Flutter: padding: EdgeInsets.fromLTRB(16, 0, 16, 12 + keyboardInset)
  const composerPaddingBottom = keyboardInset.interpolate({
    inputRange: [0, 100],
    outputRange: [tabBarClearance, spacing.sm],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (!conversationId && conversations[0]?.id) {
      setConversationId(conversations[0].id);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    if (messages.length > 0) {
      InteractionManager.runAfterInteractions(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const workspaceContext = useMemo(() => {
    const completed    = todayTasks.filter((t) => t.status === 'done').length;
    const pending      = todayTasks.filter((t) => t.status !== 'done').length;
    const monthIncome  = balanceTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const monthExpense = balanceTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const todayKey     = new Date().toISOString().slice(0, 10);
    const todaySpend   = balanceTransactions
      .filter((t) => t.type === 'expense' && t.transaction_date.slice(0, 10) === todayKey)
      .reduce((s, t) => s + Number(t.amount), 0);
    return `Tasks due today: ${todayTasks.length} (${completed} completed, ${pending} open). Month balance: KES ${(monthIncome - monthExpense).toLocaleString('en-KE')}. Spent today: KES ${todaySpend.toLocaleString('en-KE')}.`;
  }, [balanceTransactions, todayTasks]);

  const handleSend = useCallback(async (rawPrompt: string) => {
    const message = rawPrompt.trim();
    if (!message) return;
    setDraft('');
    try {
      const response = await sendMessage.mutateAsync({ message, conversationId, workspaceContext });
      setConversationId(response.conversation.id);
      successTap();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Assistant unavailable right now.');
    }
  }, [conversationId, workspaceContext, sendMessage]);

  function sendDraft() {
    if (draft.trim()) handleSend(draft);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>AI COACH</Text>
          <Text style={styles.headerTitle}>Assistant</Text>
        </View>
        <View style={styles.headerRight}>
          <Capsule label="Online" color={colors.success} variant="subtle" size="sm" />
          <IconPillButton
            onPress={() => refetch()}
            icon={<Ionicons name="refresh" size={16} color={colors.accentLight} />}
            label="Refresh"
          />
        </View>
      </View>

      {/* ── Conversation chips ───────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.convRow}
        style={styles.convScroll}
      >
        <TouchableOpacity
          style={[styles.convChip, !conversationId && styles.convChipActive]}
          onPress={() => setConversationId(undefined)}
        >
          <Text style={[styles.convChipText, !conversationId && styles.convChipTextActive]}>New chat</Text>
        </TouchableOpacity>
        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={[styles.convChip, conversationId === conv.id && styles.convChipActive]}
            onPress={() => setConversationId(conv.id)}
          >
            <Text style={[styles.convChipText, conversationId === conv.id && styles.convChipTextActive]} numberOfLines={1}>
              {conv.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Quick prompts ────────────────────────────────────────── */}
      {assistantSuggestionsEnabled && messages.length === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptRow}
          style={styles.promptScroll}
        >
          {QUICK_PROMPTS.map((prompt) => (
            <TouchableOpacity key={prompt} style={styles.promptChip} onPress={() => handleSend(prompt)}>
              <Ionicons name="sparkles-outline" size={13} color={colors.accentLight} />
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Message list — flex:1, mirrors Flutter's Expanded(ListView) ─ */}
      <View style={styles.chatArea}>
        {loadingMessages || sendMessage.isPending ? (
          <View style={styles.loadingState}>
            <InsightCardSkeleton />
            <Skeleton width="72%" height={12} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Thinking through your workspace…
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item: msg }) => (
              <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleRole, msg.role === 'user' && styles.userBubbleRole]}>
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </Text>
                  <Text style={styles.bubbleTime}>{format(new Date(msg.created_at), 'h:mm a')}</Text>
                </View>
                <Text style={[styles.bubbleText, msg.role === 'user' && styles.userBubbleText]}>
                  {msg.content}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="Start a fresh conversation"
                subtitle="Ask about focus, spending, deadlines, or learning momentum."
              />
            }
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews
          />
        )}
      </View>

      {/* ── Composer — normal flow, AnimatedPadding mirrors Flutter exactly ─
           Flutter: AnimatedPadding(padding: LTRB(16, 0, 16, 12 + keyboardInset))
           Here:    Animated.View paddingBottom interpolated from keyboardInset  */}
      <Animated.View style={[styles.composerOuter, { paddingBottom: composerPaddingBottom }]}>
        <View style={[styles.composerPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message Assistant…"
            placeholderTextColor={colors.textMuted}
            style={[styles.composerInput, { color: colors.textPrimary }]}
            onSubmitEditing={sendDraft}
            returnKeyType="send"
            blurOnSubmit={false}
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendDraft}
            disabled={!draft.trim() || sendMessage.isPending}
            style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.accent : `${colors.accent}40` }]}
            activeOpacity={0.8}
          >
            {sendMessage.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="arrow-up" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs,
  },
  headerLeft:    { gap: 1 },
  headerEyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.accentLight, letterSpacing: 0.5, textTransform: 'uppercase' },
  headerTitle:   { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary, lineHeight: 32 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },

  convScroll: { flexGrow: 0, paddingVertical: spacing.xs },
  convRow:    { paddingHorizontal: spacing.lg, gap: spacing.sm },
  convChip: {
    paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft,
  },
  convChipActive:     { backgroundColor: colors.accentSoft, borderColor: `${colors.accent}55` },
  convChipText:       { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  convChipTextActive: { color: colors.textPrimary },

  promptScroll: { flexGrow: 0 },
  promptRow:    { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, gap: spacing.sm },
  promptChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceSoft, maxWidth: 220,
  },
  promptChipText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium, flexShrink: 1 },

  chatArea:     { flex: 1 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.xl },
  loadingText:  { ...textStyles.bodySm },

  bubble:         { padding: spacing.md, borderRadius: radius.xl, gap: 4, maxWidth: '88%' },
  aiBubble:       { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  userBubble:     { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  bubbleMeta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  bubbleRole:     { color: colors.accentLight, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase' },
  userBubbleRole: { color: 'rgba(255,255,255,0.7)' },
  bubbleTime:     { color: colors.textMuted, fontSize: fontSize.xs },
  bubbleText:     { color: colors.textPrimary, fontSize: fontSize.sm, lineHeight: 20 },
  userBubbleText: { color: '#fff' },

  // Flutter equivalent: AnimatedPadding wrapping GlassCard(composer)
  composerOuter: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    // paddingBottom is Animated — interpolated from keyboardInset
  },
  composerPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: radius.xxl, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
  },
  composerInput: {
    flex: 1, height: 40, fontSize: fontSize.sm, paddingHorizontal: spacing.md,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
