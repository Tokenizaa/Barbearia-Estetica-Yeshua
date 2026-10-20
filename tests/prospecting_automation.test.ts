import {
  createProspectDedupeKey,
  isEligibleForAutomatedWhatsApp,
  normalizeBusinessName,
  normalizePhone,
  normalizeWebsite,
  qualifyProspect,
} from '../src/lib/prospecting';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}`);
    failed++;
  }
}

async function run() {
  console.log('SUÍTE — AUTOMAÇÃO DE PROSPECÇÃO');

  assert(normalizeBusinessName('  Salão & Estética São João  ') === 'salao e estetica sao joao', 'Normaliza acentos, pontuação e espaços');
  assert(normalizeWebsite('https://WWW.Exemplo.com.br/?utm_source=campanha#contato') === 'exemplo.com.br', 'Normaliza host e remove rastreadores da URL');
  assert(normalizeWebsite('javascript:alert(1)') === null, 'Rejeita esquemas de URL não HTTP');
  assert(normalizeWebsite('https://usuario:senha@exemplo.com') === null, 'Rejeita credenciais embutidas na URL');
  assert(normalizePhone('(51) 99999-1234') === '5551999991234', 'Normaliza telefone local brasileiro');
  assert(normalizePhone('123') === null, 'Rejeita telefone curto');

  const websiteKeyA = await createProspectDedupeKey({ businessName: 'A', websiteUrl: 'https://www.exemplo.com/?utm_source=x' });
  const websiteKeyB = await createProspectDedupeKey({ businessName: 'Nome diferente', websiteUrl: 'https://exemplo.com' });
  assert(Boolean(websiteKeyA) && websiteKeyA === websiteKeyB, 'Deduplicação por URL normalizada é estável');
  const phoneKeyA = await createProspectDedupeKey({ businessName: 'A', phone: '(51) 99999-1234' });
  const phoneKeyB = await createProspectDedupeKey({ businessName: 'B', phone: '+55 51 99999-1234' });
  assert(Boolean(phoneKeyA) && phoneKeyA === phoneKeyB, 'Deduplicação por telefone é estável');
  assert(await createProspectDedupeKey({ businessName: 'Sem localização' }) === null, 'Não inventa chave com dados insuficientes');

  const qualification = qualifyProspect({
    businessName: 'Salão Teste',
    category: 'Salão de beleza',
    websiteUrl: 'https://exemplo.com',
    phone: '(51) 99999-1234',
    sourceUrl: 'https://exemplo.com/sobre',
  });
  assert(qualification.score === 65, 'Pontuação determinística soma apenas evidências presentes');
  assert(qualification.missingFields.includes('email') && qualification.reasons.length === 8, 'Qualificação explica dados ausentes e mantém trilha de razões');

  assert(!isEligibleForAutomatedWhatsApp({ eligibility: 'unknown', whatsappOptInAt: null, optInEvidenceUrl: null }), 'Telefone público não equivale a consentimento para WhatsApp');
  assert(!isEligibleForAutomatedWhatsApp({ eligibility: 'eligible', whatsappOptInAt: '2026-10-20T12:00:00Z', optInEvidenceUrl: 'https://exemplo.com/opt-in', optedOutAt: '2026-10-20T12:01:00Z' }), 'Opt-out sempre bloqueia abordagem automática');
  assert(isEligibleForAutomatedWhatsApp({ eligibility: 'eligible', whatsappOptInAt: '2026-10-20T12:00:00Z', optInEvidenceUrl: 'https://exemplo.com/opt-in' }), 'Abordagem só libera com elegibilidade e evidência de opt-in');

  console.log(`RESULTADO: ${passed} passou / ${failed} falhou`);
  if (failed > 0) process.exit(1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
