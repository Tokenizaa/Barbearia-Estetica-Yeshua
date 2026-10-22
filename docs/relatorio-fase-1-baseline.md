# Fase 1 — Baseline, segurança e infraestrutura

**Projeto:** Barbearia Estética Yeshua  
**Data da inspeção:** 22/10/2026  
**Branch de trabalho:** `main`  
**Commit-base inspecionado:** `2c186345e8492f27df5c80258cc1c5059e0af6b3`  
**Escopo:** inspeção estática do código versionado e dos sinais de CI/deploy disponíveis pela integração GitHub.  
**Status da fase:** **baseline estático concluído; gate de prontidão reprovado**. A fase não libera produção e não afirma que testes locais ou verificações de infraestrutura foram executados.

## 1. Evidências verificadas

- A `main` contém o documento de auditoria `docs/auditoria-prontidao-producao-e-scraping-cloudflare.md`.
- O `package.json` define `lint` como `tsc --noEmit`, `build` como `vite build` e `test` como cinco suítes executadas em sequência por `tsx`.
- A configuração de publicação aponta para Cloudflare Pages (`wrangler.toml` e `wrangler.jsonc`); a configuração por si só não comprova que o pipeline de scraping esteja implantado ou funcional.
- O commit-base tem um status de deploy Vercel reportado como sucesso. Isso não equivale a resultado de lint, testes, certificação da Cloudflare ou teste ponta a ponta.
- A aplicação contém rotas separadas para `/plataforma/admin`, `/admin` e prospecção. Os dashboards da plataforma verificam sessão e associação em `platform_admins` no cliente; isso não substitui a validação de autorização no servidor/RLS.
- O Worker `workers/prospecting-scheduler/src/index.ts` declara dependência de configuração externa (`PROSPECTING_SOURCE_ENDPOINT`, `PROSPECTING_SOURCE_API_KEY` e `PROSPECTING_SOURCE_PROVIDER`) e usa credenciais de serviço para operações no Supabase. Não foi possível verificar valores, bindings, deployment ativo nem respostas reais do provedor.
- O webhook VenoPag valida assinatura temporal HMAC e encaminha confirmação paga para a função de banco `apply_venopag_paid_payment`; a implementação estática não comprova que a função/migration correspondente esteja aplicada em produção.
- O endpoint público de demonstração usa token com hash, estado e expiração para localizar links; faltam testes operacionais de autorização, seleção de versão, expiração e isolamento.
- O endpoint `functions/api/capture.ts` é um capturador de metadados de páginas web; a existência desse endpoint não prova scraping do Google Maps nem autorização para esse método de coleta.

## 2. Bloqueios confirmados

### P0 — impedem aprovar a prontidão

1. **Leads de exemplo são o estado inicial do CRM.** `src/pages/LeadsDashboard.tsx` define empresas de exemplo em `INITIAL_COMPANIES`, carrega esse conjunto quando não existe estado salvo e persiste o Kanban em `localStorage` pela chave `alvanto_leads_crm_v2`. O CRM não tem fonte de verdade compartilhada demonstrada nesse fluxo; dados de exemplo podem aparecer como leads operacionais.
2. **O demonstrativo inventa conteúdo comercial quando faltam dados.** `src/components/SiteTemplateRenderer.tsx` cria listas substitutas de serviços, produtos e galeria com preços, descrições e imagens ilustrativas quando os dados recebidos estão vazios. Também foi identificado texto de reputação “Nota 5.0 no Google” na renderização. Sem condição explícita de demonstração e rotulagem inequívoca, isso pode ser interpretado como fato da empresa prospectada.
3. **O link de prévia é um payload no URL.** `src/pages/SharedSitePreview.tsx` codifica dados no parâmetro `site-preview`. Codificação Base64URL não é criptografia nem controle de acesso; qualquer informação incluída no payload deve ser considerada pública e não pode conter segredos ou dados privados.
4. **A autorização multiestabelecimento ainda não está certificada.** A inspeção de código não comprova políticas RLS, grants, funções privilegiadas ou isolamento de dados no Supabase. Não é seguro considerar a proteção de rotas React suficiente.
5. **A coleta real e o ambiente de produção não foram comprovados.** O Worker depende de um provedor externo por configuração; não há evidência disponível nesta inspeção de endpoint real, credenciais configuradas, amostras retornadas, Browser Run habilitado ou execução de campanha com persistência.
6. **O estado de produção não pode ser certificado por esta sessão.** Não houve acesso executável ao checkout local, ao ambiente de variáveis/secrets, ao banco/migrations aplicadas ou a uma sessão autenticada de produção. Não foram executados comandos de build, lint, testes nem smoke tests.

### P1 — devem ser verificados na continuação

- Confirmar migrations aplicadas, políticas RLS e permissões para cada tabela/função usada por CRM, campanhas, tarefas, demos e pagamentos.
- Conferir as configurações reais de Worker/Pages, triggers/cron, filas, secrets e limites do provedor; nunca incluir valores secretos no relatório.
- Verificar consistência e procedência de todos os campos exibidos no Kanban, sidebar e demo; separar dados coletados, dados comerciais internos e conteúdo editorial sugerido.
- Testar idempotência e recuperação de falhas no pipeline de tarefas, deduplicação e geração/publicação de demos.
- Confirmar no banco o comportamento idempotente de `apply_venopag_paid_payment` e os webhooks de pagamento e WhatsApp.
- Confirmar a política permitida para a fonte de prospecção. Não contornar CAPTCHA, bloqueios ou controles de acesso; usar fonte/provedor licenciado se o método direto não for permitido.

## 3. Execuções e limites de evidência

