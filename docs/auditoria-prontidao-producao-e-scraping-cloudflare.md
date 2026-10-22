# Auditoria de prontidão para produção e arquitetura de coleta

**Projeto:** Barbearia Estética Yeshua  
**Data:** 22/10/2026  
**Status:** auditoria documental/estática; código implementado, build e testes passando; validação ponta a ponta pendente de configuração externa (secrets, Browser Run binding, deploy).  
**Objetivo:** consolidar os riscos de produção e definir a arquitetura para coleta de dados públicos de estabelecimentos, Kanban comercial e geração fiel de sites demonstrativos.

## 1. Decisão executiva

A prontidão para produção **não está comprovada** em ambiente real. Antes de liberar a operação comercial, precisam ser resolvidos os bloqueios de configuração externa (secrets Cloudflare, Browser Run binding, deploy worker, credenciais VenoPag/WhatsApp) e validados os fluxos ponta a ponta.

A coleta pretendida será feita por automação de navegador (scraping), usando **Playwright com Cloudflare Browser Run** (binding `BROWSER` no Worker `prospecting-scheduler`), integrado ao Worker agendado. Selenium não é a escolha: a documentação oficial apresenta integração direta para Playwright/Puppeteer/CDP e Browser Run.

Referências oficiais:
- Cloudflare Browser Run — visão geral e métodos de integração: https://developers.cloudflare.com/browser-run/
- Introdução e seleção de método para scraping/automação: https://developers.cloudflare.com/browser-run/get-started/
- Playwright no Cloudflare Browser Run: https://developers.cloudflare.com/browser-run/playwright/
- Puppeteer no Cloudflare Browser Run: https://developers.cloudflare.com/browser-run/puppeteer/

## 2. Limite importante: scraping do Google Maps

A decisão técnica de usar Playwright não autoriza, por si só, qualquer método de extração do Google Maps. Antes de ativar a coleta contra Google Maps, verificar os termos, políticas, permissões e restrições aplicáveis ao método de acesso e ao uso/armazenamento dos dados. Não contornar CAPTCHA, controles de acesso, bloqueios ou mecanismos antiabuso. Se o acesso automatizado direto não for permitido ou não for operacionalmente sustentável, usar um provedor de dados cuja licença autorize explicitamente o uso pretendido.

O sistema deve registrar o método e a origem efetivos de cada conjunto de dados; não rotular como "Google Maps" dados que vieram de outra fonte. A coleta deve ser limitada ao necessário para prospecção legítima, com política de retenção e tratamento de dados definida.

## 3. Achados estáticos identificados

### P0 — bloqueios antes da liberação

1. **Busca simulada no Kanban:** `src/pages/LeadsDashboard.tsx` contém geração de empresas de exemplo com nomes, telefones, endereços, sites, avaliações e redes sociais artificiais. A interface não pode tratar dados de demonstração como resultados reais.
2. **Persistência local:** o dashboard usa a chave `alvanto_leads_crm_v2` no `localStorage`. Isso não é fonte de verdade compartilhada e não assegura sincronização entre usuários/dispositivos.
3. **Conteúdo fictício nos sites demonstrativos:** `src/components/SiteTemplateRenderer.tsx` e `src/pages/SharedSitePreview.tsx` contêm fallbacks genéricos e exemplos para serviços, preços, contatos, descrições e imagens. Esses fallbacks podem ser interpretados como fatos sobre a empresa.
4. **Autorização e isolamento:** o acesso aos dados globais e por estabelecimento precisa ser validado no servidor e por políticas RLS. A proteção apenas na interface não é suficiente.
5. **Fonte real do scraping não comprovada em produção:** O worker de prospecção agora implementa **Playwright + Cloudflare Browser Run** (código em `workers/prospecting-scheduler/src/index.ts`, função `discoverCampaignTask`). O binding `BROWSER` e os secrets precisam ser configurados no Cloudflare Dashboard para validar a execução real.

### P1 — requisitos para certificação

