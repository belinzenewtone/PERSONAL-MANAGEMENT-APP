/**
 * Supabase Edge Function: ai-insights
 * Aggregates user data and calls OpenAI to generate personalised insights.
 * OpenAI key is stored as a Supabase secret — never exposed to the client.
 *
 * Deploy:
 *   supabase functions deploy ai-insights
 *   supabase secrets set OPENAI_API_KEY=sk-...
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface InsightCard {
  id:       string;
  type:     'spending' | 'productivity' | 'learning' | 'forecast' | 'tip';
  title:    string;
  body:     string;
  icon:     string;
  priority: 'high' | 'medium' | 'low';
}

interface AiInsightsResponse {
  insights:     InsightCard[];
  generated_at: string;
  data_summary: {
    transactions_analysed: number;
    tasks_analysed:        number;
    sessions_analysed:     number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtKes(n: number) {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function startOf(unit: 'month' | 'week', now = new Date()) {
  if (unit === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const d = new Date(now);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthenticated');

    const userId  = user.id;
    const now     = new Date();
    const monthStart = startOf('month', now);
    const weekStart  = startOf('week',  now);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();

    // ── Fetch data in parallel ──────────────────────────────────────────────

    const [txRes, tasksRes, learningRes, lastMonthTxRes] = await Promise.all([
      // This month's transactions
      supabase
        .from('transactions')
        .select('amount,type,category,transaction_date')
        .eq('user_id', userId)
        .gte('transaction_date', monthStart),

      // This week's tasks
      supabase
        .from('tasks')
        .select('status,category,priority,deadline')
        .eq('user_id', userId)
        .gte('created_at', weekStart),

      // Last 30 days learning sessions
      supabase
        .from('learning_sessions')
        .select('topic,duration_minutes,completed,created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),

      // Last 3 months transactions for trend
      supabase
        .from('transactions')
        .select('amount,type,transaction_date')
        .eq('user_id', userId)
        .gte('transaction_date', threeMonthsAgo)
        .eq('type', 'expense'),
    ]);

    const transactions  = txRes.data        ?? [];
    const tasks         = tasksRes.data     ?? [];
    const sessions      = learningRes.data  ?? [];
    const trendTx       = lastMonthTxRes.data ?? [];

    // ── Compute aggregates ─────────────────────────────────────────────────

    const income   = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const balance  = income - expenses;
    const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

    // Category breakdown
    const catMap: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
    });
    const topCategories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: ${fmtKes(amt)}`);

    // Task stats
    const totalTasks    = tasks.length;
    const doneTasks     = tasks.filter((t) => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Learning stats
    const totalMinutes = sessions.reduce((s, l) => s + Number(l.duration_minutes), 0);
    const totalHours   = Math.round(totalMinutes / 60 * 10) / 10;
    const completedSessions = sessions.filter((s) => s.completed).length;
    const topicMap: Record<string, number> = {};
    sessions.forEach((s) => {
      topicMap[s.topic] = (topicMap[s.topic] ?? 0) + Number(s.duration_minutes);
    });
    const topTopic = Object.entries(topicMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';

    // Monthly spend trend (last 3 months)
    const monthlySpend: Record<string, number> = {};
    trendTx.forEach((t) => {
      const m = t.transaction_date.slice(0, 7); // YYYY-MM
      monthlySpend[m] = (monthlySpend[m] ?? 0) + Number(t.amount);
    });
    const monthlyValues = Object.entries(monthlySpend).sort(([a], [b]) => a.localeCompare(b));
    const trendStr = monthlyValues.map(([m, v]) => `${m}: ${fmtKes(v)}`).join(', ');

    // ── Build prompt ────────────────────────────────────────────────────────

    const prompt = `You are a personal finance and productivity coach for a Kenyan user.

Analyse the following data and produce exactly 5 insight cards in JSON format.

## This Month's Finance
- Income: ${fmtKes(income)}
- Expenses: ${fmtKes(expenses)}
- Balance: ${fmtKes(balance)}
- Savings rate: ${savingsRate}%
- Top spending categories: ${topCategories.join(' | ') || 'none'}

## Monthly Spend Trend (last 3 months)
${trendStr || 'Insufficient data'}

## This Week's Tasks
- Total: ${totalTasks}
- Completed: ${doneTasks} (${completionRate}%)

## Last 30 Days Learning
- Total hours: ${totalHours}h across ${sessions.length} sessions
- Completed sessions: ${completedSessions}
- Most studied topic: ${topTopic}

## Output Format (strict JSON, no markdown)
Return ONLY a valid JSON array of 5 objects:
[
  {
    "id": "unique-snake-case-id",
    "type": "spending|productivity|learning|forecast|tip",
    "title": "short title (max 8 words)",
    "body": "2–3 sentence actionable insight specific to this user's numbers",
    "icon": "single emoji",
    "priority": "high|medium|low"
  }
]

Rules:
- Be specific — reference actual numbers from the data
- Be actionable — suggest a concrete next step
- Use Kenyan context (M-Pesa, KES, local expenses)
- "forecast" type should predict next month's spend based on trend
- "tip" type should give a practical money/productivity tip`;

    // ── Call OpenAI ─────────────────────────────────────────────────────────

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OPENAI_API_KEY secret not configured');

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        temperature: 0.7,
        max_tokens:  900,
        messages: [
          { role: 'system', content: 'You are a personal finance and productivity coach. Always respond with valid JSON only.' },
          { role: 'user',   content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`OpenAI error: ${err}`);
    }

    const aiJson   = await aiRes.json();
    const rawText  = aiJson.choices?.[0]?.message?.content ?? '[]';
    let insights: InsightCard[] = [];

    try {
      // Strip potential markdown code fences
      const clean = rawText.replace(/```(?:json)?/g, '').trim();
      insights = JSON.parse(clean);
    } catch {
      insights = [{
        id: 'parse-error',
        type: 'tip',
        title: 'Insights unavailable',
        body: 'Could not parse AI response. Please try again.',
        icon: '⚠️',
        priority: 'low',
      }];
    }

    const response: AiInsightsResponse = {
      insights,
      generated_at: new Date().toISOString(),
      data_summary: {
        transactions_analysed: transactions.length,
        tasks_analysed:        tasks.length,
        sessions_analysed:     sessions.length,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status:  400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
