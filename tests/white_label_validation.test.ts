// Polyfill localStorage and sessionStorage for Node.js test environment
const storageStore = new Map<string, string>();
const sessionStore = new Map<string, string>();

(globalThis as any).localStorage = {
  getItem: (k: string) => storageStore.get(k) ?? null,
  setItem: (k: string, v: string) => storageStore.set(k, String(v)),
  removeItem: (k: string) => storageStore.delete(k),
  clear: () => storageStore.clear(),
};

(globalThis as any).sessionStorage = {
  getItem: (k: string) => sessionStore.get(k) ?? null,
  setItem: (k: string, v: string) => sessionStore.set(k, String(v)),
  removeItem: (k: string) => sessionStore.delete(k),
  clear: () => sessionStore.clear(),
};

import { store } from '../src/data/store';

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

console.log('====================================================');
console.log('SUÍTE DE TESTES — PLATAFORMA WHITE LABEL MULTIESTABELECIMENTO');
console.log('====================================================\n');

// 1. O Yeshua continua funcionando após a migração
console.log('1. Teste de Migração e Preservação do Yeshua:');
const defaultTenant = store.getCurrentEstablishment();
assert(
  defaultTenant.id === 'est-yeshua',
  'Estabelecimento padrão é o Yeshua (est-yeshua)',
  `Obtido: ${defaultTenant.id}`
);
assert(
  defaultTenant.name.includes('Yeshua') || defaultTenant.name.includes('Salão Modelo'),
  'Nome do estabelecimento padrão é válido (Yeshua ou Salão Modelo)',
  `Obtido: ${defaultTenant.name}`
);
assert(
  defaultTenant.isDefault === true,
  'Yeshua possui flag isDefault=true para proteção contra exclusão'
);
// Autenticar como Super Admin para acessar dados dos estabelecimentos
store.loginSuperAdmin();
const yeshuaServices = store.getServices('est-yeshua');
assert(
  yeshuaServices.length >= 6,
  'Serviços originais do Yeshua foram preservados (>= 6 serviços)',
  `Total: ${yeshuaServices.length}`
);
const yeshuaProducts = store.getProducts('est-yeshua');
assert(
  yeshuaProducts.length >= 3,
  'Produtos originais do Yeshua foram preservados (>= 3 produtos)',
  `Total: ${yeshuaProducts.length}`
);

// 2. Administrador Geral consegue cadastrar e editar estabelecimentos
console.log('\n2. Teste do Administrador Geral (Cadastro e Edição):');
const superLogin = store.loginSuperAdmin();
assert(superLogin.success === true, 'Super Admin autenticado');
assert(
  store.getCurrentSession()?.role === 'super_admin',
  'Sessão confirmada com papel super_admin'
);

const newTenant = store.addEstablishment({
  name: 'Barbearia Vintage Alfa',
  slug: 'vintage-alfa',
  tagline: 'Cortes Retrô & Lounge',
  status: 'active',
  theme: 'sapphire',
  primaryColor: '#3b82f6',
  logoUrl: 'https://example.com/logo-alfa.jpg',
  whatsapp: '+55 92 98111-2233',
  whatsappClean: '5592981112233',
  address: 'Rua das Flores, 100',
  cityState: 'Manaus — AM',
  adminName: 'Gerente Alfa',
});

assert(
  newTenant.id.startsWith('est-'),
  'Novo estabelecimento cadastrado com ID único gerado',
  newTenant.id
);
assert(
  store.getEstablishmentById(newTenant.id)?.name === 'Barbearia Vintage Alfa',
  'Estabelecimento consultável por ID no repositório'
);

// Edição
store.updateEstablishment(newTenant.id, { tagline: 'Cortes Retrô, Barba & Lounge VIP' });
assert(
  store.getEstablishmentById(newTenant.id)?.tagline === 'Cortes Retrô, Barba & Lounge VIP',
  'Estabelecimento editado com sucesso pelo Super Admin'
);

// 3. Administrador Local consegue operar seu estabelecimento
console.log('\n3. Teste do Administrador Local (Operação no Estabelecimento):');
store.logout();
const localLogin = store.loginLocalAdmin('', newTenant.id);
assert(localLogin.success === true, 'Admin local autenticado no novo estabelecimento');
assert(
  store.getCurrentSession()?.role === 'establishment_admin',
  'Sessão autenticada com papel establishment_admin'
);
assert(
  store.getCurrentSession()?.establishmentId === newTenant.id,
  'Sessão vinculada estritamente ao novo estabelecimento'
);

// Adicionar serviço no estabelecimento novo
const addedSrv = store.addService(
  {
    name: 'Corte Degradê Alfa',
    category: 'Barbearia',
    description: 'Corte vintage moderno',
    price: 60,
    featured: true,
  },
  newTenant.id
);
assert(
  addedSrv.establishmentId === newTenant.id,
  'Novo serviço carimbado com establishmentId do tenant'
);

