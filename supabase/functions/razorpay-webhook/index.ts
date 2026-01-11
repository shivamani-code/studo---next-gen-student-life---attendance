import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hmacSha256Hex = async (secret: string, payload: string) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toHex(new Uint8Array(sig));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return json({ error: 'Server is not configured.' }, 500);
  }

  const signature = req.headers.get('x-razorpay-signature') || '';
  const rawBody = await req.text();

  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  if (!signature || signature !== expected) {
    return json({ error: 'Invalid signature' }, 401);
  }

  let evt: any;
  try {
    evt = JSON.parse(rawBody);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const event = String(evt?.event || '');
  const subEntity = evt?.payload?.subscription?.entity;
  const subscriptionId = subEntity?.id ? String(subEntity.id) : '';
  const status = subEntity?.status ? String(subEntity.status) : '';
  const currentEnd = subEntity?.current_end ? Number(subEntity.current_end) : null;
  const currentPeriodEnd = currentEnd && Number.isFinite(currentEnd)
    ? new Date(currentEnd * 1000).toISOString()
    : null;

  if (!subscriptionId) {
    return json({ ok: true });
  }

  let mapped = 'created';
  if (status === 'active') mapped = 'active';
  if (status === 'cancelled') mapped = 'canceled';
  if (status === 'completed') mapped = 'expired';
  if (status === 'halted' || status === 'paused') mapped = 'past_due';

  if (event === 'subscription.activated') mapped = 'active';
  if (event === 'subscription.cancelled') mapped = 'canceled';
  if (event === 'subscription.completed') mapped = 'expired';
  if (event === 'subscription.halted' || event === 'subscription.paused') mapped = 'past_due';

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await supabaseAdmin
    .from('user_billing')
    .update({ subscription_status: mapped, current_period_end: currentPeriodEnd })
    .eq('razorpay_subscription_id', subscriptionId);

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
});
