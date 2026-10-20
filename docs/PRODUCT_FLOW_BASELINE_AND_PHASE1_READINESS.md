# Base funcional oficial e prontidão — Plataforma de prospecção e sites personalizados

**Data:** 2026-10-20  
**Branch de referência:** `feat/salon-onboarding-venopag`  
**Status deste documento:** escopo aprovado como referência para as próximas implementações; prontidão técnica avaliada por inspeção do código e da documentação, sem declarar testes de ponta a ponta que não foram executados.

Este documento é a fonte de verdade funcional para a sequência comercial descrita abaixo. Se documentos anteriores divergirem sobre a ordem das fases, prevalece este fluxo. O produto não é um marketplace nem um diretório público: é uma plataforma de prospecção que encontra negócios, prepara uma demonstração personalizada e converte interessados em clientes de sites white-label.

## 1. Fluxo completo do produto

1. **Descoberta de potenciais clientes:** o operador define segmento e região; o motor pesquisa negócios em fontes permitidas, priorizando fontes oficiais e APIs autorizadas para dados do Google Maps/Perfil da Empresa no Google.
2. **Captura e mapeamento:** registra nome comercial, categoria, localização, telefone comercial e outros dados disponíveis, além da fonte, URL, data de captura e evidências. Dados ausentes ficam ausentes; hipótese não é tratada como fato.
3. **Deduplicação e qualificação:** normaliza telefones/URLs/nome/localidade, evita duplicatas, identifica presença digital e ordena oportunidades com critérios rastreáveis. A revisão humana corrige dados antes de usá-los na demonstração.
4. **Geração de demonstração:** escolhe automaticamente um modelo inicial adequado ao segmento e preenche o modelo com os dados revisados do negócio. A demonstração é individualizada, identificada como proposta e não é um site publicado.
5. **Abordagem pelo WhatsApp:** prepara uma mensagem comercial com o link individual da demonstração. O envio deverá ocorrer por WhatsApp Business Platform ou provedor autorizado, ou por ação manual assistida quando o envio integrado ainda não estiver habilitado. O sistema deve registrar envio, falha, resposta e opt-out; não pode declarar enviado sem confirmação do canal.
6. **Landing page comercial do lead:** o link abre uma página pública de apresentação da proposta, não o painel do salão. A página explica o serviço, apresenta a demonstração e oferece acesso a modelos alternativos, informações claras de contratação e uma ação para avançar.
7. **Seleção de modelo:** antes de se cadastrar ou pagar, o potencial cliente pode comparar modelos pré-configurados e visualizar a própria proposta em cada um. A escolha fica vinculada àquele lead/projeto e cria uma nova versão, preservando a versão inicial e o histórico.
8. **Contratação:** somente quando o lead decide contratar, inicia o cadastro do responsável e do estabelecimento, escolhe o plano e aceita as condições comerciais. O modelo escolhido é preservado durante a transição.
9. **Pagamento e ativação:** a cobrança é criada no servidor; a ativação só ocorre após confirmação válida e idempotente do pagamento pelo provedor. Cadastro, cobrança pendente e cliente ativo são estados diferentes.
10. **Plataforma privada do salão:** depois da ativação, o responsável entra na área privada para personalizar conteúdo, revisar o site, configurar os recursos contratados e solicitar/publicar o site conforme o plano.
11. **Administração geral:** o Admin Geral acompanha leads, propostas, envios, escolhas de modelo, conversões, pagamentos, estabelecimentos, projetos e publicação. Ele não deve ser confundido com a conta de um salão.

### Ambientes que precisam permanecer separados

- **Demonstração pública:** sem login; mostra somente o snapshot daquele lead; não oferece edição administrativa nem publicação.
- **Landing page comercial:** explica produto, modelos, condições e contratação; não é o site de produção do salão.
- **Checkout/cadastro:** recolhe os dados necessários à contratação e ao pagamento.
- **Plataforma privada do salão:** liberada após ativação, com autorização e isolamento por estabelecimento.
- **Admin Geral:** acesso privilegiado separado e validado no servidor.

### Dados e vínculo entre etapas

A relação esperada é: `prospect/lead → site_project de demonstração → versão do modelo escolhida → usuário autenticado → establishment/membership → billing_payment confirmado → projeto contratado/publicável`.

A conversão não deve duplicar o lead nem perder fonte, histórico, modelo selecionado ou versão da demonstração. Um lead não é automaticamente um cliente e um projeto de demonstração não é automaticamente um site publicado.

## 2. Divisão em três fases de implementação

