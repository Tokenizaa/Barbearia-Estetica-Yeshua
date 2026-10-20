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
| `PROSPECTING_SOURCE_API_KEY` | Credencial do fornecedor de descoberta, quando exigida | Pendente de seleção/configuração |
| `WHATSAPP_ACCESS_TOKEN` | Credencial do WhatsApp Business Platform | Pendente de configuração |
| `WHATSAPP_PHONE_NUMBER_ID` | Identificador do número de envio no provedor | Pendente de configuração |
| `WHATSAPP_TEMPLATE_NAME` | Modelo de mensagem aprovado pelo provedor | Pendente de configuração |

Não usar uma chave de Google Maps/Places como padrão para montar lista de prospecção sem validar expressamente os termos do provedor para armazenamento e uso comercial dos dados. O provedor de descoberta precisa autorizar a finalidade pretendida, respeitar limites e fornecer evidência de origem.

## Diagnóstico de prontidão

Endpoint implementado: `GET /api/prospecting/readiness`.

- Exige sessão Supabase válida com `app_metadata.platform_role = platform_admin`.
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
- Tarefas de qualificação têm handler implementado. `discover`, `capture`, `generate_demo`, `publish_demo`, `send_whatsapp` e `sync_delivery` ficam em `blocked` até que seus provedores/handlers sejam implementados e validados; não são simuladas como sucesso.
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

O endpoint de diagnóstico e o esquema persistente foram adicionados anteriormente. O worker agendado e a migration de recuperação foram adicionados à branch. A suíte automatizada inclui testes do worker, mas a execução local/CI e a aplicação da nova migration ainda precisam ser confirmadas. O cron está configurado no arquivo Wrangler, porém não está ativo até o deploy do worker e a configuração dos secrets. Descoberta, geração/publicação de demonstrações e WhatsApp continuam bloqueados até integração real e validação.
