import { supabase } from '../../lib/supabase';
import { unwrapFunctionsHttpError } from '../../lib/supabase-function-error';
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantConversation,
  AssistantMessage,
} from '@personal-os/types';

export const assistantService = {
  listConversations: async (): Promise<AssistantConversation[]> => {
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  getMessages: async (conversationId: string): Promise<AssistantMessage[]> => {
    const { data, error } = await supabase
      .from('assistant_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  sendMessage: async (
    message: string,
    conversationId?: string,
    workspaceContext?: string,
  ): Promise<AssistantChatResponse> => {
    const { data, error } = await supabase.functions.invoke<AssistantChatResponse>('assistant-chat', {
      body: { message, conversationId, workspaceContext } satisfies AssistantChatRequest,
    });
    if (error) {
      await unwrapFunctionsHttpError(error);
    }
    if (!data) throw new Error('No assistant response returned');
    return data;
  },
};
