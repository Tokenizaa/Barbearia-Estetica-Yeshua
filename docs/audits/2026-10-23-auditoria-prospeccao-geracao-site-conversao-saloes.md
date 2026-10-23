# Auditoria técnica — prospecção, geração de site-modelo e conversão de salões

- **Data:** 2026-10-23
- **Repositório:** `Tokenizaa/Beleza-Digital`
- **Branch inspecionada:** `main`
- **Projeto Supabase inspecionado:** `ifkqrtjhdnolkuucgbpb`
- **Natureza:** vistoria documental de código, migrations e estado de esquema/dados; não é certificação E2E.
- **Regra desta vistoria:** nenhuma alteração foi feita no código funcional ou no banco. Este documento é a única alteração proposta.

## 1. Resumo executivo

A base já contém componentes e tabelas para prospecção, tarefas assíncronas, modelos de site, versões de projeto e demonstrações públicas. Entretanto, a cadeia **Google Maps/Perfil da Empresa → captura → normalização → geração do site → prévia compartilhável → seleção → cadastro/contratação → site do salão** não está comprovada como uma integração operacional única.

**Achados de maior prioridade:**

1. **Crítico — incompatibilidade entre API e banco:** `functions/api/prospecting/demo-links.ts` e `functions/api/demos/[token].ts` usam a tabela `public.site_demo_public_links`, mas a consulta de `information_schema.tables` no projeto Supabase inspecionado não encontrou essa tabela. A consulta SQL retorna as tabelas de projetos/modelos e versões, mas não a tabela de links públicos. Isso pode impedir a emissão e leitura de links de demonstração até que se confirme se há uma migration ausente ou se o nome/tabela foi alterado.
2. **Crítico — captura real não comprovada:** existe infraestrutura de campanhas e fila, mas a migration `20261020185512_prospecting_automation_foundation.sql` declara explicitamente que prepara o modelo de dados e não configura fornecedores nem executa jobs por si só. A interface cria campanhas pausadas com `source_provider: null` e `source_config: {}`. Não foi encontrada referência a Google Places API ou Google Business Profile API na busca do código do repositório.
3. **Alto — fila e funil sem dados operacionais:** consulta read-only ao banco retornou 1 campanha, 0 prospects, 0 tarefas, 0 eventos, 0 projetos de site, 0 versões de projeto, 4 templates e 1 versão de template. Isso é compatível com infraestrutura ainda não executada, não prova isoladamente um defeito.
4. **Alto — contrato de dados inconsistente na renderização:** a página pública interpreta `generated_content` procurando aliases como `businessName`, `business_name`, `title`, `name`, `brandName`; endereço, telefone e categoria também têm aliases. A prévia compartilhada usa outro formato, limitado a nome, categoria, descrição, telefone, e-mail, endereço, URL e template. Não foi comprovado um mapeamento canônico comum, nem suporte completo a fotos, horários, serviços e avaliações.
5. **Alto — caminho de contratação não demonstra a continuidade do projeto:** os botões da prévia redirecionam para `/plataforma/cadastro?name=...`, enquanto a página unificada de acesso também lê `demoToken` e `versionId`. A prévia de seleção obtém e grava uma versão selecionada via token. É necessário comprovar que o token/versão selecionada chega ao cadastro, que o usuário criado fica associado ao prospect/projeto correto e que a conversão não cria um salão duplicado.
6. **Alto — modelo de dados legado paralelo:** `src/data/store.ts` mantém estabelecimentos, serviços, produtos, mídia e agendamentos no `localStorage`. A rota `/admin` renderiza `PlatformSalonDashboard`, que delega a `AdminPage`. Deve-se provar se os dados da demonstração/conta contratada são migrados para o modelo persistente multi-tenant ou se existem dois estados incompatíveis.
7. **Risco de conformidade — imagens e conteúdo Google:** antes de armazenar, transformar ou publicar fotos, avaliações e demais dados, identificar precisamente a fonte e suas condições de uso. Places API tem restrições de cache/armazenamento e requisitos de atribuição para conteúdo e autores. Dados de Places API e dados do Perfil da Empresa autorizados pelo proprietário têm regimes distintos. Não assumir que “scrape público” autoriza reutilização irrestrita.

## 2. Evidências consultadas

### Código

