# Especificação funcional — captação de leads e dashboard

## Objetivo

Preparar a operação de prospecção e a produção de uma primeira versão personalizada de site, sem integrar Supabase nesta fase. O dashboard é interno; o lead não navega por um marketplace.

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
10. O Supabase já existente será conectado em fase posterior; esta especificação não autoriza criar outro projeto, conectar credenciais ou aplicar migrations agora.

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

## Fora do escopo atual

Integração Supabase, autenticação de produção, scraping automatizado, automação de e-mails/WhatsApp, pagamentos, publicação real, domínios customizados e sincronização multiusuário.
