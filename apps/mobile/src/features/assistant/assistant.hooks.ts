import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assistantService } from './assistant.service';
import { useAuthStore } from '../../store/auth.store';

const ASSISTANT_KEYS = {
  conversations: (userId: string) => ['assistant', userId, 'conversations'] as const,
  messages: (conversationId: string) => ['assistant', 'messages', conversationId] as const,
};

export function useAssistantConversations() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ASSISTANT_KEYS.conversations(userId!),
    queryFn: assistantService.listConversations,
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
  });
}

export function useAssistantMessages(conversationId?: string) {
  return useQuery({
    queryKey: ASSISTANT_KEYS.messages(conversationId ?? 'empty'),
    queryFn: () => assistantService.getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 15,
    refetchOnMount: false,
  });
}

export function useSendAssistantMessage() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useMutation({
    mutationFn: ({
      message,
      conversationId,
      workspaceContext,
    }: {
      message: string;
      conversationId?: string;
      workspaceContext?: string;
    }) => assistantService.sendMessage(message, conversationId, workspaceContext),
    onSuccess: ({ conversation, messages }) => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ASSISTANT_KEYS.conversations(userId) });
      queryClient.setQueryData(ASSISTANT_KEYS.messages(conversation.id), messages);
    },
  });
}
