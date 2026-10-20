# Prospecção automatizada — estado atual e contrato de implementação

> **Documento atualizado em 2026-10-20.** Esta versão substitui as instruções anteriores que limitavam a prospecção a operações manuais, armazenamento local ou envio assistido. A fonte funcional principal é `docs/PRODUCT_FLOW_BASELINE_AND_PHASE1_READINESS.md`.

## Objetivo

Executar automaticamente o ciclo de aquisição comercial: descobrir negócios por campanha, capturar e rastrear evidências, normalizar e deduplicar, qualificar, gerar uma demonstração versionada, disponibilizar uma landing page comercial pública e iniciar contato por integração autorizada quando houver elegibilidade comprovada. A tela do navegador não pode ser requisito para processar tarefas.

## Estado implementado nesta etapa

- `functions/api/capture.ts`: captura metadados de uma URL pública já conhecida. Não descobre negócios sozinha.
- `src/pages/LeadsDashboard.tsx`: painel legado com operações manuais e persistência em `localStorage`; ainda não é o repositório operacional compartilhado.
- `src/pages/SharedSitePreview.tsx`: prévia por payload no URL; ainda não é um projeto público persistido no servidor.
- `supabase/migrations/20261020180000_prospecting_automation_foundation.sql`: cria tabelas para campanhas, tarefas duráveis, eventos, mensagens e versões de projetos, além de campos de normalização e deduplicação.
- `supabase/migrations/20261020180100_prospecting_worker_rpc.sql`: adiciona reivindicação atômica de tarefas com `FOR UPDATE SKIP LOCKED`, limite de tentativas e recuperação de locks antigos.
- `src/lib/prospecting.ts`: funções determinísticas para normalização, chave de deduplicação, qualificação explicável e bloqueio de WhatsApp sem evidência de opt-in.
- `tests/prospecting_automation.test.ts`: testes para as funções de domínio da prospecção, incluídos no comando `npm test`.

A existência desses arquivos não comprova que as migrations estejam aplicadas no Supabase, que secrets estejam configurados ou que haja um fornecedor de descoberta/WhatsApp conectado. Essas condições permanecem gates explícitos de prontidão.

## Modelo de domínio

### Campanha

Cada campanha guarda segmento, região, país, fonte/provedor configurado, regras de qualificação, agenda, limite de descoberta e estado operacional. Uma campanha sem fonte autorizada e credenciais válidas deve ficar bloqueada com motivo explícito; não deve recorrer silenciosamente a cadastro manual.

### Prospect

O registro preserva os dados originais, fontes públicas, data de captura, evidências, dados normalizados, chave persistente de deduplicação e pontuação acompanhada de razões. Ausência de informação não pode ser preenchida com fatos inventados. A pontuação de oportunidade não equivale a autorização para contato.

### Fila e recuperação

As tarefas possuem chave de idempotência, estado, agenda de execução, tentativas, lock, erro e resultado. Workers devem reivindicar tarefas atomicamente, repetir apenas falhas transitórias e encaminhar falhas persistentes para estado terminal. Não registrar sucesso sem evidência da etapa executada.

### Eventos e mensagens

Eventos do funil são rastreáveis e idempotentes. Mensagens distinguem fila, tentativa, envio confirmado, entrega/leitura quando o provedor informar, falha, resposta e opt-out. Copiar um link ou enfileirar uma mensagem não equivale a envio.

### Demonstração e versões

Cada projeto deve ter um identificador persistente e estar vinculado ao prospect. Cada versão registra o modelo exato e o conteúdo correspondente. O link público precisa ser estável, funcionar sem sessão administrativa e expor somente os dados necessários à demonstração.

## Elegibilidade para WhatsApp

- Telefone público não significa consentimento para receber marketing pelo WhatsApp.
- O envio automático só pode ocorrer após validação da política do provedor, da base legal aplicável e da elegibilidade do destinatário.
- O estado de opt-out bloqueia novas abordagens.
- Cada tentativa e transição deve ser registrada com a evidência fornecida pelo provedor.
- Sem credenciais ou configuração válida, a etapa fica bloqueada; não há fallback obrigatório para envio manual nem simulação de sucesso.

## Critérios de aceite

1. A campanha inicia descoberta sem cadastro individual de cada estabelecimento.
2. A fonte, data e evidência são preservadas.
3. Duplicatas entre campanhas e execuções concorrentes são impedidas pelo banco.
4. Qualificação é automática, determinística e explicável, sem transformar score em consentimento.
5. O projeto e suas versões são persistidos e acessíveis por URL pública estável.
6. A landing page comercial permite comparar e selecionar modelos, com persistência da escolha.
7. O pipeline opera sem navegador aberto e recupera falhas com idempotência.
8. O envio de WhatsApp depende de integração real e elegibilidade comprovada.
9. Build, lint, testes, RLS e fluxo E2E são executados e suas evidências registradas.
10. Nenhuma migration é considerada aplicada até validar o banco alvo e as políticas efetivas.

## Fora do escopo desta etapa

Cadastro final de cliente, checkout, pagamento, ativação da assinatura, editor privado completo e publicação definitiva do site pertencem às fases posteriores. O código existente dessas partes deve ser preservado, sem desviar o foco da prospecção e da demonstração.
