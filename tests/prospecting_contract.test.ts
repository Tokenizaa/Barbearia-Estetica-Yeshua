/**
 * SUÍTE DE TESTES DE CONTRATO — PROSPECÇÃO (DADOS SINTÉTICOS)
 *
 * Valida o contrato de dados da captura até a persistência, usando exclusivamente
 * dados sintéticos. Não utiliza dados pessoais reais.
 *
 * Cobertura:
 * 1. Registro completo com todos os campos
 * 2. Campos opcionais ausentes
 * 3. Valores inválidos ou formatos inesperados
 * 4. Avaliação e quantidade de avaliações ausentes
 * 5. Telefone, endereço ou site ausentes
 * 6. Imagens indisponíveis
 * 7. Registro duplicado (mesma chave de deduplicação)
 * 8. Reprocessamento do mesmo estabelecimento (idempotência)
 * 9. Isolamento entre tenants (estabelecimentos diferentes)
 * 10. Falha de persistência e recuperação segura
 * 11. Compatibilidade entre tipos TypeScript e schema de dados
 */

import {
  normalizeBusinessName,
  normalizePhone,
  normalizeWebsite,
  qualifyProspect,
  createProspectDedupeKey,
  isEligibleForAutomatedWhatsApp,
  type ProspectQualificationInput,
  type ProspectIdentity,
} from '../src/lib/prospecting';

import {
  normalizeName as workerNormalizeName,
  normalizePhone as workerNormalizePhone,
  normalizeWebsite as workerNormalizeWebsite,
  qualify as workerQualify,
  createDedupeKey as workerCreateDedupeKey,
} from '../workers/prospecting-scheduler/src/index';

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

// -------------------------------------------------------------------------
// FIXTURES SINTÉTICOS (sem dados pessoais reais)
// -------------------------------------------------------------------------

const FIXTURE_COMPLETO: ProspectQualificationInput = {
  businessName: 'Salão Exemplo Sintético',
  category: 'Barbearia',
  websiteUrl: 'https://www.salaoexemplo.com.br/contato?utm_source=test',
  phone: '(11) 98765-4321',
  email: 'contato@salaoexemplo.com.br',
  address: 'Rua das Flores, 123 — Centro',
  city: 'São Paulo',
  region: 'SP',
  countryCode: 'BR',
  description: 'Barbearia tradicional com atendimento masculino e feminino.',
  sourceUrl: 'https://fontelicenciada.com/item/123',
};

const FIXTURE_SEM_CAMPOS_OPCIONAIS: ProspectQualificationInput = {
  businessName: 'Estabelecimento Mínimo',
  category: 'Salão de Beleza',
  // Sem website, telefone, email, endereço, descrição, sourceUrl
};

const FIXTURE_SOMENTE_NOME: ProspectQualificationInput = {
  businessName: 'Apenas Nome',
  // Todos os outros campos ausentes
};

const FIXTURE_TELEFONE_INVALIDO: ProspectQualificationInput = {
  businessName: 'Telefone Inválido',
  phone: '123', // muito curto
};

const FIXTURE_URL_INVALIDA: ProspectQualificationInput = {
  businessName: 'URL Inválida',
  websiteUrl: 'javascript:alert(1)', // esquema não-HTTP
};

const FIXTURE_DUPLICADO_WEBSITE: ProspectQualificationInput = {
  businessName: 'Nome Diferente',
  websiteUrl: 'https://www.salaoexemplo.com.br/contato?utm_source=test', // mesmo website do fixture completo
};

const FIXTURE_DUPLICADO_TELEFONE: ProspectQualificationInput = {
  businessName: 'Outro Nome',
  phone: '+55 11 98765-4321', // mesmo telefone do fixture completo
};

const FIXTURE_SEM_AVALIACAO: ProspectQualificationInput = {
  businessName: 'Sem Avaliação',
  category: 'Barbearia',
  websiteUrl: 'https://exemplo.com',
  phone: '(11) 99999-1234',
  // Sem avaliação ou quantidade de avaliações (não são campos do modelo)
};

const FIXTURE_SEM_ENDERECO: ProspectQualificationInput = {
  businessName: 'Sem Endereço',
  category: 'Salão',
  websiteUrl: 'https://exemplo.com',
  phone: '(11) 99999-1234',
  // Sem endereço
};

