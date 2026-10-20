# Especificação funcional — captação de leads e dashboard

## Objetivo

Preparar a operação de prospecção e a produção de uma primeira versão personalizada de site. O esquema inicial do Supabase já foi aplicado, mas a interface ainda precisa de integração persistente e validação antes de depender do banco em produção. O dashboard é interno; o lead não navega por um marketplace.

## Entidades de domínio

### Lead
- id: identificador estável.
- businessName: nome observado do negócio.
- category: categoria do negócio, se conhecida.
- websiteUrl, phone, email, address, socialUrls: dados públicos, opcionais e com origem rastreável.
- sourceType, sourceUrl, capturedAt: procedência e momento da captura.
- verificationStatus: unreviewed | in_review | verified | needs_correction.
- leadStatus: new | reviewing | qualified | site_preparing | site_ready | proposal_sent | interested | not_interested | converted | archived.
- priority, owner, notes: gestão operacional.
- createdAt, updatedAt: timestamps.

### Site project / proposta
- id, leadId: identidade e vínculo obrigatório com o lead.
- status: not_started | preparing | ready_for_review | approved_to_share | shared | revision_requested | accepted | declined | failed.
- initialTemplateId, initialTemplateVersion: modelo e versão usados para a primeira versão.
- generatedContent: conteúdo derivado dos dados revisados, separado do design.
- previewUrl ou referência local da prévia: opcional; só preencher quando a prévia realmente existir.
- createdAt, updatedAt, sharedAt: datas relevantes.

### Template version
- id, templateId, version, name, description, preview, configuration, status.
- Um projeto registra a versão exata usada; atualizar um modelo não modifica propostas já preparadas.

### Lead activity
- id, leadId, type, summary, createdAt, createdBy.
- Tipos previstos: captura, correção, qualificação, geração iniciada/concluída/falhou, proposta preparada/enviada manualmente, resposta recebida, pedido de alteração de modelo, aceite/recusa e conversão.

## Regras de produto

1. O sistema prepara a primeira versão do site usando o modelo inicial neutro; não exige que o lead escolha um modelo antes de ver sua proposta.
2. Depois de receber/visualizar a primeira versão, o lead poderá selecionar ou solicitar um modelo alternativo entre as opções habilitadas.
3. A seleção é vinculada ao projeto daquele lead; não existe seleção pública/global de estabelecimentos.
4. A seleção de modelo alternativo gera uma nova versão de proposta, mantendo a versão anterior e seu histórico.
5. Dados capturados, dados verificados e hipóteses devem ser visualmente diferenciados.
6. Captura manual ou importação só pode ser marcada como concluída quando os dados realmente foram registrados. Não simular raspagem automática.
7. Preparar, aprovar, enviar e publicar são estados diferentes. Envio e publicação exigem ação explícita e não ocorrem automaticamente.
8. O dashboard pode usar um repositório local/mock nesta fase, mas deve exibir um indicador de modo de demonstração/local e não prometer sincronização entre usuários.
9. Nenhum dado de exemplo pode ser apresentado como lead real.
10. O projeto Supabase `MeuSalao` (`ifkqrtjhdnolkuucgbpb`) é o banco definido para a plataforma. O esquema inicial está aplicado; a integração da aplicação, configuração segura de credenciais e testes de autorização continuam pendentes.

## Dashboard mínimo

- Resumo de pipeline com contagens por status.
- Lista de leads com pesquisa e filtros por status, categoria, origem e prioridade.
- Detalhe do lead com fontes, campos revisados, notas e histórico.
- Ação de qualificar/desqualificar com motivo.
- Ação para preparar a primeira versão de site a partir dos dados aprovados.
- Prévia e status de geração do projeto.
- Histórico manual de contato/resposta sem envio automático.
- Catálogo interno de modelos e ação para vincular uma alternativa ao projeto depois da primeira versão.
- Estado vazio útil e exemplos identificados como demonstração.

## Captura automatizada e prévia compartilhável

### Captura de site público

- O dashboard envia a URL para `POST /api/capture`, implementado em `functions/api/capture.ts` como Cloudflare Pages Function.
- A função faz a requisição no servidor, segue no máximo três redirecionamentos e revalida cada destino; bloqueia esquemas diferentes de HTTP(S), credenciais embutidas, hostnames locais e faixas comuns de IP privado/reservado.
- O HTML tem limite de 1 MB e timeout de 8 segundos. A extração prioriza JSON-LD e metadados HTML (nome, categoria, descrição, telefone, e-mail, endereço e imagem).
- O resultado mantém a URL de origem, URL final, horário e indicadores de quais tipos de campo foram encontrados. A captura coloca leads existentes em revisão e nunca os marca como verificados automaticamente.
- Sites que dependem de JavaScript, bloqueiam robôs, exigem login ou não expõem metadados podem retornar dados incompletos; nesses casos a revisão/correção manual continua necessária.
- O endpoint é para páginas públicas, não para contornar autenticação, paywalls, CAPTCHA ou controles de acesso. Antes de ampliar a operação, configurar rate limiting/observabilidade na borda e validar a política de uso das fontes.

### Link compartilhável da prévia

- `src/pages/SharedSitePreview.tsx` renderiza uma página pública independente do painel administrativo.
- O link usa o parâmetro `site-preview` com payload JSON em Base64 URL-safe. A pessoa que recebe o link não precisa de conta nem acesso ao dashboard, e a prévia abre em outro navegador/dispositivo.
- O payload inclui somente os campos usados na proposta visual, o modelo, a versão e a data. Como o conteúdo está embutido no URL, o link é copiável e autossuficiente, mas não é um registro persistente no servidor e pode ser encaminhado por terceiros.
- A prévia não é um site publicado, não cria domínio próprio, não atualiza automaticamente quando o lead muda e não garante cartões Open Graph/social, pois os metadados são renderizados no cliente.
- A geração do link não envia a proposta automaticamente. O operador decide como e quando compartilhá-lo.

## Estado da integração Supabase

- Banco: `MeuSalao` (`ifkqrtjhdnolkuucgbpb`).
- Migration inicial aplicada e registrada em `supabase/migrations/20261020154758_white_label_site_builder.sql`.
- O frontend ainda usa armazenamento local/mock e não deve ser tratado como sincronizado com o banco.
- Antes de conectar a interface, concluir revisão dos alertas de advisors, configurar autenticação real e testar RLS com usuários de funções distintas.

## Fora do escopo atual

Integração Supabase, autenticação de produção, automação de e-mails/WhatsApp, pagamentos, publicação real, domínios customizados e sincronização multiusuário.
