# Configuração do runtime — prospecção automatizada

## Objetivo

Documentar os secrets e as verificações necessárias antes de habilitar campanhas. Este documento não contém valores secretos. Configure variáveis como secrets no runtime server-side que executa o worker agendado da Cloudflare; nunca as coloque em `VITE_*`, no frontend, em commits ou em URLs.

## Variáveis necessárias

| Variável | Uso | Estado esperado |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | Obrigatória no servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Validar a sessão administrativa no endpoint de prontidão | Obrigatória no servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso server-side às tabelas operacionais | Obrigatória; nunca expor ao browser |
| `PROSPECTING_WORKER_SECRET` | Autenticar execuções manuais internas do worker | Obrigatória antes de executar jobs |
| `PROSPECTING_BATCH_SIZE` | Limite de tarefas por execução | Opcional; padrão 10, máximo 25 |
| `PROSPECTING_SOURCE_PROVIDER` | Identificador do fornecedor de descoberta aprovado | Pendente de seleção/configuração |
| `PROSPECTING_SOURCE_ENDPOINT` | Endpoint HTTPS do adaptador autorizado de descoberta | Pendente de seleção/configuração |
| `PROSPECTING_SOURCE_API_KEY` | Credencial do fornecedor de descoberta, quando exigida | Pendente de seleção/configuração |
| `WHATSAPP_ACCESS_TOKEN` | Credencial do WhatsApp Business Platform | Pendente de configuração |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador do número de envio no provedor | Pendente de configuração |
| `WHATSAPP_TEMPLATE_NAME` | Modelo de mensagem aprovado pelo provedor | Pendente de configuração |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Código de idioma do modelo | Opcional; padrão `pt_BR` |
| `WHATSAPP_API_VERSION` | Versão suportada da Graph API usada pela conta Meta | Obrigatória; configurar explicitamente |
| `WHATSAPP_APP_SECRET` | Validar assinatura HMAC de webhooks | Pendente de configuração |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Validar desafio inicial do webhook | Pendente de configuração |

Não usar uma chave de Google Maps/Places como padrão para montar lista de prospecção sem validar expressamente os termos do provedor para armazenamento e uso comercial dos dados. O provedor de descoberta precisa autorizar a finalidade pretendida, respeitar limites e fornecer evidência de origem.

## Diagnóstico de prontidão

Endpoint implementado: `GET /api/prospecting/readiness`.

- Exige sessão Supabase válida e membership administrativo na tabela canônica `platform_admins`.
- Verifica se as tabelas de campanha, fila, eventos, mensagens e versões existem e podem ser consultadas pelo servidor.
- Verifica a presença dos grupos de credenciais necessários sem retornar seus valores.
- Responde `ready_for_integration_tests` apenas quando todos os checks de configuração passam; caso contrário, responde `blocked` com motivos acionáveis.
- O endpoint verifica configuração e acesso ao esquema, não prova que um provedor aceita credenciais, que um job conclui ou que uma mensagem é enviada.
- Como o arquivo está em `functions/api`, ele precisa ser servido por um runtime compatível com Cloudflare Pages Functions. Um build de frontend no Vercel, por si só, não comprova que essa rota está publicada.

## Worker e agendamento

