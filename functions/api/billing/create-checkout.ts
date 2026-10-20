interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VENOPAG_CLIENT_ID: string;
  VENOPAG_CLIENT_SECRET: string;
  VENOPAG_BASE_URL?: string;
  VENOPAG_WEBHOOK_URL?: string;
}
type Context = { request: Request; env: Env };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

export async function onRequestPost({ request, env }: Context) {
  const bearer = request.headers.get('authorization') || '';
  if (!bearer.startsWith('Bearer ')) return json({ error: 'Autenticação obrigatória.' }, 401);
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.VENOPAG_CLIENT_ID || !env.VENOPAG_CLIENT_SECRET) {
    return json({ error: 'A integração de cobrança ainda não foi configurada no servidor.' }, 503);
  }

  const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: bearer },
  });
  if (!authResponse.ok) return json({ error: 'Sessão inválida ou expirada.' }, 401);
  const user = await authResponse.json() as { id: string; email?: string; user_metadata?: Record<string, unknown> };

  let body: { planId?: string };
  try { body = await request.json() as { planId?: string }; } catch { return json({ error: 'Corpo JSON inválido.' }, 400); }
  if (!body.planId || !/^[0-9a-f-]{36}$/i.test(body.planId)) return json({ error: 'Plano inválido.' }, 400);

  const serviceHeaders = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'content-type': 'application/json' };
  const membershipResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/establishment_memberships?select=establishment_id,role&user_id=eq.${encodeURIComponent(user.id)}&role=in.(owner,admin)&limit=1`, { headers: serviceHeaders });
  if (!membershipResponse.ok) return json({ error: 'Não foi possível validar o estabelecimento.' }, 502);
  const memberships = await membershipResponse.json() as Array<{ establishment_id: string; role: string }>;
  if (!memberships.length) return json({ error: 'Nenhum salão vinculado a esta conta. Faça o cadastro novamente ou contate o suporte.' }, 403);
  const establishmentId = memberships[0].establishment_id;

  const planResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/billing_plans?select=id,name,price_brl_cents,access_days,is_active&id=eq.${encodeURIComponent(body.planId)}&is_active=eq.true&limit=1`, { headers: serviceHeaders });
  if (!planResponse.ok) return json({ error: 'Não foi possível consultar o plano.' }, 502);
  const plans = await planResponse.json() as Array<{ id: string; name: string; price_brl_cents: number; access_days: number; is_active: boolean }>;
  const plan = plans[0];
  if (!plan || !Number.isSafeInteger(plan.price_brl_cents) || plan.price_brl_cents <= 0) return json({ error: 'Plano indisponível ou sem preço configurado.' }, 400);

  const createPaymentResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/billing_payments`, {
    method: 'POST', headers: { ...serviceHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({ establishment_id: establishmentId, user_id: user.id, plan_id: plan.id, amount_brl_cents: plan.price_brl_cents, status: 'pending' }),
  });
  if (!createPaymentResponse.ok) return json({ error: 'Não foi possível iniciar o registro da cobrança.' }, 502);
  const createdRows = await createPaymentResponse.json() as Array<{ id: string }>;
  const payment = createdRows[0];
  if (!payment?.id) return json({ error: 'Registro da cobrança não retornou identificador.' }, 502);

  const providerBase = (env.VENOPAG_BASE_URL || 'https://venopagments.com').replace(/\/$/, '');
  const webhookUrl = env.VENOPAG_WEBHOOK_URL || new URL('/api/billing/webhook', request.url).toString();
  const metadataName = typeof user.user_metadata?.owner_name === 'string' ? user.user_metadata.owner_name : 'Responsável pelo salão';
  let providerPayload: Record<string, unknown>;
  try {
    const providerResponse = await fetch(`${providerBase}/api/cashin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'X-Client-Id': env.VENOPAG_CLIENT_ID, 'X-Client-Secret': env.VENOPAG_CLIENT_SECRET },
      body: JSON.stringify({
        amount: plan.price_brl_cents / 100,
        name: metadataName,
        description: `Contratação ${plan.name} - ${payment.id}`,
        webhook_url: webhookUrl,
      }),
    });
    providerPayload = await providerResponse.json() as Record<string, unknown>;
    if (!providerPayload.ok) throw new Error(typeof providerPayload.error === 'string' ? providerPayload.error : 'A VenoPag recusou a cobrança.');
  } catch (error) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/billing_payments?id=eq.${payment.id}`, {
      method: 'PATCH', headers: { ...serviceHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'failed', provider_payload: { error: error instanceof Error ? error.message : 'provider_error' } }),
    });
    return json({ error: 'A VenoPag não conseguiu gerar o PIX. Tente novamente mais tarde.' }, 502);
  }

  const requestNumber = typeof providerPayload.request_number === 'string' ? providerPayload.request_number : '';
  if (!requestNumber) return json({ error: 'A VenoPag não retornou o identificador da cobrança.' }, 502);
  const checkoutUrl = typeof providerPayload.checkout_url === 'string' ? providerPayload.checkout_url : null;
  const qrUrl = typeof providerPayload.qr_url === 'string' ? providerPayload.qr_url : null;
  const copyPaste = [providerPayload.copyPaste, providerPayload.copy_paste, providerPayload.pix_code, providerPayload.code, providerPayload.qr]
    .find((value) => typeof value === 'string' && value.length > 10);
  const expiresMinutes = Number(providerPayload.expire_minutes);
  await fetch(`${env.SUPABASE_URL}/rest/v1/billing_payments?id=eq.${payment.id}`, {
    method: 'PATCH', headers: { ...serviceHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      provider_request_number: requestNumber,
      provider_transaction_id: typeof providerPayload.transaction_id === 'string' ? providerPayload.transaction_id : null,
      checkout_url: checkoutUrl, qr_url: qrUrl, pix_copy_paste: typeof copyPaste === 'string' ? copyPaste : null,
      expires_at: Number.isFinite(expiresMinutes) && expiresMinutes > 0 ? new Date(Date.now() + expiresMinutes * 60_000).toISOString() : null,
      provider_payload: { status: providerPayload.status, request_number: requestNumber, transaction_id: providerPayload.transaction_id },
    }),
  });

  return json({ payment: { id: payment.id, checkout_url: checkoutUrl, qr_url: qrUrl, pix_copy_paste: copyPaste ?? null } }, 201);
}