- `src/pages/PlatformAccessPage.tsx`: fluxo de cadastro/login unificado; lê `name`, `demoToken`, `versionId` e `mode` da URL; usa Supabase Auth e importa `ProspectingConsole`.
- `src/pages/ProspectingConsole.tsx`: consulta `prospecting_campaigns`, `prospecting_candidates` e `prospect_events`; consulta endpoints de overview e links de demonstração; cria campanhas pausadas com provedor nulo e configuração vazia.
- `src/pages/PlatformLeadsDashboard.tsx`: valida sessão e registro em `platform_admins` antes de renderizar `LeadsDashboard`.
- `src/pages/PublicDemoSelectionPage.tsx`: carrega `/api/demos/{token}`, monta prévia a partir de `generated_content`, permite selecionar versão via POST.
- `src/pages/SharedSitePreview.tsx`: formato de prévia serializado na query string como Base64 URL; payload limitado a 16.000 caracteres; usa `SiteTemplateRenderer`. Os campos comerciais são limitados e não incluem galeria/horários/serviços no contrato compartilhado.
- `src/components/SiteTemplateRenderer.tsx`: renderer visual de modelos existentes; requer verificação de como os dados de captura alimentam cada seção.
- `src/pages/PlatformSalonDashboard.tsx` e `src/pages/PlatformAdminDashboard.tsx`: verificações de sessão/perfil administrativo; são parte da vistoria de autenticação e conversão.
- `src/App.tsx`: separa rotas de acesso, painel de salão, painel de plataforma, prospecção e demonstração pública.
- `src/data/store.ts`: repositório legado de dados de negócio em `localStorage`; requer comparação com o estado Supabase usado no funil novo.
- `functions/api/prospecting/demo-links.ts`: cria token aleatório de 32 bytes, guarda hash e validade em `site_demo_public_links`; exige sessão válida e administrador da plataforma.
- `functions/api/demos/[token].ts`: consulta `site_demo_public_links`, carrega versões de projeto e grava escolha por RPC `select_public_demo_version`.
- `supabase/migrations/20261020185512_prospecting_automation_foundation.sql`: cria campanhas, fila, deduplicação, eventos e estrutura de prospecção; documenta que não configura fornecedor nem executa jobs.
- `supabase/migrations/20261020185517_prospecting_worker_rpc.sql`: implementa reivindicação atômica de tarefas para worker server-side.
- `wrangler.toml`: configura Pages e KV de rate limit; o arquivo inspecionado não comprova por si só um worker de prospecção agendado ou integração com Google.

### Estado consultado no Supabase

Consulta somente leitura em `ifkqrtjhdnolkuucgbpb`:

| Objeto | Linhas observadas |
|---|---:|
| `prospecting_campaigns` | 1 |
| `prospects` | 0 |
| `prospecting_tasks` | 0 |
| `prospect_events` | 0 |
| `site_projects` | 0 |
| `site_project_versions` | 0 |
| `site_templates` | 4 |
| `site_template_versions` | 1 |

A tabela `site_demo_public_links` não apareceu na consulta ao catálogo de tabelas públicas, embora seja referenciada pelos endpoints acima. As migrations reportadas pelo Supabase incluem `20261020185512_prospecting_automation_foundation` e `20261020185517_prospecting_worker_rpc`; a listagem consultada não demonstrou uma migration que crie `site_demo_public_links`. Antes de corrigir, confirmar se a tabela foi renomeada, removida ou se há migração ausente no repositório.

## 3. Fluxo pretendido e pontos de controle

1. **Descobrir:** campanha define segmento e região; provedor e configuração devem estar explícitos, com limites, agendamento e regras de elegibilidade.
2. **Capturar:** coletor registra identificador do local, origem, instante, campos recebidos e referências a imagens. A execução deve ter timeout, retentativa, idempotência e evidência de erro.
3. **Deduplicar e normalizar:** criar chave estável; normalizar telefone, endereço, categoria e URL; reconciliar duplicatas sem fundir estabelecimentos distintos.
4. **Mapear para um contrato canônico:** um esquema versionado deve distinguir valor bruto da fonte, valor normalizado, valor editado por humano, confiança, origem, data e estado de revisão.
5. **Gerar projeto de site:** vincular prospect → projeto → versão do projeto → versão do template. Gerar conteúdo a partir de um mapeamento explícito, não de aliases dispersos em componentes.
6. **Validar a prévia:** renderizar todos os campos suportados; ocultar o que não existe; marcar itens pendentes; verificar responsividade e links. Não inventar endereço, serviços, preços, avaliações ou horário.
7. **Publicar link de demonstração:** token aleatório, apenas hash persistido, validade, revogação, limitação de tentativas, dados mínimos expostos e controle de acesso. Verificar a existência da tabela e a RPC usada.
8. **Registrar a escolha:** versão selecionada deve pertencer ao projeto referenciado pelo token, e a seleção precisa ser atômica, auditável e idempotente.
9. **Converter em cliente:** preservar token/versão no fluxo de cadastro; associar usuário, salão, prospect e projeto; evitar duplicidade; exigir confirmação dos dados pelo proprietário.
10. **Contratar e ativar:** só ativar os recursos contratados após confirmação autoritativa de pagamento, mantendo demonstração, contrato, plano e tenant ligados por IDs persistentes.
11. **Operar o salão:** o conteúdo aprovado deve alimentar o estado persistente de gestão e publicação, sem depender de `localStorage` como fonte de verdade compartilhada.