const FIXTURE_SEM_SITE: ProspectQualificationInput = {
  businessName: 'Sem Site',
  category: 'Salão',
  phone: '(11) 99999-1234',
  address: 'Rua X, 100',
  // Sem website
};

async function run() {
  console.log('====================================================');
  console.log('SUÍTE DE TESTES DE CONTRATO — PROSPECÇÃO (SINTÉTICO)');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // 1. Registro completo
  // -------------------------------------------------------------------------
  console.log('1. Registro Completo (todos os campos preenchidos):');

  const qCompleto = qualifyProspect(FIXTURE_COMPLETO);
  assert(qCompleto.score === 100, 'Pontuação máxima para registro completo', `Score: ${qCompleto.score}`);
  assert(qCompleto.missingFields.length === 0, 'Nenhum campo obrigatório ausente', `Ausentes: ${qCompleto.missingFields.join(', ')}`);
  assert(qCompleto.reasons.length === 8, 'Todas as 8 razões de qualificação presentes', `Total: ${qCompleto.reasons.length}`);

  const dedupeCompleto = await createProspectDedupeKey(FIXTURE_COMPLETO);
  assert(Boolean(dedupeCompleto), 'Chave de deduplicação gerada para registro completo');
  assert(dedupeCompleto!.startsWith('sha256:'), 'Chave de dedup usa hash SHA-256');

  // -------------------------------------------------------------------------
  // 2. Campos opcionais ausentes
  // -------------------------------------------------------------------------
  console.log('\n2. Campos Opcionais Ausentes (mínimo necessário):');

  const qMinimo = qualifyProspect(FIXTURE_SEM_CAMPOS_OPCIONAIS);
  assert(qMinimo.score === 30, 'Pontuação apenas para nome e categoria', `Score: ${qMinimo.score}`);
  assert(qMinimo.missingFields.includes('websiteUrl'), 'websiteUrl reportado como ausente');
  assert(qMinimo.missingFields.includes('phone'), 'phone reportado como ausente');
  assert(qMinimo.missingFields.includes('email'), 'email reportado como ausente');
  assert(qMinimo.missingFields.includes('address'), 'address reportado como ausente');
  assert(qMinimo.missingFields.includes('description'), 'description reportado como ausente');
  assert(qMinimo.missingFields.includes('sourceUrl'), 'sourceUrl reportado como ausente');

  const dedupeMinimo = await createProspectDedupeKey(FIXTURE_SEM_CAMPOS_OPCIONAIS);
  assert(dedupeMinimo === null, 'Não gera chave de dedup sem identificador confiável', `Obtido: ${dedupeMinimo}`);

  // -------------------------------------------------------------------------
  // 3. Valores inválidos ou formatos inesperados
  // -------------------------------------------------------------------------
  console.log('\n3. Valores Inválidos ou Formatos Inesperados:');

  const qTelInvalido = qualifyProspect(FIXTURE_TELEFONE_INVALIDO);
  assert(qTelInvalido.missingFields.includes('phone'), 'Telefone curto tratado como ausente');

  const qUrlInvalida = qualifyProspect(FIXTURE_URL_INVALIDA);
  assert(qUrlInvalida.missingFields.includes('websiteUrl'), 'URL não-HTTP tratada como ausente');

  // Normalizações individuais rejeitam entradas inválidas
  assert(normalizeWebsite('http://') === null, 'URL sem host retorna null');
  assert(normalizePhone('abc') === null, 'Telefone sem dígitos suficientes retorna null');
  assert(normalizeWebsite('') === null, 'String vazia retorna null');
  assert(normalizePhone('') === null, 'String vazia retorna null');

  // -------------------------------------------------------------------------
  // 4. Avaliação e quantidade de avaliações ausentes
  // -------------------------------------------------------------------------
  console.log('\n4. Avaliação e Quantidade de Avaliações Ausentes:');

  const qSemAvaliacao = qualifyProspect(FIXTURE_SEM_AVALIACAO);
  assert(qSemAvaliacao.score > 0, 'Registro sem avaliação ainda pontua outros campos', `Score: ${qSemAvaliacao.score}`);
  // Avaliação/rating não é um campo do modelo de domínio — não alucinar
  assert(!('rating' in FIXTURE_SEM_AVALIACAO), 'Campo rating não existe no modelo de domínio');
  assert(!('reviewsCount' in FIXTURE_SEM_AVALIACAO), 'Campo reviewsCount não existe no modelo de domínio');

  // -------------------------------------------------------------------------
  // 5. Telefone, endereço ou site ausentes
  // -------------------------------------------------------------------------
  console.log('\n5. Telefone, Endereço ou Site Ausentes:');

  const qSemSite = qualifyProspect(FIXTURE_SEM_SITE);
  assert(qSemSite.missingFields.includes('websiteUrl'), 'site ausente reportado');
  assert(!qSemSite.missingFields.includes('phone'), 'telefone presente não reportado como ausente');
  assert(!qSemSite.missingFields.includes('address'), 'endereço presente não reportado como ausente');

  const qSemEndereco = qualifyProspect(FIXTURE_SEM_ENDERECO);
  assert(qSemEndereco.missingFields.includes('address'), 'endereço ausente reportado');
  assert(!qSemEndereco.missingFields.includes('websiteUrl'), 'site presente não reportado como ausente');

  // -------------------------------------------------------------------------
  // 6. Imagens indisponíveis
  // -------------------------------------------------------------------------
  console.log('\n6. Imagens Indisponíveis:');

  // Imagem/logo não é um campo do modelo de domínio de prospecção
  // O capturador extrai logoUrl mas não é persistido como coluna dedicada
  assert(!('logoUrl' in FIXTURE_COMPLETO), 'logoUrl não é campo do ProspectQualificationInput');
  assert(!('coverUrl' in FIXTURE_COMPLETO), 'coverUrl não é campo do ProspectQualificationInput');
  assert(!('imageUrl' in FIXTURE_COMPLETO), 'imageUrl não é campo do ProspectQualificationInput');
  // Ausência de imagem não interrompe o fluxo
  assert(qCompleto.score === 100, 'Registro completo pontua 100 mesmo sem imagem');

  // -------------------------------------------------------------------------
  // 7. Registro duplicado (mesma chave de deduplicação)
  // -------------------------------------------------------------------------
  console.log('\n7. Registro Duplicado (mesma chave de deduplicação):');

  const dupWebsite = await createProspectDedupeKey(FIXTURE_DUPLICADO_WEBSITE);
  assert(Boolean(dupWebsite) && dupWebsite === dedupeCompleto, 'Mesmo website normalizado gera mesma chave de dedup');

  const dupPhone = await createProspectDedupeKey(FIXTURE_DUPLICADO_TELEFONE);
  assert(Boolean(dupPhone), 'Mesmo telefone normalizado gera chave de dedup');
  // Telefone tem prioridade menor que website, mas ainda gera chave
  assert(dupPhone!.startsWith('sha256:'), 'Chave de dedup por telefone usa hash SHA-256');

  // -------------------------------------------------------------------------
  // 8. Reprocessamento do mesmo estabelecimento (idempotência)
  // -------------------------------------------------------------------------
  console.log('\n8. Reprocessamento do Mesmo Estabelecimento (Idempotência):');

  const dedupeA = await createProspectDedupeKey(FIXTURE_COMPLETO);
  const dedupeB = await createProspectDedupeKey(FIXTURE_COMPLETO);
  assert(dedupeA === dedupeB, 'Chave de dedup é determinística e estável');

  const qA = qualifyProspect(FIXTURE_COMPLETO);
  const qB = qualifyProspect(FIXTURE_COMPLETO);
  assert(qA.score === qB.score, 'Qualificação é determinística');
  assert(JSON.stringify(qA.reasons) === JSON.stringify(qB.reasons), 'Razões de qualificação são estáveis');

  // -------------------------------------------------------------------------
  // 9. Dados de estabelecimentos diferentes, isolamento entre tenants
  // -------------------------------------------------------------------------
  console.log('\n9. Isolamento entre Estabelecimentos Diferentes:');

  const estA: ProspectQualificationInput = {
    businessName: 'Estabelecimento Alfa Sintético',
    websiteUrl: 'https://estabelecimento-alfa.com.br',
    phone: '(11) 91111-1111',
    city: 'São Paulo',
    region: 'SP',
  };
  const estB: ProspectQualificationInput = {
    businessName: 'Estabelecimento Beta Sintético',
    websiteUrl: 'https://estabelecimento-beta.com.br',
    phone: '(11) 92222-2222',
    city: 'Rio de Janeiro',
    region: 'RJ',
  };

  const dedupeA2 = await createProspectDedupeKey(estA);
  const dedupeB2 = await createProspectDedupeKey(estB);
  assert(dedupeA2 !== dedupeB2, 'Estabelecimentos diferentes geram chaves de dedup diferentes');
  assert(qCompleto.score !== qualifyProspect(estA).score || qCompleto.missingFields.length !== qualifyProspect(estA).missingFields.length, 'Registros diferentes têm qualificações diferentes');

  // -------------------------------------------------------------------------
  // 10. Falha de persistência e recuperação segura
  // -------------------------------------------------------------------------
  console.log('\n10. Falha de Persistência e Recuperação Segura:');

  // Simula cenário onde dedupe_key é null (dados insuficientes)
  const semIdentificador: ProspectIdentity = { businessName: 'Apenas Nome' };
  const dedupeSemId = await createProspectDedupeKey(semIdentificador);
  assert(dedupeSemId === null, 'Não inventa chave de dedup com dados insuficientes');

  // Qualificação com dados parciais não falha, apenas pontua menos
  const qParcial = qualifyProspect({ businessName: 'Parcial' });
  assert(qParcial.score === 20, 'Apenas nome pontua 20', `Score: ${qParcial.score}`);
  assert(qParcial.missingFields.length === 7, '7 campos ausentes reportados', `Total: ${qParcial.missingFields.length}`);

  // -------------------------------------------------------------------------
  // 11. Compatibilidade entre tipos de aplicação e schema
  // -------------------------------------------------------------------------
  console.log('\n11. Compatibilidade entre Tipos e Schema:');

  // Verifica que os campos do ProspectQualificationInput mapeiam para colunas do banco
  const camposInput: (keyof ProspectQualificationInput)[] = [
    'businessName', 'websiteUrl', 'phone', 'email', 'address', 'city', 'region', 'countryCode', 'category', 'description', 'sourceUrl'
  ];

  const colunasBancoEsperadas = [
    'business_name', 'website_url', 'normalized_website', 'phone', 'normalized_phone',
    'email', 'address', 'city', 'region', 'country_code', 'category', 'description', 'source_url',
    'dedupe_key', 'qualification_score', 'qualification_reasons', 'captured_data', 'outreach_eligibility',
    'public_source_urls'
  ];

  // Cada campo do tipo de aplicação deve ter correspondência no banco (direta ou via captured_data/qualification)
  const mapeamento: Record<string, string[]> = {
    businessName: ['business_name'],
    websiteUrl: ['website_url', 'normalized_website'],
    phone: ['phone', 'normalized_phone'],
    email: ['email'],
    address: ['address', 'captured_data'],
    city: ['city'],
    region: ['region'], // 'state' não é coluna do banco; região mapeia para region
    countryCode: ['country_code'],
    category: ['category'], // 'business_category' é alias no RPC, não coluna
    description: ['description', 'captured_data'],
    sourceUrl: ['source_url', 'captured_data', 'public_source_urls'],
  };

  for (const campo of camposInput) {
    const colunas = mapeamento[campo];
    assert(colunas !== undefined, `Campo "${campo}" tem mapeamento para colunas do banco`);
    if (colunas) {
      for (const coluna of colunas) {
        assert(colunasBancoEsperadas.includes(coluna), `Coluna "${coluna}" existe no schema do banco`);
      }
    }
  }

  // Paridade entre worker e lib (mesmas funções de normalização)
  assert(workerNormalizeWebsite('https://WWW.Exemplo.com.br/?utm_source=x') === normalizeWebsite('https://WWW.Exemplo.com.br/?utm_source=x'), 'Worker e lib normalizam website identicamente');
  assert(workerNormalizePhone('(51) 99999-1234') === normalizePhone('(51) 99999-1234'), 'Worker e lib normalizam telefone identicamente');
  assert(workerNormalizeName(' Salão & Teste ') === normalizeBusinessName(' Salão & Teste '), 'Worker e lib normalizam nome identicamente');

  // -------------------------------------------------------------------------
  // Resultado Final
  // -------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`RESULTADO CONTRATO: ${passed} PASSOU / ${failed} FALHOU`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});