| Verificação | Resultado nesta fase |
|---|---|
| Leitura de configuração e scripts do repositório | Inspecionados estaticamente |
| Revisão dos fluxos de CRM, demonstrativo, Worker e webhooks | Inspecionados estaticamente; riscos listados acima |
| Status associado ao commit-base | Um status Vercel reportado como sucesso; não é certificação de testes |
| `npm run lint` | **Não executado** — ambiente de execução do projeto indisponível nesta sessão |
| `npm test` | **Não executado** — ambiente de execução do projeto indisponível nesta sessão |
| `npm run build` | **Não executado** — ambiente de execução do projeto indisponível nesta sessão |
| Migrations/RLS/segredos/bindings em produção | **Não verificados operacionalmente** |
| Scraping real, persistência e isolamento ponta a ponta | **Não executados** |

Não interpretar “não executado” como aprovado nem como falha dos testes. É ausência de evidência.

## 4. Decisão da Fase 1

**A fase de baseline estático está documentada; o critério de prontidão não foi satisfeito.** Os bloqueios P0 estão explicitados e têm plano de tratamento, mas nenhum deles deve ser marcado como corrigido sem implementação e validação.

A sequência técnica recomendada é:

1. Remover o risco de dados fictícios no CRM de produção e impedir que dados de exemplo sejam persistidos como leads reais.
2. Corrigir os fallbacks factuais do demonstrativo, preservando exemplos somente em contexto de demonstração claramente sinalizado.
3. Certificar a autorização no servidor e as políticas RLS no Supabase.
4. Executar lint, testes e build em checkout sincronizado com `main`; depois validar migrations, bindings e secrets sem revelar credenciais.
5. Só então avançar para coleta real via provedor autorizado e validar amostras rastreáveis, persistência e deduplicação.

**Critério de saída:** este relatório fecha o levantamento estático da Fase 1, mas o projeto continua **não aprovado para produção** até que os itens operacionais pendentes sejam executados e documentados.

## 5. Correções aplicadas após o baseline

As seguintes alterações foram gravadas diretamente na `main`, sem criar branches:

- `src/pages/LeadsDashboard.tsx`: removidos os leads de exemplo que eram carregados por padrão; removida a geração artificial de empresas, endereços, telefones, sites, avaliações e perfis sociais; removida a persistência local que apresentava o navegador como fonte de dados do CRM; a busca agora informa explicitamente que a integração real não está conectada e não cria leads falsos.
- CRM: incluído aviso visível de que o estado ainda é temporário e não deve receber dados operacionais, pois alterações não são persistidas no banco.
- `src/components/SiteTemplateRenderer.tsx`: removidos serviços, preços, produtos, portfólio e alegações de reputação/horários predefinidos; seções comerciais sem dados ficam ocultas; contato por WhatsApp só aparece quando há número; o fluxo de agendamento informa que é uma simulação e não reserva nem envia horário.
- `src/pages/SharedSitePreview.tsx`: removidos telefone, endereço, cidade, categoria e logo predefinidos que poderiam ser atribuídos incorretamente à empresa prospectada.
- `src/pages/LeadsDashboard.tsx`: removida a alegação não verificada de que a empresa tem perfil de excelência no Google na mensagem de abordagem.

### Validação após as correções

- Deploy de produção Vercel associado ao commit `6bddcd613892672383dc04b0a0ac3fcde89ed994`: estado **READY**.
- O build de um commit intermediário falhou por sintaxe JSX nas condições de exibição; a sintaxe foi corrigida no commit `04c880ea8310c7523ddcacc8c7f8aa4a864dea95`, cujo deploy foi **READY**. O commit mais recente também chegou a **READY**.
- Foi feita verificação estática dos arquivos na `main`: os nomes de empresas fictícias, geração `lead-dyn-`, chave `alvanto_leads_crm_v2`, telefone de exemplo e afirmação “Nota 5.0 no Google” não aparecem mais nos arquivos corrigidos.
- **Não foram executados** `npm test`, `npm run lint` nem testes ponta a ponta nesta sessão. Estado READY do deploy confirma build/deploy, não certifica os testes de negócio.

## 6. Bloqueios ainda abertos — não considerar a plataforma pronta

1. **Persistência real do CRM:** permanece pendente. A tela está explicitamente em modo temporário para evitar perda silenciosa de dados. Não foi identificado, nas conexões de Supabase disponíveis para esta execução, um projeto confirmado como pertencente a esta aplicação; não foi criado banco nem aplicada migration por suposição.
2. **Fonte real de prospecção:** a interface não está conectada ao pipeline de descoberta do Worker. A busca foi bloqueada de modo seguro em vez de simular resultados. A integração só pode ser habilitada após confirmar provedor, endpoint, credenciais e permissões.
3. **RLS e autorização server-side:** continuam sem certificação operacional. Não se deve concluir que há isolamento adequado apenas porque as páginas administrativas verificam sessão no cliente.
4. **Demonstrações públicas:** o parâmetro `site-preview` continua contendo dados codificados no URL; Base64URL não é criptografia nem assinatura. Não colocar segredos ou dados privados nesse payload. A migração para link/token persistido deve ser concluída e testada antes de tratar os links como mecanismo de controle de acesso.
5. **Pagamentos, migrations e bindings:** a validação estática do webhook VenoPag não prova que a função de banco, as migrations e os secrets correspondentes estejam aplicados e corretos em produção.
6. **Certificação completa:** lint, suítes automatizadas, isolamento de tenants, fluxo real de scraping e smoke tests em produção ainda precisam ser executados.

**Estado atualizado:** correções preventivas para evitar leads e conteúdo comercial fictícios estão implantadas; o build/deploy está READY. A prontidão para produção continua **não aprovada** até que os seis bloqueios acima sejam resolvidos e evidenciados.
