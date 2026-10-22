# Configuração do runtime — prospecção automatizada

## Objetivo

Documentar os secrets e as verificações necessárias antes de habilitar campanhas. Este documento não contém valores secretos. Configure variáveis como secrets no runtime server-side que executa o worker agendado da Cloudflare; nunca as coloque em `VITE_*`, no frontend, em commits ou em URLs.

## Variáveis necessárias

### Cloudflare Pages (Frontend + API)
| Variável | Uso | Estado esperado |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | Obrigatória no servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Validar a sessão administrativa no endpoint de prontidão | Obrigatória no servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso server-side às tabelas operacionais | Obrigatória; nunca expor ao browser |
| `VENOPAG_CLIENT_ID` | Identificador de cliente VenoPag | Obrigatória para cobrança PIX |
| `VENOPAG_CLIENT_SECRET` | Segredo de API VenoPag | Obrigatória para cobrança PIX |
| `VENOPAG_WEBHOOK_SECRET` | Segredo HMAC para validar assinaturas `X-Veno-Signature` | Obrigatória para webhook |
| `WHATSAPP_APP_SECRET` | Segredo do app Meta Developers para validação webhook | Obrigatória para webhook WhatsApp (Meta) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token para handshake `hub.verify_token` da Meta | Obrigatória para webhook WhatsApp (Meta) |

### Cloudflare Worker (prospecting-scheduler)
| Variável | Uso | Estado esperado |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | Obrigatória (secret) |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso server-side com role de serviço | Obrigatória (secret) |
| `PROSPECTING_WORKER_SECRET` | Autenticar execuções manuais internas do worker | Obrigatória (secret) |
| `PROSPECTING_BATCH_SIZE` | Limite de tarefas por execução | Opcional; padrão 10, máximo 25 (var) |
| `BROWSER` | Binding Cloudflare Browser Run para Playwright | Obrigatória (binding no Dashboard) |

### WhatsApp — Evolution API (futuro) ou manual por enquanto
| Variável | Uso | Estado esperado |
|---|---|---|
| `WHATSAPP_EVOLUTION_URL` | URL base da instância Evolution API | Futuro (secret) |
| `WHATSAPP_EVOLUTION_API_KEY` | Chave de API da instância Evolution | Futuro (secret) |
| `WHATSAPP_EVOLUTION_INSTANCE` | Nome da instância Evolution | Futuro (secret) |

### Legacy Meta Cloud API (mantido para compatibilidade futura)
| Variável | Uso | Estado esperado |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Credencial do WhatsApp Business Platform | Legacy (secret) |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador do número de envio no provedor | Legacy (secret) |
| `WHATSAPP_TEMPLATE_NAME` | Modelo de mensagem aprovado pelo provedor | Legacy (secret) |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Código de idioma do modelo | Legacy (opcional; padrão `pt_BR`) |
| `WHATSAPP_API_VERSION` | Versão suportada da Graph API usada pela conta Meta | Legacy (obrigatória se usar Meta) |
| `WHATSAPP_APP_SECRET` | Validar assinatura HMAC de webhooks | Legacy (secret) |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Validar desafio inicial do webhook | Legacy (secret) |

**Importante:** O telefone do estabelecimento é normalizado automaticamente para formato WhatsApp (DDI 55 + DDD + número, ex: `5511999999999`) pela função `normalizePhone`. Isso serve tanto para Evolution API quanto para Meta Cloud API.

Não usar uma chave de Google Maps/Places como padrão para montar lista de prospecção sem validar expressamente os termos do provedor para armazenamento e uso comercial dos dados. A descoberta é feita via **Playwright + Cloudflare Browser Run** (scraping direto em páginas permitidas), respeitando `robots.txt`, termos de uso, rate limits e CAPTCHAs. O sistema registra a origem e o método de cada conjunto de dados coletados.

## Diagnóstico de prontidão

Endpoints implementados: `GET /api/prospecting/readiness`, `GET /api/prospecting/overview` e `GET /api/prospecting/demo-links` (este último lista links ativos das tarefas de publicação concluídas e exige membership em `platform_admins`).