- Worker: `workers/prospecting-scheduler/src/index.ts`.
- Configuração do agendamento: `wrangler.prospecting-scheduler.toml`.
- Frequência configurada: a cada 5 minutos (`*/5 * * * *`), em lotes de até 10 tarefas por execução.
- O worker usa a RPC `claim_prospecting_tasks` com credencial `service_role`, processa a fila sequencialmente, registra eventos idempotentes e aplica backoff exponencial limitado para falhas transitórias.
- O worker agenda campanhas ativas com `next_run_at`, cria tarefas idempotentes e avança a próxima execução conforme `schedule.interval_minutes` (mínimo 5 minutos; padrão 24 horas).
- `discover` chama o adaptador configurado em `PROSPECTING_SOURCE_ENDPOINT` via HTTPS e exige resposta JSON com `results` ou `candidates`; cada candidato precisa conter nome e identidade deduplicável (site, telefone ou nome+localização). O endpoint e o provedor devem ser aprovados conforme os termos de uso antes da ativação.
- Os candidatos são persistidos em `prospecting_candidates`, deduplicados por SHA-256 e qualificados com pontuação explicável. A campanha respeita o limite diário por contagem de candidatos persistidos.
- `capture` promove candidatos para `prospects` por RPC que mapeia apenas colunas existentes no esquema legado, e cria tarefa idempotente de qualificação. O mapeamento ainda exige validação no banco real.
- `send_whatsapp` tem handler para WhatsApp Business Platform. Exige elegibilidade explícita, timestamp e evidência de opt-in, telefone válido e ausência de opt-out. Só marca `sent` após receber ID de mensagem do provedor; tentativas de resultado ambíguo ficam bloqueadas para reconciliação, evitando reenvio cego.
- Webhook: `POST /api/webhooks/whatsapp`; valida `X-Hub-Signature-256` por HMAC-SHA256 com `WHATSAPP_APP_SECRET`. O `GET` implementa o desafio de verificação com `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Recibos atualizam o estado persistido; mensagens com palavras de opt-out (`SAIR`, `PARAR`, `CANCELAR`, `STOP`, `UNSUBSCRIBE`, `NÃO QUERO`) bloqueiam novos envios para o telefone identificado.
- Após a qualificação, prospects com pontuação mínima de 50 passam pelo RPC idempotente `ensure_prospect_site_project`, que associa o prospect a um único projeto em `site_projects`. A tarefa `generate_demo` usa o projeto e resolve a versão de modelo mais recente em `site_template_versions` quando `templateVersionId` não foi informado. Depois de persistir a versão em `site_project_versions`, o worker enfileira automaticamente `publish_demo`; o link expira em 14 dias por padrão. A migration `20261020193000_prospect_demo_project_automation.sql` adiciona o vínculo e o RPC de criação.
- `publish_demo` cria link público temporário com token aleatório de alta entropia; apenas o hash é persistido na tabela de links. O token retornado fica no resultado privado da tarefa, acessível somente ao servidor. `sync_delivery` permanece desnecessário para o fluxo de recibos atual e continua bloqueado; os webhooks atualizam diretamente as mensagens.
- A landing pública `/demo/:token` apresenta uma prévia comercial estruturada a partir dos dados persistidos (identidade, chamada principal, descrição, serviços e contato quando disponíveis) e permite selecionar uma versão. A página ainda não renderiza o template de produção como um site navegável completo; essa integração depende do contrato real do renderer de templates. O token aleatório tem validade limitada, somente seu hash é armazenado e a seleção usa RPC server-side.
- Para configurar os secrets no ambiente Cloudflare do worker, execute os comandos abaixo a partir da raiz do repositório e informe os valores de forma interativa:

  ```sh
  npx wrangler secret put SUPABASE_URL --config wrangler.prospecting-scheduler.toml
  npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.prospecting-scheduler.toml
  npx wrangler secret put PROSPECTING_WORKER_SECRET --config wrangler.prospecting-scheduler.toml
  ```

- O arquivo de configuração apenas define o cron. O agendamento só fica ativo depois que este worker for implantado na conta Cloudflare correta e seus secrets forem configurados. Não foi feito deploy nesta etapa.

## Regras de segurança e operação

- Não configurar campanhas ativas até que a fonte de descoberta esteja aprovada e validada.
- Não enviar WhatsApp apenas porque existe um telefone público. Exigir elegibilidade explícita, base legal aplicável, opt-in documentado quando exigido pelo canal e ausência de opt-out.
- Manter tokens e chaves somente como secrets server-side.
- A fila deve ser executada por scheduler/worker autenticado, com idempotência, retentativas limitadas e logs. Tarefas esgotadas são movidas para `dead_letter` quando o lease expirado é recuperado.
- Não marcar mensagem como enviada sem confirmação do provedor.
- Não publicar o endpoint ou habilitar envios reais até executar teste autenticado em ambiente controlado.

## Estado em 2026-10-20

O worker, agendamento, persistência de candidatos, promoção para prospects, handler de WhatsApp, webhook de recibos/opt-out, console administrativo e landing pública de seleção foram adicionados à branch. Build, TypeScript e testes ficam para a validação posterior com o agente local. As migrations recentes ainda precisam ser aplicadas e verificadas no Supabase. O cron está configurado no arquivo Wrangler, mas não está ativo até o deploy do worker e a configuração dos secrets. O adaptador de descoberta exige endpoint/provedor real configurado. A criação automática de projeto, geração de versão e enfileiramento de publicação foram conectados no código; a execução real continua condicionada à aplicação das migrations, existência de um template compatível e validação do esquema legado. A prévia pública é estruturada, não um renderer integral do template. `sync_delivery` permanece sem handler porque os webhooks atualizam as mensagens diretamente.
