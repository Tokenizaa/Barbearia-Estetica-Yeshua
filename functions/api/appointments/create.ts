interface Env { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string; }
type Context = { request: Request; env: Env };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
export async function onRequestPost({ request, env }: Context) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return json({ error: 'O agendamento seguro ainda não está configurado no servidor.' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 12_000) return json({ error: 'Solicitação muito grande.' }, 413);
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return json({ error: 'Solicitação inválida.' }, 400); }
  const required = ['establishmentSlug','clientName','clientPhone','serviceId','serviceName','date','time'];
  if (required.some((key) => typeof body[key] !== 'string' || !(body[key] as string).trim())) return json({ error: 'Preencha os dados obrigatórios do agendamento.' }, 400);
  const date = body.date as string, time = body.time as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return json({ error: 'Data ou horário inválido.' }, 400);
  const price = body.servicePrice == null ? null : Number(body.servicePrice);
  const duration = body.serviceDurationMinutes == null ? null : Number(body.serviceDurationMinutes);
  if ((price !== null && (!Number.isFinite(price) || price < 0)) || (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 1440))) return json({ error: 'Serviço inválido.' }, 400);
  const rpcBody = {
    p_establishment_slug: (body.establishmentSlug as string).trim().toLowerCase(),
    p_client_name: (body.clientName as string).trim(), p_client_phone: (body.clientPhone as string).trim(),
    p_service_id: (body.serviceId as string).trim(), p_service_name: (body.serviceName as string).trim(),
    p_service_price: price, p_service_duration_minutes: duration,
    p_appointment_date: date, p_appointment_time: time,
    p_notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
  };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/create_public_establishment_appointment`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(rpcBody),
  });
  const result = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const code = typeof result?.code === 'string' ? result.code : '';
    const message = typeof result?.message === 'string' ? result.message : '';
    if (code === '23505' || /já foi solicitado|duplicat/i.test(message)) return json({ error: 'Este horário acabou de ser solicitado. Escolha outro horário.' }, 409);
    if (code === '42501' || /assinatura inativa|indisponível/i.test(message)) return json({ error: 'Este estabelecimento está temporariamente indisponível para novos agendamentos.' }, 403);
    if (/antecedência|Data ou horário inválido|Dados do agendamento inválidos/i.test(message)) return json({ error: message }, 400);
    if (code === 'P0002') return json({ error: 'Estabelecimento não encontrado.' }, 404);
    return json({ error: 'Não foi possível salvar o agendamento com segurança. Tente novamente.' }, 502);
  }
  return json({ appointment: result }, 201);
}