- Exige sessão Supabase válida e membership administrativo na tabela canônica `platform_admins`.
- Verifica se as tabelas de campanha, fila, eventos, mensagens e versões existem e podem ser consultadas pelo servidor.
- Verifica a presença dos grupos de credenciais necessários sem retornar seus valores.
- Responde `ready_for_integration_tests` apenas quando todos os checks de configuração passam; caso contrário, responde `blocked` com motivos acionáveis.
- O endpoint verifica configuração e acesso ao esquema, **não prova** que um provedor aceita credenciais, que um job conclui ou que uma mensagem é enviada.
- Como o arquivo está em `functions/api`, ele precisa ser servido por um runtime compatível com Cloudflare Pages Functions. Um build de frontend no Vercel, por si só, não comprova que essa rota está publicada.

## Worker e agendamento

- Worker: `workers/prospecting-scheduler/src/index.ts`.
- Configuração do agendamento: `wrangler.prospecting-scheduler.toml`.
- Frequência configurada: a cada 5 minutos (`*/5 * * * *`), em lotes de até 10 tarefas por execução.
- O worker usa a RPC `claim_prospecting_tasks` com credencial `service_role`, processa a fila sequencialmente, registra eventos idempotentes e aplica backoff exponencial limitado para falhas transitórias.
- O worker agenda campanhas ativas com `next_run_at`, cria tarefas idempotentes e avança a próxima execução conforme `schedule.interval_minutes` (mínimo 5 minutos; padrão 24 horas).
- **`discover` usa Playwright via Cloudflare Browser Run** (binding `BROWSER`). O worker abre uma página remota, navega até a fonte permitida (ex: Google Maps search), aguarda conteúdo dinâmico, extrai campos estruturados (nome, categoria, endereço, telefone, site, rating, reviews, sourceUrl) e persiste candidatos em `prospecting_candidates` com deduplicação SHA-256. O provedor registrado é `playwright-browser-run`. Respeita limites de taxa, CAPTCHAs e termos de uso.
- Os candidatos são persistidos em `prospecting_candidates`, deduplicados por SHA-256 e qualificados com pontuação explicável. A campanha respeita o limite diário por contagem de candidatos persistidos.
- `capture` promove candidatos para `prospects` por RPC que mapeia apenas colunas existentes no esquema legado e preserva endereço, descrição, origem e evidências em `captured_data`, `qualification` e `public_source_urls` quando essas colunas existem. Em seguida cria tarefa idempotente de qualificação. O mapeamento SQL precisa ser validado no banco real antes da integração.
- `send_whatsapp` tem handler para **Evolution API (futuro)** e **Meta Cloud API (legacy)**. Exige elegibilidade explícita, timestamp e evidência de opt-in, telefone válido (normalizado para WhatsApp: `55` + DDD + número) e ausência de opt-out. Só marca `sent` após receber ID de mensagem do provedor; tentativas de resultado ambíguo ficam bloqueadas para reconciliação, evitando reenvio cego.
- Webhook: `POST /api/webhooks/whatsapp`; valida `X-Hub-Signature-256` por HMAC-SHA256 com `WHATSAPP_APP_SECRET` (Meta). O `GET` implementa o desafio de verificação com `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Recibos atualizam o estado persistido; mensagens com palavras de opt-out (`SAIR`, `PARAR`, `CANCELAR`, `STOP`, `UNSUBSCRIBE`, `NÃO QUERO`) bloqueiam novos envios para o telefone identificado. Para Evolution API, configurar webhook na instância.
- Após a qualificação, prospects com pontuação mínima configurada (padrão 50) passam pelo RPC idempotente `ensure_prospect_site_project`, que associa o prospect a um projeto em `site_projects`. A tarefa `generate_demo` resolve a versão de modelo publicada e persiste a demonstração em `site_project_versions`; `generation_task_id` e índice único permitem reconciliar uma versão já gravada se a execução falhar antes de concluir a tarefa, evitando duplicação em retry. Depois de persistir a versão, o worker enfileira automaticamente `publish_demo`; o link expira em 14 dias por padrão. A migration `20261020193000_prospect_demo_project_automation.sql` adiciona o vínculo, o RPC de criação e a chave de idempotência da geração.
- `publish_demo` cria link público temporário com token aleatório de alta entropia; apenas o hash é persistido na tabela de links. O token retornado fica no resultado privado da tarefa, acessível somente ao servidor. `sync_delivery` permanece desnecessário para o fluxo de recibos atual e continua bloqueado; os webhooks atualizam diretamente as mensagens.
- A landing pública `/demo/:token` apresenta uma prévia comercial baseada na configuração publicada do modelo (layout, seções e paleta) e nos dados persistidos do negócio, e permite selecionar uma versão. A página reutiliza o componente compartilhado `SharedSitePreview` da plataforma e apresenta a proposta completa com contato e identidade do modelo; ainda é um snapshot de demonstração, não a execução/publicação do site em domínio próprio. O token aleatório tem validade limitada; o hash fica na tabela de links e o token em texto aparece somente no resultado privado da tarefa de publicação para que o console administrativo autorizado consiga recuperar o link. A seleção usa RPC server-side.
- Para configurar os secrets no ambiente Cloudflare do worker, execute os comandos abaixo a partir da raiz do repositório e informe os valores de forma interativa:

  ```sh
  npx wrangler secret put SUPABASE_URL --config wrangler.prospecting-scheduler.toml
  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.prospecting-scheduler.toml
  npx wrangler secret put PROSPECTING_WORKER_SECRET --config wrangler.prospecting-scheduler.toml
  # Futuro (Evolution API):
  # npx wrangler secret put WHATSAPP_EVOLUTION_URL --config wrangler.prospecting-scheduler.toml
  # npx wrangler secret put WHATSAPP_EVOLUTION_API_KEY --config wrangler.prospecting-scheduler.toml
  # npx wrangler secret put WHATSAPP_EVOLUTION_INSTANCE --config wrangler.prospecting-scheduler.toml
  ```

- **Binding Browser Run:** No Cloudflare Dashboard: Workers & Pages → `barbearia-yeshua-prospecting-scheduler` → Settings → Bindings → Browser → `BROWSER`.
- O arquivo de configuração apenas define o cron. O agendamento só fica ativo depois que este worker for implantado na conta Cloudflare correta, seus secrets configurados e o binding `BROWSER` criado. Não foi feito deploy nesta etapa.

## Regras de segurança e operação

- Não configurar campanhas ativas até que a fonte de descoberta (Browser Run + Playwright) esteja validada em ambiente controlado.
- Não enviar WhatsApp apenas porque existe um telefone público. Exigir elegibilidade explícita, base legal aplicável, opt-in documentado quando exigido pelo canal e ausência de opt-out.
- Manter tokens e chaves somente como secrets server-side.
- A fila deve ser executada por scheduler/worker autenticado, com idempotência, retentativas limitadas e logs. Tarefas esgotadas são movidas para `dead_letter` quando o lease expirado é recuperado.
- Não marcar mensagem como enviada sem confirmação do provedor.
- Não publicar o endpoint ou habilitar envios reais até executar teste autenticado em ambiente controlado.
- **Scraping:** Registrar método e origem efetivos de cada conjunto de dados; não rotular como "Google Maps" dados que vieram de outra fonte. Limitar coleta ao necessário para prospecção legítima, com política de retenção e tratamento de dados definida.

## Estado em 2026-10-22

O worker, agendamento, persistência de candidatos, promoção para prospects, handler de WhatsApp (Evolution API futuro + Meta legacy), webhook de recibos/opt-out, console administrativo e landing pública de seleção foram adicionados à branch. Build, TypeScript e testes passam. As migrations recentes já estão no repositório e precisam ser aplicadas no Supabase. O cron está configurado no arquivo Wrangler, mas não está ativo até o deploy do worker, configuração dos secrets e criação do binding `BROWSER`. A descoberta usa **Playwright + Cloudflare Browser Run** (scraping direto) em vez de provedor HTTP externo. A criação automática de projeto, geração de versão e enfileiramento de publicação foram conectados no código; a execução real continua condicionada à aplicação das migrations, existência de um template compatível e validação do esquema legado. A prévia pública é estruturada, não um renderer integral do template. `sync_delivery` permanece sem handler porque os webhooks atualizam as mensagens diretamente. WhatsApp por enquanto é manual (telefone normalizado disponível para o número do salão cadastrado); Evolution API será implementada no futuro.