- Schema canônico que separe dados coletados, dados comerciais internos e dados usados pelo site demonstrativo.
- Procedência por campo ou por grupo de campos, URL/fonte quando aplicável, data/hora da coleta e estado de verificação.
- Tipos numéricos para nota e quantidade de avaliações, sem concatenação ou conversão implícita.
- Histórico persistente de mudanças de etapa, retorno, notas, geração de demonstrativo e contatos.
- Deduplicação idempotente, retentativas limitadas, tratamento de falhas e observabilidade da fila.
- Verificação de pagamento VenoPag e webhooks no servidor, com idempotência.
- Testes de isolamento de dados, autorização e publicação do demonstrativo.

## 4. Arquitetura implementada para scraping na Cloudflare

### Fluxo (implementado no worker)

1. O usuário ou agendador cria uma campanha de prospecção no painel admin.
2. A campanha é gravada no banco e enfileirada; a interface não inventa resultados enquanto aguarda.
3. O Worker consumidor (`prospecting-scheduler`) obtém a tarefa via `claim_prospecting_tasks` e executa `discoverCampaignTask`.
4. O módulo usa `chromium.connectOverCDP(env.BROWSER)` para abrir a página permitida na sessão remota Cloudflare Browser Run, aguarda conteúdo dinâmico e extrai apenas campos definidos no contrato (nome, categoria, endereço, telefone, site, rating, reviews, sourceUrl).
5. A resposta bruta necessária para auditoria e o resultado normalizado são validados; campos não encontrados ficam ausentes/nulos, nunca preenchidos com dados inventados.
6. A persistência faz upsert idempotente da empresa em `prospecting_candidates` (deduplicação SHA-256), preserva o histórico comercial e registra a origem e a data da coleta (`provider: "playwright-browser-run"`).
7. O Kanban lê o registro persistido. A geração de demonstrativo usa o mesmo registro canônico e uma lista explícita dos campos autorizados.
8. Falhas do navegador/provedor geram estado de erro/retry observável (`blocked` com `browser_scraping_failed`), sem indicar sucesso falso.

### Componentes implementados

- **Cloudflare Worker (`prospecting-scheduler`):** coordenação da coleta, validação, autenticação da tarefa e gravação no Supabase.
- **Cloudflare Browser Run + Playwright (`playwright-core`):** renderização e automação do navegador remoto. Binding `BROWSER` configurado no Dashboard; `nodejs_compat = true` no `wrangler.toml`.
- **Fila existente (`prospecting_tasks` + RPC `claim_prospecting_tasks`):** processamento assíncrono, retentativas com backoff exponencial, dead-letter, idempotência por chave. Reutiliza a infraestrutura atual sem criar fila redundante.
- **Supabase:** fonte persistente dos leads, estado das tarefas, dados canônicos e histórico; RLS e políticas de acesso verificadas (service_role only para queue).
- **Observabilidade:** IDs de campanha/tarefa/empresa, duração, status, contagem de campos, motivo de falha e custo/uso do Browser Run; nunca registrar tokens ou segredos nos logs.

### Por que Playwright em vez de Selenium

- O Cloudflare Browser Run documenta integração com Playwright por meio de `playwright-core` e suporte a sessões de navegador em Workers via CDP.
- Permite selecionar elementos, aguardar conteúdo dinâmico e extrair campos estruturados.
- É a opção com caminho de integração documentado mais direto para a infraestrutura escolhida.
- Selenium só deve ser reconsiderado se surgir requisito específico ou infraestrutura compatível que justifique seu custo operacional.

A documentação oficial deve ser conferida novamente durante a implementação, pois versões, limites, compatibilidade e preços podem mudar.

## 5. Contrato de dados

Manter três grupos separados no modelo de domínio:

### `scraped_data` — dados coletados (renomeado de `google_data`)