### Fase 1 — Prospecção, demonstração personalizada e landing page

**Objetivo:** entregar o primeiro ciclo comercial antes de solicitar cadastro ou pagamento.

Inclui:
- busca/captura de negócios por segmento e região, com fonte e data;
- mapeamento, normalização, deduplicação e revisão dos dados;
- pipeline interno de leads e histórico de atividades;
- geração de uma primeira demonstração a partir de modelo pré-configurado;
- link público estável por lead, que abra fora do painel e em outro dispositivo;
- landing page comercial explicativa com demonstração e galeria de modelos;
- escolha de modelos alternativos vinculada ao projeto e versionada;
- abordagem por WhatsApp, com envio real via integração autorizada ou envio assistido claramente indicado;
- estados rastreáveis de proposta preparada, enviada, visualizada quando tecnicamente possível, resposta, opt-out e interesse;
- painel de operação para pesquisar e acompanhar o funil;
- indicação explícita de fonte, verificação e limitações dos dados.

**Fora da Fase 1:** cadastro de cliente final, cobrança, ativação de assinatura, editor privado completo e publicação definitiva. Integrações existentes podem ser preservadas, mas não devem desviar o foco do fluxo de aquisição e demonstração.

**Critérios de aceite:**
1. Um lead capturado/importado tem fonte e estado de verificação rastreáveis.
2. Duplicatas são detectadas antes de gerar ou enviar uma nova proposta.
3. A demonstração usa dados revisados, um modelo real disponível e conteúdo claramente identificado como proposta.
4. O link público funciona sem autenticação e não expõe credenciais ou dados internos.
5. A landing page permite compreender a oferta e escolher entre modelos antes do cadastro.
6. A escolha cria uma versão do projeto e preserva a anterior.
7. O fluxo de WhatsApp distingue preparação, tentativa, envio confirmado, falha e opt-out; nunca simula envio.
8. Leads, projetos e atividades persistem de forma confiável no ambiente-alvo, sem depender de `localStorage` do navegador como banco compartilhado.
9. A captura e o envio obedecem às regras das fontes, do canal e à legislação aplicável.
10. Build, lint, testes relevantes e validação manual do fluxo ponta a ponta são concluídos e evidenciados.

### Fase 2 — Cadastro, contratação, pagamento e ativação

Inclui cadastro de responsável e estabelecimento, autenticação, seleção/confirmacão do plano, checkout VenoPag, confirmação por webhook validado, ativação idempotente, recuperação de falhas e reconciliação do lead com o estabelecimento sem duplicação. Deve preservar a demonstração e o modelo escolhido.

Não liberar contratação real até configurar preços e planos aprovados, confirmar o contrato técnico da VenoPag, configurar secrets no runtime correto e validar webhooks, pagamentos repetidos, valores divergentes, expiração, cancelamento e falhas.

### Fase 3 — Plataforma do salão, publicação e operação do Admin Geral

Inclui editor privado e persistente, isolamento multi-tenant, gestão de conteúdo/serviços/imagens, revisão e publicação de sites, gestão completa de estabelecimentos e modelos, monitoramento comercial/financeiro, auditoria e métricas do funil. A autorização precisa ser aplicada no servidor e no banco (RLS/políticas); ocultar botões no frontend não é controle de segurança.

## 3. Análise de prontidão da Fase 1

**Conclusão: prontidão parcial; não está pronta para operar a Fase 1 de ponta a ponta.** Existem blocos reutilizáveis, mas ainda falta integrar o ciclo que começa na descoberta de negócios e termina na landing page/abordagem comercial.