## 4. Matriz de achados e prioridade

| ID | Severidade | Achado | Impacto potencial | Evidência/limite |
|---|---|---|---|---|
| A-01 | Crítica | Endpoint usa tabela de link público ausente no catálogo do banco | Não criar/carregar demos | Catálogo SQL + `demo-links.ts` e `[token].ts` |
| A-02 | Crítica | Provedor Google não comprovado/configuração nula | Funil não captura dados reais | Busca no repo sem referências Google; campanha criada com provider nulo |
| A-03 | Alta | Nenhuma tarefa/prospect/projeto presente no banco | Não há evidência de execução ponta a ponta | Contagens read-only; pode ser ambiente recém-configurado |
| A-04 | Alta | Campos da prévia divergentes/limitados | Perda de fotos, horários, serviços e outros dados | `PublicDemoSelectionPage.tsx` e `SharedSitePreview.tsx` |
| A-05 | Alta | Continuidade da versão aprovada até cadastro não comprovada | Cadastro desvinculado ou projeto perdido | URL de CTA não preserva explicitamente token/version na prévia compartilhada |
| A-06 | Alta | Estado local legado paralelo ao banco multi-tenant | Conteúdo divergente, perda em troca de dispositivo, isolamento inadequado | `src/data/store.ts`, `App.tsx`, `PlatformSalonDashboard.tsx` |
| A-07 | Alta | Ausência de contrato canônico e proveniência por campo comprovada | Dados errados ou conteúdo inventado | Aliases no renderizador de demo; requer mapear migrations e pipeline completo |
| A-08 | Alta | Regras de uso/atribuição das fontes Google não documentadas no fluxo | Risco de uso indevido de fotos, reviews e conteúdo | Ver seção 7 e fontes oficiais |
| A-09 | Média | Cobertura E2E do funil não foi executada nesta vistoria | Integração ainda não certificada | Inspeção estática e consultas read-only, sem navegador |
| A-10 | Média | Logout/gestão administrativa não foram exercitados nesta vistoria | Problemas de sessão podem permanecer | Componentes identificados, mas sem teste de navegador nesta execução |

## 5. Contrato de dados recomendado para validar na contraprova

Não implementar durante a auditoria. O agente local deve verificar se já existe algo equivalente antes de propor novas tabelas.

Cada campo usado pelo site-modelo deve ter uma origem definida, por exemplo:

- `source_value`: valor bruto retornado pelo fornecedor, quando permitido armazená-lo.
- `normalized_value`: valor normalizado para consumo do produto.
- `edited_value`: correção explicitamente feita pelo proprietário ou operador.
- `effective_value`: valor efetivo conforme regra de precedência documentada.
- `source_provider`, `source_record_id`, `captured_at`, `field_status`, `reviewed_at`.
- `field_status`: `source_confirmed`, `needs_review`, `owner_confirmed`, `missing`, `not_allowed_to_store`.

Para imagens, além da URL/referência, registrar fonte, validade, atribuição do autor, permissões de reutilização e caminho de substituição por mídia fornecida pelo próprio salão. Não copiar uma URL temporária de foto da API para uso permanente sem confirmar as regras aplicáveis.

Regra de precedência proposta para avaliação: **correção confirmada pelo proprietário > edição operacional autorizada > dado importado válido > vazio**. Conteúdo editorial gerado por IA deve ter um tipo separado de dado factual e nunca substituir fatos ausentes.

## 6. Plano de contraprova para o agente local e seus subagentes

O agente local deve executar uma análise independente a partir do estado real do checkout local e do `main` remoto, sem apenas repetir este relatório. Deve usar subagentes em frentes paralelas e consolidar evidências concretas.

