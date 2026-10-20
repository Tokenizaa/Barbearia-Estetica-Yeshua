# Cadastro de salões e contratação via VenoPag

## Fluxo implementado nesta proposta

1. `/plataforma/cadastro`: o responsável informa nome, e-mail, senha e nome/identificador do salão.
2. Supabase Auth cria a conta. O trigger `private.provision_salon_owner()` cria o salão em estado `draft` e a associação `owner` atomicamente.
3. Após confirmação do e-mail e login, o responsável visualiza planos ativos.
4. A função Cloudflare Pages `POST /api/billing/create-checkout` valida o token Supabase, confirma a associação e lê o preço do plano no banco (nunca aceita preço do navegador).
5. O servidor cria PIX pela API VenoPag e guarda a cobrança. O webhook `POST /api/billing/webhook` valida HMAC-SHA256, janela de cinco minutos, identificador e valor antes de marcar o pagamento e ativar o salão.
6. `/plataforma/login` é o acesso de retorno.

## Configuração necessária

### Build do frontend
- `VITE_SUPABASE_URL`: URL do projeto MeuSalao.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável Supabase. Nunca usar service role no frontend.

### Secrets do Cloudflare Pages/Workers (server-side)
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret; nunca no Vite/frontend)
- `VENOPAG_CLIENT_ID` (secret)
- `VENOPAG_CLIENT_SECRET` (secret)
- `VENOPAG_WEBHOOK_SECRET` (secret)
- Opcional: `VENOPAG_BASE_URL`, `VENOPAG_WEBHOOK_URL`

As variáveis Vite do frontend e os secrets das Pages Functions têm escopos diferentes. O ambiente de produção usa a plataforma que publica o projeto; não presumir que variáveis cadastradas no Vercel são automaticamente copiadas ao Cloudflare Pages.

## Preparação comercial ainda necessária

- Não foi definido o preço dos planos. A migração não cria preços fictícios nem ativa planos automaticamente. Um administrador autorizado precisa cadastrar e ativar os planos em `public.billing_plans`.
- O SDK/repositório VenoPag consultado documenta Cash In PIX, consulta de status, cash out, transferência e webhook; não documenta cobrança recorrente automática. Os planos `monthly` e `yearly` são apenas período de acesso, com renovação manual até existir suporte recorrente confirmado.
- Credenciais VenoPag ainda precisam ser cadastradas como secrets no runtime real. Nenhuma cobrança real foi criada nesta etapa.

## Segurança e validação antes de produção

- Não conceder service role ao browser.
- Validar e testar assinatura webhook contra um evento real/sandbox oficial VenoPag antes de ativar pagamentos.
- Confirmar o formato exato de payload/status com VenoPag; a integração aceita `request_number`, `status`, `amount` e `transaction_id`.
- Implementar rate limit/CAPTCHA para cadastro público, recuperação de senha e prevenção de abuso.
- Configurar confirmação de e-mail e URLs de redirecionamento no Supabase Auth.
- Criar testes automatizados para isolamento entre salões, signup trigger, assinatura/replay de webhook, valor divergente, duplicidade de webhook e cobrança não paga.
