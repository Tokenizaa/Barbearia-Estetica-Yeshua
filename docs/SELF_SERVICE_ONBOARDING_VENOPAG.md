# Cadastro de salões, assinatura e cobrança VenoPag

## Fluxo de cadastro e cobrança

1. `/plataforma/cadastro`: o responsável informa nome, e-mail, senha e nome/identificador do salão.
2. Supabase Auth cria a conta. O trigger `private.provision_salon_owner()` cria o salão em estado `draft` e a associação `owner` atomicamente.
3. Após confirmação do e-mail e login, o responsável visualiza os planos ativos.
4. A função Cloudflare Pages `POST /api/billing/create-checkout` valida o token Supabase, confirma a associação e lê o preço do plano no banco.
5. O servidor cria PIX pela API VenoPag e guarda a cobrança.
6. O webhook `POST /api/billing/webhook` valida HMAC-SHA256 e encaminha pagamentos confirmados para uma função transacional no banco. A função bloqueia a cobrança durante a atualização e impede que webhooks repetidos estendam o período duas vezes.
7. O período pago é somado ao vencimento atual quando ainda está vigente, evitando perda de dias em renovações antecipadas. A ativação grava vencimento e horizonte de agenda derivados do plano.

## Política comercial acordada

- **Plano mensal:** horizonte de agendamento recomendado de até 60 dias à frente; período inicial de acesso de 30 dias.
- **Plano anual:** horizonte de agendamento de até 365 dias à frente; período inicial de acesso de 365 dias.
- Esses valores são recomendações/configurações comerciais, não preços definidos. Não ativar planos até que preço e período sejam deliberados e configurados.
- A integração VenoPag consultada documenta PIX Cash In e webhooks, mas não confirma cobrança recorrente automática. Até confirmar suporte oficial, a renovação é manual por nova cobrança PIX; o usuário deve ser avisado antes de contratar.
- O cancelamento deve encerrar renovações futuras, preservar dados e histórico e informar a política de consulta/exportação. Não apagar dados do cliente no cancelamento.

## Limite técnico importante

O projeto ainda mantém agendamentos operacionais em `localStorage`. Portanto, o horizonte de agenda e a expiração **ainda não podem ser considerados efetivamente impostos no servidor sobre o fluxo real de agendamento**. A migração abaixo registra vencimento e limites por plano e a ativação os aplica ao estabelecimento; o bloqueio real de novos agendamentos após o horizonte e o encerramento automático do acesso exigem migrar a operação para persistência/endpoints tenant-scoped e validar a assinatura no servidor. Não declarar a política como totalmente aplicada até essa etapa ser implementada e testada.

## Configuração necessária

### Build do frontend
- `VITE_SUPABASE_URL`: URL do projeto MeuSalao.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave publicável Supabase. Nunca usar service role no frontend.

### Secrets do runtime Cloudflare Pages/Workers
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret; nunca no Vite/frontend)
- `VENOPAG_CLIENT_ID` (secret)
- `VENOPAG_CLIENT_SECRET` (secret)
- `VENOPAG_WEBHOOK_SECRET` (secret)
- Opcional: `VENOPAG_BASE_URL`, `VENOPAG_WEBHOOK_URL`

As variáveis Vite e os secrets das Pages Functions têm escopos diferentes. Não presumir que variáveis do Vercel existem no Cloudflare Pages.

## Preparação comercial e validação antes de vendas

- Não foi definido preço. Não inventar valores nem ativar planos sem decisão comercial.
- Confirmar com a VenoPag o formato exato de assinatura, payload/status, autenticação e assinatura de webhook; testar em ambiente oficial de teste antes de aceitar pagamentos reais.
- Implementar rate limit/CAPTCHA para cadastro público e recuperação de senha.
- Configurar confirmação de e-mail e URLs de redirecionamento no Supabase Auth.
- Criar testes para isolamento entre salões, trigger de cadastro, webhook válido/inválido/repetido, valor divergente, renovação antecipada, vencimento e limites de agenda.
- Não liberar produção até que o prazo de acesso e o horizonte de agenda sejam verificados no servidor; a atual persistência em `localStorage` não oferece essa garantia.
