interface Env {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  PROSPECTING_SOURCE_PROVIDER?: string;
  PROSPECTING_SOURCE_API_KEY?: string;
  PROSPECTING_SOURCE_ENDPOINT?: string;
  PROSPECTING_WORKER_SECRET?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_TEMPLATE_NAME?: string;
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

  const user = await userResponse.json() as { app_metadata?: Record<string, unknown> };
  if (user.app_metadata?.platform_role !== 'platform_admin') {
    return json({ error: 'Acesso restrito ao Admin Geral.' }, 403);
  }

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
    for (const table of ['prospecting_campaigns', 'prospecting_tasks', 'prospect_events', 'prospect_outbound_messages', 'site_project_versions']) {
      checks.push({ id: `database_${table}`, ready: false, detail: 'Não foi possível validar o esquema sem credencial server-side.' });
    }
  }

  const sourceConfigured = Boolean(env.PROSPECTING_SOURCE_PROVIDER?.trim() && env.PROSPECTING_SOURCE_API_KEY?.trim() && env.PROSPECTING_SOURCE_ENDPOINT?.trim());
  checks.push({
    id: 'discovery_provider',
    ready: sourceConfigured,
    detail: sourceConfigured ? `Provedor de descoberta configurado: ${env.PROSPECTING_SOURCE_PROVIDER!.trim()}.` : 'Configure PROSPECTING_SOURCE_PROVIDER, PROSPECTING_SOURCE_ENDPOINT HTTPS e a credencial server-side de um provedor autorizado.',
  });

  const workerConfigured = Boolean(env.PROSPECTING_WORKER_SECRET?.trim());
  checks.push({
    id: 'worker_authentication',
    ready: workerConfigured,
    detail: workerConfigured ? 'Segredo do worker configurado.' : 'Configure PROSPECTING_WORKER_SECRET para autenticar execuções internas.',
  });

  const whatsappConfigured = Boolean(
    env.WHATSAPP_ACCESS_TOKEN?.trim() &&
    env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
    env.WHATSAPP_TEMPLATE_NAME?.trim()
  );
  checks.push({
    id: 'whatsapp_provider',
    ready: whatsappConfigured,
    detail: whatsappConfigured ? 'Credenciais e modelo de mensagem do WhatsApp configurados.' : 'Configure token, identificador do número e modelo aprovado do WhatsApp Business Platform.',
  });

  const ready = checks.every((check) => check.ready);
  return json({
    status: ready ? 'ready_for_integration_tests' : 'blocked',
    ready,
    checkedAt: new Date().toISOString(),
    checks,
    note: 'Esta verificação confirma apenas configuração e acesso ao esquema. Não prova que descoberta, envio ou fluxo ponta a ponta funcionem.',
  }, ready ? 200 : 503);
}