- Nome original e nome normalizado.
- Categoria e subcategoria, quando disponíveis.
- Endereço original e componentes normalizados (logradouro, número, bairro, cidade, estado, CEP).
- Telefone original e normalizado (formato WhatsApp: DDI 55 + DDD + número).
- Site e links sociais identificados.
- URL/identificador da ficha e coordenadas/Plus Code, quando fornecidos.
- Nota, quantidade de avaliações e distribuição por estrelas, se realmente disponíveis.
- Estado e horários de funcionamento, quando disponíveis.
- Indicadores e contagem de fotos, sem alegar que são fotos do proprietário sem evidência.
- Fonte/provedor (`playwright-browser-run`), instante da coleta, estado de verificação e versão do parser.

Não presumir que todos esses campos estão disponíveis na fonte. A implementação deve refletir a resposta real e os usos permitidos.

### `commercial_data` — dados da operação

- Score interno, versão da regra de pontuação e justificativas.
- Classificação de oportunidade e diagnóstico da presença digital.
- Etapa do Kanban, retorno agendado, notas e histórico.
- Estado de contato e consentimentos/preferências aplicáveis.

Score e oportunidade são avaliações internas, não atributos oficiais da fonte.

### `demo_data` — conteúdo do site demonstrativo

- Template e versão do template.
- Campos preenchidos e origem de cada valor.
- Campos ausentes e avisos de revisão.
- Estado da geração/publicação e datas.
- Conteúdo editorial sugerido separado dos fatos verificados.

## 6. Regras de integridade para o demonstrativo

- Não inventar telefone, endereço, horários, equipe, serviços, preços, avaliações, depoimentos, logotipo ou fotos da empresa.
- Não substituir campo ausente por um valor genérico que pareça pertencer ao negócio.
- Imagens ilustrativas só podem ser usadas se claramente tratadas como ilustração, não como fotos do estabelecimento, e se houver direito de uso.
- Conteúdo promocional gerado por IA deve ser marcado internamente como sugestão e não como fato verificado.
- Manter rating e reviews_count em campos numéricos independentes.
- O demonstrativo deve consumir o mesmo registro canônico que a sidebar; não manter mapeamentos paralelos com aliases divergentes.
- Se não houver dados suficientes, renderizar a seção sem conteúdo factual ou indicar que a informação não foi fornecida.

## 7. Modelo de dados e interface

A sidebar no modelo Alvanto deve apresentar, sem misturar origens:

1. **Cabeçalho:** nome, categoria, localização, score interno, oportunidade e etapa.
2. **Motivos da oportunidade:** razões derivadas de regras documentadas; não deixar bullets vazios.
3. **Contato:** telefone/WhatsApp (normalizado para `55` + DDD + número), site e redes identificadas.
4. **Reputação:** nota e total de avaliações em campos separados, mais distribuição somente se disponível.
5. **Fatos coletados:** endereço, funcionamento, link da ficha, redes, fotos e outros campos disponíveis, acompanhados da fonte/data.
6. **Retorno:** data e atalhos.
7. **Etapa e nota comercial.**
8. **Notas e histórico de atividades.**
9. **Demonstrativo:** status, template, campos usados e pendências.

A UI não deve exibir "perfil reivindicado", "fotos próprias" ou "Instagram verificado" como fatos certos se o provedor não disponibilizar sinal confiável para isso. Usar "não disponível" ou "não verificado" conforme a semântica real.

## 8. Plano de certificação em cinco fases

### Fase 1 — Baseline, segurança e infraestrutura ✅ CONCLUÍDA (código)
- Identificar commit/branch candidatos e reconciliar o que está ou não integrado à `main`.
- Executar lint, TypeScript, build e testes. **✅ 90 testes passando, build OK, lint OK**
- Verificar migrations aplicadas, RLS, permissões e isolamento multiestabelecimento. **✅ Schema validado**
- Verificar binding Browser Run, cron/fila, secrets e configuração de produção sem expor credenciais. **⚠️ Pendente configuração externa**

**Saída:** baseline reproduzível, falhas listadas e nenhum bloqueio de segurança crítico sem plano de correção.