| Capacidade | Situação observada na branch | Avaliação |
|---|---|---|
| Painel de leads | `src/pages/LeadsDashboard.tsx` oferece cadastro manual, pesquisa/filtro, importação CSV, edição e histórico | Parcialmente pronto |
| Persistência de leads | O dashboard usa `localStorage` (`prospecting_leads_v1`) | Não pronto para operação compartilhada/produção |
| Captura de dados | `POST /api/capture` em `functions/api/capture.ts` extrai metadados/JSON-LD de uma URL pública fornecida | Bloco inicial existente; não é descoberta automática de negócios |
| Google Maps/Perfil da Empresa | Não foi identificada integração implementada para pesquisar listagens e capturar resultados em escala | Bloqueador da descoberta automatizada |
| Deduplicação | Importação CSV contém deduplicação limitada ao conjunto local; não há garantia de deduplicação global persistente | Parcial |
| Qualificação | Há estados e revisão manual; não há motor operacional completo de pontuação/evidências conectado à captura | Parcial |
| Geração do site | `prepareSite` monta uma primeira versão textual; há modelos hardcoded (`modelo-inicial`, `minimal`, `editorial`, `bold`) na interface | Protótipo, não gerador completo a partir de catálogo persistente |
| Prévia pública | `SharedSitePreview.tsx` mostra um snapshot por parâmetro `site-preview` codificado no URL | Parcial; não é registro server-side persistente e o link pode ser encaminhado |
| Landing page comercial | A prévia compartilhável existe, mas não foi identificada uma landing page completa que explique a oferta, compare modelos e conduza à contratação | Bloqueador |
| Escolha de modelos pelo lead | O dashboard registra troca de modelo internamente; não foi identificada seleção pública persistente na experiência do lead | Bloqueador |
| Envio de WhatsApp | O painel copia o link da prévia; não foi identificada integração de envio de mensagem ao salão | Bloqueador para envio integrado |
| Histórico do funil | Atividades e estados existem no navegador | Parcial; falta persistência compartilhada e eventos de entrega/visualização |
| Segurança da captura | A função aplica validações de URL, limites e timeout; a própria documentação exige rate limiting/observabilidade e validação operacional | Precisa endurecimento e testes antes de escala |
| Validação automatizada | Existe teste `tests/white_label_validation.test.ts`, mas não foi executado nesta análise | Não validado |
| Build e fluxo real | Não foram executados build, lint, deploy de preview nem teste ponta a ponta nesta análise | Não validado |

### Bloqueadores prioritários

1. **Fonte de leads:** decidir e implementar o método autorizado para descoberta no Google Maps/Perfil da Empresa (preferência por API oficial/licenciada ou fonte permitida). O endpoint atual extrai dados de um site conhecido; não descobre estabelecimentos por si só.
2. **Persistência:** substituir a dependência do `localStorage` por repositório server-side persistente para leads, projetos, versões e atividades. O esquema Supabase existe em migrations no repositório, mas a existência do arquivo não comprova que as migrations foram aplicadas e validadas no banco.
3. **Projeto de demonstração:** gerar e salvar uma proposta real a partir de template versionado; não tratar o texto provisório ou apenas um snapshot em URL como projeto persistente.
4. **Landing page e seleção pública:** criar a experiência que explica a oferta, mostra a prévia e permite comparar/selecionar modelos sem exigir login; preservar o estado do lead e da versão.
5. **WhatsApp:** decidir entre integração oficial de envio e envio assistido inicial. Até a integração ser configurada, apresentar uma ação manual explícita e não indicar envio automático.
6. **Operação e segurança:** adicionar controles de frequência, observabilidade, gestão de erros, auditoria e tratamento de opt-out; testar fontes e links públicos com dados reais revisados.
7. **Validação:** executar build, lint, testes de unidade e um percurso ponta a ponta com um lead de teste, da captura até a abertura da landing page em sessão/navegador separado.

## 4. Regras de preservação e execução

- Preservar o site e os ativos específicos da Barbearia/Estética Yeshua; Yeshua é um estabelecimento inicial, não a marca global da plataforma.
- Não criar marketplace ou diretório público de estabelecimentos.
- Não transformar dados inferidos em fatos nem inventar dados ausentes.
- Não enviar mensagens nem publicar sites sem ação explícita e evidência de sucesso.
- Não expor segredos no frontend ou no repositório.
- Não assumir que migrations foram aplicadas só porque existem no Git.
- Não declarar pronto sem testes executados e resultados verificáveis.
- Usar a branch existente `feat/salon-onboarding-venopag`; não criar branch, mesclar PR ou publicar em produção sem autorização explícita.
- A cada etapa, manter a ordem: entender o estado atual, preservar o que funciona, implementar a menor mudança coerente e validar o resultado.

## 5. Referências técnicas inspecionadas

- `src/pages/LeadsDashboard.tsx`
- `src/pages/SharedSitePreview.tsx`
- `functions/api/capture.ts`
- `src/pages/PlatformAccessPage.tsx`
- `functions/api/billing/create-checkout.ts`
- `functions/api/billing/webhook.ts`
- `docs/LEAD_CAPTURE_DASHBOARD.md`
- `docs/SELF_SERVICE_ONBOARDING_VENOPAG.md`
- `docs/DATA_MODEL.md`
- `supabase/migrations/`

A inspeção dos arquivos confirma presença de código, não confirma configuração de secrets, aplicação de migrations no banco remoto nem funcionamento de integrações em produção.
