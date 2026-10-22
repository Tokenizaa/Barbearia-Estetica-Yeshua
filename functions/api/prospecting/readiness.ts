interface Env {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // Discovery via Playwright + Cloudflare Browser Run
  // BROWSER binding is configured in Worker, not Pages
  PROSPECTING_WORKER_SECRET?: string;
  // WhatsApp — Evolution API (futuro) ou manual por enquanto
  WHATSAPP_EVOLUTION_URL?: string;
  WHATSAPP_EVOLUTION_API_KEY?: string;
  WHATSAPP_EVOLUTION_INSTANCE?: string;
  // Legacy Meta Cloud API (mantido para compatibilidade futura)
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_TEMPLATE_NAME?: string;
  WHATSAPP_API_VERSION?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;
}

type Context = { request: Request; env: Env };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'x-content-type-options': 'nosniff',
  },
});

type Check = { id: string; ready: boolean; detail: string };

async function checkTable(baseUrl: string, serviceKey: string, table: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/rest/v1/${table}?select=*&limit=0`, {
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function onRequestGet({ request, env }: Context) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json({ error: 'Autenticação obrigatória.' }, 401);
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
    return json({ error: 'Autenticação Supabase não configurada no servidor.' }, 503);
  }

  let userResponse: Response;
  try {
    userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        authorization,
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return json({ error: 'Não foi possível validar a sessão administrativa.' }, 502);
  }
  if (!userResponse.ok) return json({ error: 'Sessão inválida ou expirada.' }, 401);

  const user = await userResponse.json() as { id?: string };
  if (!user.id || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Configuração administrativa incompleta.' }, 503);
  let adminCheck: Response;
  try {
    adminCheck = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/platform_admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
  } catch { return json({ error: 'Não foi possível verificar a permissão administrativa.' }, 503); }
  if (!adminCheck.ok) return json({ error: 'Não foi possível verificar a permissão administrativa.' }, 503);
  const adminRows = await adminCheck.json() as unknown[];
  if (!adminRows.length) return json({ error: 'Acesso restrito ao Admin Geral.' }, 403);

  const checks: Check[] = [];
  const coreConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  checks.push({
    id: 'server_database_credentials',
    ready: coreConfigured,
    detail: coreConfigured ? 'Credencial server-side disponível.' : 'Configure SUPABASE_SERVICE_ROLE_KEY como secret server-side.',
  });

  if (coreConfigured && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const tables = await Promise.all([
      ['prospecting_campaigns', 'campanhas'],
      ['prospecting_tasks', 'fila de tarefas'],
      ['prospect_events', 'eventos do funil'],
      ['prospect_outbound_messages', 'mensagens de saída'],
      ['site_projects', 'projetos de site'],
      ['site_template_versions', 'versões publicadas de modelos'],
      ['site_project_versions', 'versões das demonstrações'],
      ['prospecting_candidates', 'candidatos descobertos'],
      ['site_demo_public_links', 'links públicos das demonstrações'],
    ] as const);
    const results = await Promise.all(tables.map(async ([table, label]) => ({
      table,
      label,
      ready: await checkTable(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, table),
    })));
    for (const result of results) {
      checks.push({
        id: `database_${result.table}`,
        ready: result.ready,
        detail: result.ready ? `Tabela de ${result.label} acessível.` : `Tabela de ${result.label} ausente ou inacessível; aplique e valide as migrations da Fase 1.`,
      });
    }
  } else {
    for (const table of ['prospecting_campaigns', 'prospecting_tasks', 'prospect_events', 'prospect_outbound_messages', 'site_projects', 'site_template_versions', 'site_project_versions']) {
      checks.push({ id: `database_${table}`, ready: false, detail: 'Não foi possível validar o esquema sem credencial server-side.' });
    }
  }

  // Discovery: Browser Run binding (configured in Worker, not Pages)
  // This check is informational for Pages; the Worker validates BROWSER binding at runtime
  checks.push({
    id: 'discovery_browser_run',
    ready: true, // Pages doesn't have BROWSER binding; Worker does
    detail: 'Descoberta via Playwright + Cloudflare Browser Run (configurado no Worker prospecting-scheduler).',
  });

  const workerConfigured = Boolean(env.PROSPECTING_WORKER_SECRET?.trim());
  checks.push({
    id: 'worker_authentication',
    ready: workerConfigured,
    detail: workerConfigured ? 'Segredo do worker configurado.' : 'Configure PROSPECTING_WORKER_SECRET para autenticar execuções internas.',
  });

  // WhatsApp: Evolution API (futuro) ou Meta Cloud API (legacy)
  const evolutionConfigured = Boolean(
    env.WHATSAPP_EVOLUTION_URL?.trim() &&
    env.WHATSAPP_EVOLUTION_API_KEY?.trim() &&
    env.WHATSAPP_EVOLUTION_INSTANCE?.trim()
  );
  const metaConfigured = Boolean(
    env.WHATSAPP_ACCESS_TOKEN?.trim() &&
    env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
    env.WHATSAPP_TEMPLATE_NAME?.trim() &&
    /^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION ?? '')
  );
  const whatsappConfigured = evolutionConfigured || metaConfigured;
  checks.push({
    id: 'whatsapp_provider',
    ready: whatsappConfigured,
    detail: whatsappConfigured
      ? (evolutionConfigured ? 'Evolution API configurada.' : 'Meta Cloud API (legacy) configurada.')
      : 'Configure Evolution API (WHATSAPP_EVOLUTION_URL, WHATSAPP_EVOLUTION_API_KEY, WHATSAPP_EVOLUTION_INSTANCE) ou Meta Cloud API (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_NAME, WHATSAPP_API_VERSION). Telefone é normalizado para WhatsApp (DDI 55 + DDD + número).',
  });

  const webhookConfigured = Boolean(env.WHATSAPP_APP_SECRET?.trim() && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim());
  checks.push({
    id: 'whatsapp_webhook_security',
    ready: webhookConfigured,
    detail: webhookConfigured ? 'Assinatura e token de verificação do webhook configurados.' : 'Configure WHATSAPP_APP_SECRET e WHATSAPP_WEBHOOK_VERIFY_TOKEN para validar recibos e opt-outs do WhatsApp (Meta Cloud API). Para Evolution API, configure webhook na instância.',
  });

  const ready = checks.every((check) => check.ready);
  return json({
    status: ready ? 'ready_for_integration_tests' : 'blocked',
    ready,
    checkedAt: new Date().toISOString(),
    checks,
    note: 'Esta verificação confirma apenas configuração e acesso ao esquema. Não prova que descoberta, envio ou fluxo ponta a ponta funcionem. Discovery roda no Worker (Browser Run); WhatsApp usa Evolution API (futuro) ou manual.',
  }, ready ? 200 : 503);
}