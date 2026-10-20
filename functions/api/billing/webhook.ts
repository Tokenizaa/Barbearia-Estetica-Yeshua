interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VENOPAG_WEBHOOK_SECRET: string;
}
type Context = { request: Request; env: Env };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }: Context) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VENOPAG_WEBHOOK_SECRET) return json({ error: 'Webhook não configurado.' }, 503);
  const rawBody = await request.text();
  if (rawBody.length > 64_000) return json({ error: 'Payload excede o limite.' }, 413);
  const signature = request.headers.get('X-Veno-Signature') || request.headers.get('x-venopag-signature') || '';
  const parsed = signature.match(/t=(\d+),v1=([a-f0-9]+)/i);
  if (!parsed) return json({ error: 'Assinatura ausente ou inválida.' }, 401);
  const timestamp = parsed[1];
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return json({ error: 'Assinatura expirada.' }, 401);
  const expected = await hmacHex(env.VENOPAG_WEBHOOK_SECRET, `${timestamp}.${rawBody}`);
  if (!constantTimeEqual(expected.toLowerCase(), parsed[2].toLowerCase())) return json({ error: 'Assinatura inválida.' }, 401);

  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody) as Record<string, unknown>; } catch { return json({ error: 'JSON inválido.' }, 400); }
  const requestNumber = typeof event.request_number === 'string' ? event.request_number : '';
  const status = typeof event.status === 'string' ? event.status.toLowerCase() : '';
  const transactionId = typeof event.transaction_id === 'string' ? event.transaction_id : null;
  if (!requestNumber) return json({ error: 'Identificador da cobrança ausente.' }, 400);

  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' };
  const lookup = await fetch(`${env.SUPABASE_URL}/rest/v1/billing_payments?select=id,establishment_id,amount_brl_cents,status&provider_request_number=eq.${encodeURIComponent(requestNumber)}&limit=1`, { headers });
  if (!lookup.ok) return json({ error: 'Falha ao consultar a cobrança.' }, 502);
  const rows = await lookup.json() as Array<{ id: string; establishment_id: string; amount_brl_cents: number; status: string }>;
  const payment = rows[0];
  if (!payment) return json({ error: 'Cobrança não encontrada.' }, 404);

  const amount = typeof event.amount === 'number' ? event.amount : Number(event.amount);
  const paid = ['confirmed', 'paid', 'completed'].includes(status);
  if (paid && (!Number.isFinite(amount) || Math.round(amount * 100) !== payment.amount_brl_cents)) return json({ error: 'Valor confirmado ausente ou divergente da cobrança.' }, 409);
  const terminalStatus = paid ? 'paid' : ['expired', 'canceled', 'cancelled'].includes(status) ? (status === 'expired' ? 'expired' : 'canceled') : 'pending';
  if (payment.status !== 'paid') {
    const update = await fetch(`${env.SUPABASE_URL}/rest/v1/billing_payments?id=eq.${payment.id}`, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: terminalStatus, provider_transaction_id: transactionId, paid_at: paid ? new Date().toISOString() : null, provider_payload: { status, request_number: requestNumber, transaction_id: transactionId } }),
    });
    if (!update.ok) return json({ error: 'Falha ao atualizar pagamento.' }, 502);
    if (paid) {
      const activate = await fetch(`${env.SUPABASE_URL}/rest/v1/establishments?id=eq.${payment.establishment_id}`, {
        method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'active', billing_status: 'active', updated_at: new Date().toISOString() }),
      });
      if (!activate.ok) return json({ error: 'Pagamento confirmado, mas a ativação requer reconciliação.' }, 502);
    }
  }
  return json({ received: true });
}
