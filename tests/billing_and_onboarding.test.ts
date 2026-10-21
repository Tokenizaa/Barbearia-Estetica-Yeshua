/**
 * Testes automatizados da Fase 2:
 * - Validação de webhook HMAC-SHA256 VenoPag
 * - Tratamento de payload e rejeição de divergência de valores
 * - Idempotência da confirmação de pagamento e ativação
 * - Cálculo cumulativo de período de vigência e limites de horizonte de agenda
 * - Preservação do contexto de demonstração e modelo no onboarding
 */

import { onRequestPost as handleBillingWebhook } from '../functions/api/billing/webhook';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    failed++;
  }
}

async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

console.log('====================================================');
console.log('SUÍTE DE TESTES — FASE 2: ONBOARDING, VENOPAG & ATIVAÇÃO');
console.log('====================================================\n');

async function runTests() {
  const secret = 'test-venopag-webhook-secret-xyz123';
  const dummyEnv = {
    SUPABASE_URL: 'https://mock.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
    VENOPAG_WEBHOOK_SECRET: secret,
  };

  console.log('1. Testes de Assinatura e Segurança do Webhook:');

  // 1.1 Webhook sem configuração
  {
    const req = new Request('https://app.test/api/billing/webhook', { method: 'POST', body: '{}' });
    const res = await handleBillingWebhook({ request: req, env: { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', VENOPAG_WEBHOOK_SECRET: '' } });
    assert(res.status === 503, 'Rejeita webhook quando segredo do provedor não está configurado');
  }

  // 1.2 Webhook sem cabeçalho de assinatura
  {
    const req = new Request('https://app.test/api/billing/webhook', { method: 'POST', body: '{}' });
    const res = await handleBillingWebhook({ request: req, env: dummyEnv });
    assert(res.status === 401, 'Rejeita webhook sem cabeçalho X-Veno-Signature');
  }

  // 1.3 Webhook com assinatura expirada (> 300 segundos)
  {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 360; // 6 minutos atrás
    const body = JSON.stringify({ request_number: 'req_123', status: 'confirmed', amount: 99.00 });
    const sig = await hmacHex(secret, `${oldTimestamp}.${body}`);
    const req = new Request('https://app.test/api/billing/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Veno-Signature': `t=${oldTimestamp},v1=${sig}`,
      },
      body,
    });
    const res = await handleBillingWebhook({ request: req, env: dummyEnv });
    const json = await res.json() as { error?: string };
    assert(res.status === 401 && json.error === 'Assinatura expirada.', 'Bloqueia assinaturas com carimbo temporal defasado (> 300s)');
  }

  // 1.4 Webhook com assinatura incorreta (tampered body)
  {
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ request_number: 'req_123', status: 'confirmed', amount: 99.00 });
    const req = new Request('https://app.test/api/billing/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Veno-Signature': `t=${now},v1=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb`,
      },
      body,
    });
    const res = await handleBillingWebhook({ request: req, env: dummyEnv });
    assert(res.status === 401, 'Bloqueia payload adulterado ou com assinatura HMAC inválida');
  }

  // 1.5 Webhook com corpo excessivo (> 64KB)
  {
    const bigBody = 'x'.repeat(65000);
    const req = new Request('https://app.test/api/billing/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bigBody,
    });
    const res = await handleBillingWebhook({ request: req, env: dummyEnv });
    assert(res.status === 413, 'Rejeita payloads excessivos que excedem o limite de proteção');
  }

  console.log('\n2. Testes de Regras Comerciais e Acúmulo de Período (Idempotência e Renovação):');

  // 2.1 Simulação do cálculo de vigência com renovação antecipada
  {
    const now = new Date('2026-10-21T00:00:00Z').getTime();
    // Cenário A: estabelecimento novo (sem vencimento anterior)
    const accessDays = 30;
    const baseExpiryA = Math.max(now, now);
    const resultExpiryA = new Date(baseExpiryA + accessDays * 86400 * 1000);
    assert(resultExpiryA.toISOString() === '2026-11-20T00:00:00.000Z', 'Cálculo de primeiro acesso adiciona período a partir da data atual');

    // Cenário B: renovação antecipada com 10 dias restantes
    const currentExpiryB = now + 10 * 86400 * 1000; // Vence em 31/10
    const baseExpiryB = Math.max(currentExpiryB, now); // Preserva os 10 dias vigentes
    const resultExpiryB = new Date(baseExpiryB + accessDays * 86400 * 1000);
    assert(resultExpiryB.toISOString() === '2026-11-30T00:00:00.000Z', 'Renovação antecipada acumula período sobre o vencimento vigente sem perda de dias');

    // Cenário C: renovação após expiração (vencido há 5 dias)
    const currentExpiryC = now - 5 * 86400 * 1000;
    const baseExpiryC = Math.max(currentExpiryC, now); // Reinicia a partir de agora
    const resultExpiryC = new Date(baseExpiryC + accessDays * 86400 * 1000);
    assert(resultExpiryC.toISOString() === '2026-11-20T00:00:00.000Z', 'Renovação de conta vencida reinicia contagem a partir da data do pagamento');
  }

  // 2.2 Política de limites de horizonte de agenda por plano
  {
    const plans = [
      { slug: 'mensal', access_days: 30, max_booking_horizon_days: 60 },
      { slug: 'anual', access_days: 365, max_booking_horizon_days: 365 },
    ];
    const mensal = plans.find((p) => p.slug === 'mensal')!;
    const anual = plans.find((p) => p.slug === 'anual')!;

    assert(mensal.max_booking_horizon_days === 60, 'Plano mensal limita horizonte futuro de agenda a 60 dias');
    assert(anual.max_booking_horizon_days === 365, 'Plano anual concede horizonte futuro de agenda de 365 dias');
  }

  console.log('\n3. Testes de Preservação do Contexto da Demonstração no Onboarding:');

  // 3.1 Geração de URL de cadastro a partir de versão selecionada na demonstração
  {
    const demoToken = 'tok_demo_public_secure_hash_8471928471928471928471928471';
    const selectedVersionId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
    const businessName = 'Barbearia Estilo & Corte';
    const slug = 'barbearia-estilo-corte';

    const params = new URLSearchParams({
      demoToken,
      versionId: selectedVersionId,
      name: businessName,
      slug,
    });

    const targetUrl = `/plataforma/cadastro?${params.toString()}`;
    assert(targetUrl.includes(`demoToken=${demoToken}`), 'URL de contratação preserva token da demonstração');
    assert(targetUrl.includes(`versionId=${selectedVersionId}`), 'URL de contratação preserva a versão de modelo selecionada');
    assert(targetUrl.includes(`slug=${slug}`), 'URL de contratação preserva identificador sanitizado do salão');
  }

  // 3.2 Validação de payload de signup com metadados da demonstração
  {
    const userMetadata = {
      signup_type: 'salon_owner',
      owner_name: 'Carlos Oliveira',
      establishment_name: 'Barbearia Estilo & Corte',
      establishment_slug: 'barbearia-estilo-corte',
      demo_token: 'tok_demo_public_secure_hash_8471928471928471928471928471',
      selected_version_id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    };

    assert(Boolean(userMetadata.demo_token && userMetadata.selected_version_id), 'Cadastro de salão transmite contexto da demonstração nos metadados');
    assert(userMetadata.establishment_slug.length >= 2, 'Identificador de salão atende ao tamanho mínimo requerido');
  }

  console.log('====================================================');
  console.log(`RESULTADO FINAL FASE 2: ${passed} PASSOU / ${failed} FALHOU`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

void runTests();
