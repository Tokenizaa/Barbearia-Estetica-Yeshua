# Manual de Provisionamento e Entrada em Produção (Go-Live Runbook)

Este documento descreve o roteiro operacional para a ativação do ambiente de **Produção / Staging** da plataforma **MeuSalão / Barbearia-Estética-Yeshua**, abrangendo o banco de dados Supabase, as funções server-side do Cloudflare Pages, o agendador Cloudflare Workers, a ativação do primeiro Administrador Geral e o teste piloto controlado.

---

## Índice de Etapas de Ativação

- [Passo 1: Provisionamento do Banco de Dados (Supabase)](#passo-1-provisionamento-do-banco-de-dados-supabase)
- [Passo 2: Configuração de Secrets no Cloudflare Pages (App Web & API)](#passo-2-configuração-de-secrets-no-cloudflare-pages-app-web--api)
- [Passo 3: Configuração de Secrets no Cloudflare Worker (prospecting-scheduler)](#passo-3-configuração-de-secrets-no-cloudflare-worker-prospecting-scheduler)
- [Passo 4: Ativação do Primeiro Administrador Geral](#passo-4-ativação-do-primeiro-administrador-geral)
- [Passo 5: Teste Piloto em Produção (Dry-Run Controlado)](#passo-5-teste-piloto-em-produção-dry-run-controlado)

---

## Passo 1: Provisionamento do Banco de Dados (Supabase)

### 1.1. Ordem Canônica de Execução das Migrations
Conecte-se ao Supabase via Dashboard (SQL Editor) ou CLI (`supabase db push`) e aplique as migrations exatamente nesta ordem sequencial:

```sql
-- 1. Estrutura base de multi-tenant e templates
\i supabase/migrations/20261019000000_white_label_site_builder.sql
\i supabase/migrations/20261020154758_white_label_site_builder.sql
\i supabase/migrations/20261020154931_restrict_rls_auto_enable_execute.sql

-- 2. Cadastro de salões, assinaturas e cobrança VenoPag
\i supabase/migrations/20261020161116_salon_onboarding_billing_venopag.sql
\i supabase/migrations/20261020173000_subscription_access_policy.sql
\i supabase/migrations/20261020173500_expose_paid_payment_rpc.sql

-- 3. Agendamentos públicos com isolamento e validação de vigência
\i supabase/migrations/20261020174000_tenant_scoped_server_appointments.sql
\i supabase/migrations/20261020174500_harden_public_appointment_rpc.sql
\i supabase/migrations/20261020175000_allow_scoped_public_appointment_rpc.sql

-- 4. Primeiro Administrador Geral e código seguro de bootstrap
\i supabase/migrations/20261020182000_first_platform_admin_bootstrap_code.sql

-- 5. Fundação da esteira de prospecção autônoma
\i supabase/migrations/20261020185512_prospecting_automation_foundation.sql
\i supabase/migrations/20261020185517_prospecting_worker_rpc.sql
\i supabase/migrations/20261020185601_prospecting_service_role_grants.sql
\i supabase/migrations/20261020190000_prospecting_worker_recovery.sql
\i supabase/migrations/20261020190124_prospecting_index_policy_tuning.sql
\i supabase/migrations/20261020190500_prospecting_whatsapp_consent.sql
\i supabase/migrations/20261020191000_public_demo_selection.sql
\i supabase/migrations/20261020191500_prospecting_candidates.sql
\i supabase/migrations/20261020192000_promote_prospecting_candidates.sql
\i supabase/migrations/20261020193000_prospect_demo_project_automation.sql
```

### 1.2. Aplicação do Seed de Baseline
Após executar as migrations, execute o script de dados iniciais:

```bash
# Executar no SQL Editor do Supabase:
supabase/seed_production_baseline.sql
```

**Verificação de Sucesso:**
```sql
-- Verificar modelos publicados:
select count(*) as templates_publicados from public.site_template_versions where is_published = true;
-- Deve retornar >= 1

-- Verificar planos ativos com preços em centavos:
select slug, name, price_brl_cents, access_days, max_booking_horizon_days, is_active
from public.billing_plans;
-- Deve retornar:
-- mensal | R$ 97,00 (9700 centavos) | 30 dias | 60 dias horizonte | true
-- anual  | R$ 997,00 (99700 centavos) | 365 dias | 365 dias horizonte | true
```

---

## Passo 2: Configuração de Secrets no Cloudflare Pages (App Web & API)

No painel do Cloudflare: **Workers & Pages** → Projeto **barbearia-yeshua** (ou o projeto Pages configurado) → **Settings** → **Environment variables**.

### 2.1. Variáveis Públicas de Build (Vite)
*Disponíveis durante o build do frontend:*
- `VITE_SUPABASE_URL`: `https://<seu-projeto>.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOi...` (Chave anônima pública do Supabase)

### 2.2. Variáveis de Ambiente e Segredos de Runtime (Pages Functions)
*Disponíveis para as funções em `/functions/api/*` — marcar como "Encrypted":*
- `SUPABASE_URL`: `https://<seu-projeto>.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: `eyJhbGciOi...`
- `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOi...` (*Secret crítico — nunca expor no Vite*)
- `VENOPAG_CLIENT_ID`: Identificador de cliente fornecido pela VenoPag.
- `VENOPAG_CLIENT_SECRET`: Segredo de API fornecido pela VenoPag.
- `VENOPAG_WEBHOOK_SECRET`: Segredo HMAC para validar assinaturas `X-Veno-Signature`.
- `WHATSAPP_APP_SECRET`: Segredo do aplicativo Meta Developers para validação de webhook `sha256`.
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Token arbitrário e seguro para o handshake `hub.verify_token` da Meta.

---

## Passo 3: Configuração de Secrets e Bindings no Cloudflare Worker (prospecting-scheduler)

O worker de agendamento e processamento assíncrono consome tarefas em segundo plano sem interface gráfica. As chaves devem ser injetadas via Wrangler CLI e o binding Browser Run configurado no Dashboard.

### 3.1. Secrets (via Wrangler CLI)
```bash
# 1. Credenciais de acesso ao banco (Service Role)
npx wrangler secret put SUPABASE_URL --config wrangler.prospecting-scheduler.toml
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.prospecting-scheduler.toml

# 2. Segredo de autenticação para chamadas diretas ao worker
npx wrangler secret put PROSPECTING_WORKER_SECRET --config wrangler.prospecting-scheduler.toml

# 3. WhatsApp — Evolution API (futuro) — configurar quando disponível
# npx wrangler secret put WHATSAPP_EVOLUTION_URL --config wrangler.prospecting-scheduler.toml
# npx wrangler secret put WHATSAPP_EVOLUTION_API_KEY --config wrangler.prospecting-scheduler.toml
# npx wrangler secret put WHATSAPP_EVOLUTION_INSTANCE --config wrangler.prospecting-scheduler.toml

# 4. Legacy Meta Cloud API (mantido para compatibilidade futura — opcional por enquanto)
# npx wrangler secret put WHATSAPP_ACCESS_TOKEN --config wrangler.prospecting-scheduler.toml
# npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID --config wrangler.prospecting-scheduler.toml
# npx wrangler secret put WHATSAPP_TEMPLATE_NAME --config wrangler.prospecting-scheduler.toml
# npx wrangler secret put WHATSAPP_API_VERSION --config wrangler.prospecting-scheduler.toml
```

### 3.2. Binding Browser Run (via Cloudflare Dashboard)
No painel do Cloudflare: **Workers & Pages** → **barbearia-yeshua-prospecting-scheduler** → **Settings** → **Bindings** → **Add** → **Browser**:
- **Variable name**: `BROWSER`
- **Browser binding**: selecione ou crie o namespace Browser Run

### 3.3. Variáveis de ambiente (wrangler.toml)
O arquivo `wrangler.prospecting-scheduler.toml` já define:
- `PROSPECTING_BATCH_SIZE = "10"` (var)
- `nodejs_compat = true` (necessário para playwright-core)
- Cron: `*/5 * * * *` (a cada 5 minutos)

### 3.4. Deploy do Worker:
```bash
npx wrangler deploy --config wrangler.prospecting-scheduler.toml
```

---

## Passo 4: Ativação do Primeiro Administrador Geral

O primeiro Administrador Geral utiliza o código criptográfico de uso único provisionado na migration `20261020182000_first_platform_admin_bootstrap_code.sql`.

1. Acesse no navegador a rota: `https://<seu-dominio>/plataforma/cadastro`
2. No alternador de tipo de conta, selecione **Administrador geral**.
3. Preencha:
   - **Código de ativação do administrador geral**: `PLATAFORMA-ADMIN-XXXXX-XXXXX-XXXXX` (código compartilhado em canal seguro correspondente ao hash gravado em `private.platform_admin_bootstrap_codes`).
   - **E-mail**: `admin@tokenizaa.com` (ou e-mail oficial designado)
   - **Senha**: Senha forte (mínimo 10 caracteres).
4. Clique em **Criar conta de administrador**.
5. O trigger do Supabase valida o hash SHA-256 do código e insere o usuário em `public.platform_admins`.

**Validação no Banco:**
```sql
select u.email, pa.created_at
from public.platform_admins pa
join auth.users u on u.id = pa.user_id;
-- Deve retornar exatamente o usuário ativado.
```

---

## Passo 5: Teste Piloto em Produção (Dry-Run Controlado)

Para atestar o funcionamento integrado antes de liberar volume em escala:

### 5.1. Checagem Automática de Prontidão
Faça login com a conta de Administrador Geral e acerte o endpoint de diagnóstico:
```bash
curl -s -H "Authorization: Bearer <SEU_ACCESS_TOKEN>" \
  https://<seu-dominio>/api/prospecting/readiness | jq .
```
O retorno deve apresentar `"status": "ready_for_integration_tests"` e todas as verificações de tabela com `"ready": true`.

### 5.2. Criação de Campanha Piloto Limitada
1. No painel `/plataforma/admin` (ou via API), crie uma campanha com limite diário restrito:
   - **Nome**: `Piloto Homologação SP Centro`
   - **Segmento**: `barbearia e salão`
   - **Região**: `São Paulo - SP`
   - **Limite diário**: `2`
2. O worker executará a tarefa `discover` → `capture` → `qualify`.
3. Verifique que o lead qualificado teve o projeto criado em `site_projects` e um link gerado em `site_demo_public_links`.

### 5.3. Validação do Link Público e Opt-Out
1. Abra a URL `/demo/<token>` em um navegador anônimo ou dispositivo móvel (sem login).
2. Selecione a versão desejada e confirme.
3. Clique em **Continuar para cadastro e ativação deste site** e verifique se `/plataforma/cadastro` abre com o contexto vinculado.
4. Simule um webhook de entrada com a palavra `PARAR` via endpoint `/api/webhooks/whatsapp` e confirme que `prospects.outreach_eligibility` muda imediatamente para `opted_out`.

---

## Procedimento de Rollback e Segurança Operacional

- **Se o webhook VenoPag falhar:** Os pagamentos ficam em `pending`. A função `apply_venopag_paid_payment` pode ser reexecutada com idempotência assim que a conectividade for restabelecida.
- **Se tarefas do Worker travarem:** Tarefas com lease expirado (`lease_expires_at < now()`) são automaticamente liberadas na próxima execução do cron para novo processamento ou descarte seguro (`dead_letter`).
- **Nenhum dado financeiro ou de cartão é armazenado na plataforma:** Todas as cobranças ocorrem via PIX oficial gerado diretamente no backend do provedor.