// 4. Administrador Local NÃO consegue acessar dados de outro estabelecimento (isolamento multi-tenant)
console.log('\n4. Teste de Isolamento de Acesso entre Estabelecimentos:');
store.logout();
const crossTenantLogin = store.loginLocalAdmin('', newTenant.id);
assert(
  crossTenantLogin.success === true,
  'Admin local autenticado no estabelecimento Alfa'
);
// Tentativa de ler serviços do Yeshua a partir da sessão do Alfa deve falhar
const crossAccess = store.requireTenantAccess('est-yeshua');
assert(
  crossAccess.ok === false,
  'Sessão do estabelecimento Alfa NÃO consegue acessar dados do Yeshua (isolamento multi-tenant)'
);
if (!crossAccess.ok) {
  assert(
    crossAccess.message === 'Acesso negado a dados de outro estabelecimento.',
    'Mensagem de isolamento de tenant está correta'
  );
}

// 5. Usuário comum não consegue acessar áreas administrativas sem sessão válida
console.log('\n5. Teste de Proteção contra Acesso Indevido de Usuário Comum:');
store.logout();
assert(
  store.getCurrentSession() === null,
  'Usuário comum sem sessão não possui token'
);
// Sem sessão, operações de gravação são rejeitadas
const writeAuth = store.requireWriteAuth();
assert(
  writeAuth.ok === false,
  'Usuário sem sessão não pode executar operações de gravação'
);
if (!writeAuth.ok) {
  assert(
    writeAuth.message === 'Sessão não autenticada.',
    'Mensagem de sessão não autenticada está correta'
  );
}
// Operações de leitura com isolamento de tenant também falham sem sessão
const tenantAccess = store.requireTenantAccess('est-yeshua');
assert(
  tenantAccess.ok === false,
  'Usuário sem sessão não pode acessar dados de nenhum estabelecimento'
);
if (!tenantAccess.ok) {
  assert(
    tenantAccess.message === 'Sessão não autenticada.',
    'Mensagem de sessão não autenticada para isolamento de tenant está correta'
  );
}

// 6. Admin local não consegue alterar configurações da plataforma (apenas super_admin)
console.log('\n6. Teste de Bloqueio de Alteração de Configurações da Plataforma por Admin Local:');
store.logout();
const platformLogin = store.loginLocalAdmin('', newTenant.id);
assert(
  platformLogin.success === true,
  'Admin local autenticado no estabelecimento Alfa'
);
// Admin local tentando alterar configuração da plataforma deve falhar
try {
  store.updatePlatformConfig({ platformName: 'Hackeado' });
  assert(false, 'Admin local conseguiu alterar configuração da plataforma (deveria falhar)');
} catch (err) {
  assert(
    String(err).includes('Apenas super_admin'),
    'Admin local é bloqueado ao tentar alterar configurações da plataforma'
  );
}
// Logout e voltar como super_admin para continuar os testes
store.logout();
store.loginSuperAdmin();

// 7. Consultas e alterações respeitam o isolamento de dados
console.log('\n7. Teste de Isolamento de Dados Operacionais:');
const yeshuaServicesCheck = store.getServices('est-yeshua');
const alfaServicesCheck = store.getServices(newTenant.id);
const hasCrossLeaked = yeshuaServicesCheck.some((s) => s.id === addedSrv.id);
assert(
  !hasCrossLeaked,
  'Serviço do tenant Alfa NÃO aparece na lista do Yeshua (sem vazamento de dados)'
);
const alfaHasOnlyItsServices = alfaServicesCheck.every(
  (s) => s.establishmentId === newTenant.id
);
assert(
  alfaHasOnlyItsServices,
  'Tenant Alfa só enxerga serviços explicitamente pertencentes a ele'
);

// 8. Identidade visual de cada estabelecimento é independente
console.log('\n8. Teste de Independência de Identidade Visual e Branding:');
const yeshuaEst = store.getEstablishmentById('est-yeshua');
const alfaEst = store.getEstablishmentById(newTenant.id);
assert(
  yeshuaEst?.theme === 'amber' && alfaEst?.theme === 'sapphire',
  'Temas independentes (Yeshua: amber, Alfa: sapphire)'
);
assert(
  yeshuaEst?.primaryColor !== alfaEst?.primaryColor,
  'Cores primárias distintas e configuráveis por estabelecimento'
);
assert(
  yeshuaEst?.whatsapp !== alfaEst?.whatsapp,
  'Canais de WhatsApp independentes para roteamento de pedidos'
);

// 9. Auditoria de Ações Privilegiadas
console.log('\n9. Teste de Registro de Auditoria:');
const logs = store.getAuditLogs();
assert(
  logs.length >= 3,
  'Logs de auditoria registram ações de cadastro, status e autenticação',
  `Total de logs: ${logs.length}`
);

// 10. Proteção de Exclusão do Yeshua
console.log('\n10. Teste de Proteção do Estabelecimento Raiz:');
store.loginSuperAdmin();
const attemptDeleteYeshua = store.deleteEstablishment('est-yeshua');
assert(
  attemptDeleteYeshua === false,
  'Sistema bloqueia tentativa de exclusão do estabelecimento padrão Yeshua'
);

console.log('\n====================================================');
console.log(`RESULTADO FINAL: ${passed} PASSOU / ${failed} FALHOU`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