### Subagente 1 — Coleta e conformidade da fonte
- Localizar o coletor real, provedor, credenciais por nome de variável (sem revelar valores), chamadas de API, limites e tratamento de erros.
- Distinguir Places API, scraping de páginas públicas e Business Profile API autorizada.
- Identificar exatamente quais campos podem ser persistidos/reutilizados e as exigências de atribuição.

### Subagente 2 — Modelo de dados e migrations
- Inspecionar migrations locais versus migrations aplicadas no Supabase.
- Confirmar a ausência/presença de `site_demo_public_links`, a RPC `select_public_demo_version`, FKs, RLS, grants e triggers.
- Explicar por que há 1 campanha, mas 0 prospects/tasks/events/projects, sem alterar dados.

### Subagente 3 — Pipeline de geração e templates
- Traçar o caminho de cada campo da captura até `generated_content`, `design_overrides` e `SiteTemplateRenderer`.
- Construir tabela campo de origem → campo canônico → seção/componente do template → persistência → evidência.
- Testar campos ausentes, acentos, telefone, URLs, fotos, horários e dados conflitantes.

### Subagente 4 — Demonstração, seleção e conversão
- Traçar token → link → versões → escolha → CTA → cadastro/Auth → estabelecimento/membership → pagamento/ativação.
- Verificar se a seleção fica vinculada ao mesmo projeto e se há risco de criar duplicata.
- Confirmar expiração, revogação, autorização, exposição de dados e idempotência.

### Subagente 5 — Gestão, auth e persistência
- Comparar o estado em `localStorage` com Supabase e identificar a fonte de verdade para salão/serviços/produtos/mídia/agendamentos.
- Exercitar logout, login, isolamento por tenant e o retorno de usuário autenticado às rotas certas.
- Identificar o que realmente é usado no fluxo novo versus componentes legados.

### Trabalho do agente orquestrador
- Não fazer correções funcionais durante a contraprova.
- Rodar os testes existentes e, quando possível, Playwright/browser no ambiente de desenvolvimento sem dados reais de clientes.
- Não executar coleta em massa nem enviar mensagens/outreach reais.
- Não expor segredos; registrar somente nomes de variáveis e presença/ausência de configuração.
- Entregar um relatório independente com evidência por arquivo/linha, queries read-only, resultados de testes e diferenças em relação a este documento.
- Encerrar com uma matriz: **confirmado / refutado / inconclusivo**, severidade, reprodução, e próxima ação sugerida.
- Não considerar “build passou” como prova de que a captura, prévia e contratação funcionam de ponta a ponta.

## 7. Referências oficiais de política Google

- [Políticas e atribuições da Places API (Google for Developers)](https://developers.google.com/maps/documentation/places/web-service/policies?hl=pt): regras de atribuição, autoria de fotos/reviews, links de origem e limitações de armazenamento.
- [Políticas de atribuição da Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/policies): atribuição e conteúdo fornecido por autores.
- É necessário determinar a fonte real antes de aplicar regras: Places API para dados públicos de locais e Business Profile API para dados de perfis que o usuário possui ou está autorizado a administrar não devem ser tratados como equivalentes.

## 8. Critérios mínimos para declarar a engrenagem validada

A validação exige evidência de uma execução controlada completa:

1. Um estabelecimento de teste é descoberto por uma fonte configurada e documentada.
2. O registro é normalizado e deduplicado sem perder a origem dos campos.
3. Uma versão de template é gerada com mapeamento determinístico dos campos disponíveis.
4. A prévia mostra os campos corretos e não apresenta fatos inventados; mídia e atribuições estão de acordo com a fonte.
5. O link público é criado, expira e é rejeitado quando inválido; a versão escolhida pertence ao projeto do link.
6. A escolha chega ao cadastro e o proprietário confirma/corrige os dados.
7. O fluxo cria ou associa um único tenant, preserva o projeto aprovado e não concede ativação paga antes da confirmação do pagamento.
8. Após login em outro navegador/dispositivo, o salão vê os mesmos dados persistidos; nenhum tenant consegue acessar dados de outro.
9. Logout remove a sessão e redireciona para uma rota pública de forma consistente.
10. Evidências incluem IDs de teste, respostas/status, screenshots ou trace, registros de eventos e resultado de cada etapa — sem segredos ou dados pessoais reais.

**Conclusão:** há fundação de prospecção e site builder no repositório, mas o estado observado não comprova a cadeia operacional. A incompatibilidade entre o endpoint e a tabela de links públicos e a ausência de integração Google demonstrável devem ser tratadas como os primeiros bloqueios da vistoria. Não executar correções até a contraprova independente e a consolidação dos achados.