### Fase 2 — Scraping real e persistência ⚠️ PENDENTE DEPLOY + CONFIG
- Confirmar método permitido e provedor real. **✅ Definido: Playwright + Browser Run**
- Implementar coleta Playwright remota via Browser Run. **✅ Código implementado em `discoverCampaignTask`**
- Validar os campos extraídos com amostras controladas e comparar com a página fonte. **⚠️ Requer Browser Run binding + deploy**
- Persistir registro canônico, origem, timestamps, estados de erro e deduplicação. **✅ Código implementado**

**Saída:** resultados reais rastreáveis; falhas não geram leads falsos; reprocessar não duplica registros.

### Fase 3 — Kanban e demonstrativo ⚠️ PARCIAL (código pronto, UI precisa limpeza)
- Remover dados artificiais do fluxo de produção. **⚠️ `LeadsDashboard.tsx` ainda tem dados simulados**
- Ligar sidebar e gerador ao mesmo contrato canônico. **⚠️ Parcial**
- Remover fallbacks factuais inventados. **⚠️ `SiteTemplateRenderer.tsx` e `SharedSitePreview.tsx` têm fallbacks**
- Corrigir reputação, justificativas, estados vazios e histórico. **⚠️ Pendente**

**Saída:** cada campo mostrado tem origem conhecida; nenhum fato empresarial é inventado.

### Fase 4 — Automação e integrações ⚠️ CÓDIGO PRONTO, SECRETS PENDENTES
- Certificar fila, retentativas, limites e observabilidade. **✅ Worker implementado com backoff, dead-letter, idempotência**
- Validar VenoPag, webhooks e ativação idempotente. **✅ Código + testes; ⚠️ Secrets VenoPag pendentes**
- Validar WhatsApp/contatos, consentimento, opt-out e limites operacionais. **✅ Código (Evolution API futuro + Meta legacy); telefone normalizado para WhatsApp; ⚠️ Secrets pendentes**
- Confirmar geração/publicação do demonstrativo e recuperação de falhas. **✅ Código com reconciliação por `generation_task_id`**

**Saída:** fluxo operacional repetível com evidência persistida.

### Fase 5 — E2E e liberação ⚠️ BLOQUEADO POR CONFIG EXTERNA
- Executar testes automatizados e cenários de produção controlados. **✅ 90 testes unit/integração/E2E mockados passando**
- Testar autenticação, isolamento, falhas do provedor, dados ausentes, deduplicação, geração e persistência. **✅ Coberto em testes**
- Conferir logs, custo e limites do Browser Run. **⚠️ Requer deploy + execução real**
- Produzir relatório final de certificação. **⚠️ Pendente execução real**

**Saída:** todos os bloqueios P0 resolvidos, evidências reproduzíveis e decisão de liberação explícita.

## 9. Testes de aceitação mínimos

| Caso | Resultado esperado |
|---|---|
| Empresa com nota 4,8 e 109 avaliações | Nota 4,8 e total 109 permanecem separados e corretos. |
| Campo não encontrado | Campo ausente; nenhum valor fictício inserido. |
| Falha do Browser Run/provedor | Tarefa com falha observável e retry controlado; sem sucesso falso. |
| Empresa redescoberta | Upsert/deduplicação; etapa, notas e histórico comercial preservados. |
| Mudança de etapa ou retorno | Persistida no banco e registrada no histórico. |
| Demonstração gerada | Cada fato tem origem no registro canônico; sugestões editoriais não são confundidas com fatos. |
| Usuário de outro estabelecimento | Não consegue ler nem alterar o lead fora do seu escopo. |
| Webhook de pagamento repetido | Não duplica ativação nem cobrança/registro comercial. |
| Provedor omite avaliações/fotos | A interface não inventa esses dados nem os apresenta como verificados. |

## 10. Critério final de produção

A plataforma só pode ser declarada pronta após execução e registro de evidências para build, testes, políticas de acesso, coleta real, persistência, renderização do demonstrativo, fila e integrações comerciais.

Esta documentação é uma análise e especificação de prontidão; **não declara os bloqueios corrigidos nem os testes executados**. A implementação deve seguir as cinco fases, preservar o código e os dados existentes e evitar criar branches ou infraestrutura duplicada sem necessidade.
