import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  conversationId?: string;
  message: string;
  workspaceContext?: string;
}

function titleFromMessage(message: string) {
  return message.trim().split(/\s+/).slice(0, 5).join(' ') || 'New Chat';
}

function fmtKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const body = (await req.json()) as ChatRequest;
    if (!body.message?.trim()) throw new Error('Message is required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw new Error('Unauthenticated');

    const userId = user.id;
    let conversationId = body.conversationId;

    if (!conversationId) {
      const { data: createdConversation, error } = await supabase
        .from('assistant_conversations')
        .insert({
          user_id: userId,
          title: titleFromMessage(body.message),
        })
        .select()
        .single();

      if (error) throw error;
      conversationId = createdConversation.id;
    }

    const { error: insertUserMessageError } = await supabase
      .from('assistant_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: body.message.trim(),
      });

    if (insertUserMessageError) throw insertUserMessageError;

    const [{ data: messages }, { data: tx }, { data: tasks }, { data: sessions }] = await Promise.all([
      supabase
        .from('assistant_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(12),
      supabase
        .from('transactions')
        .select('amount,type,category,transaction_date')
        .eq('user_id', userId)
        .gte('transaction_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('tasks')
        .select('title,status,priority,deadline')
        .eq('user_id', userId)
        .order('deadline', { ascending: true, nullsFirst: false })
        .limit(8),
      supabase
        .from('learning_sessions')
        .select('topic,duration_minutes,completed')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const monthIncome = (tx ?? [])
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const monthExpenses = (tx ?? [])
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const openTasks = (tasks ?? []).filter((item) => item.status !== 'done');
    const nextTask = openTasks.find((item) => item.deadline);
    const learningMinutes = (sessions ?? []).reduce((sum, item) => sum + Number(item.duration_minutes), 0);

    const systemPrompt = `You are the Personal OS assistant for a Kenyan user.
Give direct, practical coaching using the user's finance, task, calendar, and learning context.
If you mention money, use KES and Kenyan context like M-Pesa.
Keep answers concise: 2 short paragraphs or a tight list.

Current context:
- Month income: ${fmtKes(monthIncome)}
- Month expenses: ${fmtKes(monthExpenses)}
- Open tasks: ${openTasks.length}
- Next due task: ${nextTask?.title ?? 'none'}${nextTask?.deadline ? ` on ${nextTask.deadline}` : ''}
- Learning in last 30 days: ${Math.round((learningMinutes / 60) * 10) / 10} hours
${body.workspaceContext ? `\nUser-provided workspace snapshot:\n${body.workspaceContext}\n` : ''}`;

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY secret not configured');

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(messages ?? []).map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`OpenAI error: ${await aiRes.text()}`);
    }

    const aiJson = await aiRes.json();
    const assistantReply = aiJson.choices?.[0]?.message?.content?.trim();
    if (!assistantReply) throw new Error('No assistant reply returned');

    const { error: insertAssistantError } = await supabase
      .from('assistant_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role: 'assistant',
        content: assistantReply,
      });

    if (insertAssistantError) throw insertAssistantError;

    const [{ data: conversation }, { data: conversationMessages }] = await Promise.all([
      supabase
        .from('assistant_conversations')
        .select('*')
        .eq('id', conversationId)
        .single(),
      supabase
        .from('assistant_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

    return new Response(JSON.stringify({ conversation, messages: conversationMessages ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
