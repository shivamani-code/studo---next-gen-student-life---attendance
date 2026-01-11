import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type AdviceInput = {
  currentPercentage: number;
  targetPercentage: number;
  subjectHealth: any[];
  upcomingLeaves: number;
  profile?: any;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const apiKey = Deno.env.get('OPENROUTER_API_KEY') || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server is not configured.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const model = Deno.env.get('OPENROUTER_MODEL') || 'openrouter/auto';
  const modelsEnv = Deno.env.get('OPENROUTER_MODELS');
  const models = typeof modelsEnv === 'string'
    ? modelsEnv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const maxTokens = Number(Deno.env.get('OPENROUTER_MAX_TOKENS')) || 600;

  let input: AdviceInput;
  try {
    input = (await req.json()) as AdviceInput;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const prompt = `You are an academic attendance advisor.
Student data:
- Profile: ${JSON.stringify(input.profile || {})}
- Current: ${input.currentPercentage}%
- Target: ${input.targetPercentage}%
- Subjects: ${JSON.stringify(input.subjectHealth || [])}
- Planned leaves: ${input.upcomingLeaves}

Give 2-3 sentences of actionable advice. Warn if any subject is below 75%.`;

  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://studo.app',
      'X-Title': 'Studo'
    },
    body: JSON.stringify({
      ...(models.length
        ? { models, route: 'fallback' as const }
        : { model }),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: maxTokens
    })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    return new Response(JSON.stringify({ error: errText || 'AI request failed.' }), {
      status: resp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const json = await resp.json();

  if (json?.error) {
    const code = (json as any)?.error?.code;
    const status = typeof code === 'number' && Number.isFinite(code) ? code : 500;
    return new Response(JSON.stringify({ error: json.error }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const raw = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || '';
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);

  if (!text.trim()) {
    console.error('OpenRouter empty response:', { json });
    return new Response(
      JSON.stringify({
        text: 'AI response unavailable. Please try again.',
        provider: 'openrouter'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(JSON.stringify({ text, provider: 'openrouter' }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
