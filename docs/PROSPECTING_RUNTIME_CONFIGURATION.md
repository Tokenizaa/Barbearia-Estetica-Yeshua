# Configuração do runtime — prospecção automatizada

## Objetivo

Documentar os secrets e as verificações necessárias antes de habilitar campanhas. Este documento não contém valores secretos. Configure variáveis no ambiente server-side do runtime que executará as Cloudflare Pages Functions; nunca as coloque em `VITE_*`, no frontend, em commits ou em URLs.

## Variáveis necessárias

| Variável | Uso | Estado esperado |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | Obrigatória no servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Validar a sessão administrativa no endpoint de prontidão | Obrigatória no servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso server-side às tabelas operacionais | Obrigatória; nunca expor ao browser |
| `PROSPECTING_WORKER_SECRET` | Autenticar chamadas internas do worker | Obrigatória antes de executar jobs |
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

## Regras de segurança e operação

- Não configurar campanhas ativas até que a fonte de descoberta esteja aprovada e validada.
- Não enviar WhatsApp apenas porque existe um telefone público. Exigir elegibilidade explícita, base legal aplicável, opt-in documentado quando exigido pelo canal e ausência de opt-out.
- Manter tokens e chaves somente como secrets server-side.
- A fila deve ser executada por scheduler/worker autenticado, com idempotência, retentativas limitadas e logs.
- Não marcar mensagem como enviada sem confirmação do provedor.
- Não publicar o endpoint ou habilitar envios reais até executar teste autenticado em ambiente controlado.

## Estado em 2026-10-20

O endpoint de diagnóstico e o esquema persistente foram adicionados ao código; as migrations foram aplicadas ao projeto Supabase `ifkqrtjhdnolkuucgbpb` e os privilégios foram verificados. O endpoint ainda não foi validado em um deployment Cloudflare, as credenciais de descoberta/WhatsApp não foram confirmadas e o worker/scheduler operacional ainda precisa ser implementado.
