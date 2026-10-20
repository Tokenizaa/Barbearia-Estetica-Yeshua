# Roadmap — Plataforma de sites personalizados white label

## Direção do produto

O produto não é um marketplace e não deve pedir ao visitante que escolha um estabelecimento em uma lista global. O fluxo é de prospecção assistida e criação de uma proposta personalizada para um negócio específico:

1. Capturar dados públicos e permitidos de um negócio e registrar as fontes.
2. Revisar e qualificar os dados; distinguir fatos verificados de campos ausentes ou inferidos.
3. Gerar um rascunho de site usando dados aprovados, sem publicar nem contatar automaticamente o negócio.
4. Permitir que o operador visualize e selecione entre modelos de site ativos.
5. Renderizar a proposta no modelo e permitir revisão humana do conteúdo, imagens, links e identidade visual.
6. Aprovar a proposta antes de compartilhar/publicar.
7. Quando o negócio aceitar, convertê-lo em estabelecimento/cliente e vincular o projeto do site à sua conta.
8. Publicar usando um slug/domínio próprio, com configuração por estabelecimento.

## Marca e navegação

- “Yeshua” não é a marca da plataforma nem o modelo padrão.
- O registro do Yeshua é preservado como primeiro estabelecimento legado, sem PINs ou credenciais hardcoded.
- Remover seletor global de estabelecimento e seleção automática por query string/localStorage. O contexto do estabelecimento deve vir de uma rota/domínio resolvido e de autorização validada no servidor.
- A escolha de modelo é uma etapa do editor/projeto: catálogo de modelos ativos, pré-visualização, escolha explícita e possibilidade de trocar o modelo antes da aprovação.
- Começar com um modelo neutro, responsivo e reutilizável. Novos modelos são registros e versões de configuração, não duplicações da aplicação.
- Não implementar marketplace, busca pública de estabelecimentos, checkout, assinatura ou envio automático de prospecção nesta fase.

## Estado atual encontrado

- Aplicação React + TypeScript + Vite.
- Deploy configurado para Cloudflare Pages (barbearia-yeshua).
- O estado atual multiestabelecimento está principalmente em localStorage/sessionStorage (src/data/store.ts).
- Existem PINs de administrador no bundle cliente e autenticação local que gera tokens fictícios. Isso não é uma fronteira de segurança.
- A base atual possui exemplos de Yeshua e Império; esses dados demo não devem ser tratados como clientes reais nem copiados automaticamente para produção.
- Os projetos Supabase atualmente acessíveis foram consultados e nenhum corresponde a esta aplicação. A migration está preparada no repositório, mas ainda não foi aplicada a um banco.

## Arquitetura alvo

- Frontend: preservar React + TypeScript + Vite e o deploy atual na Cloudflare enquanto o fluxo é migrado.
- Auth e banco: Supabase Auth + Postgres + RLS.
- Browser: usar apenas publishable key no frontend; nunca colocar service-role/secret key no bundle.
- Operações privilegiadas (captura automatizada, tarefas de IA, provisionamento, publicação e integrações): camada server-side/Cloudflare Worker ou função server-side segura com segredos em ambiente.
- Dados de prospecção: armazenar origem, URLs públicas e evidências, data da captura e estado de revisão. Não contornar CAPTCHA, login, paywall ou controles de acesso.
- Geração de site: JSON de conteúdo separado da configuração/versão do modelo.
- Auditoria: registrar alterações de privilégios, conversão de prospect, aprovação e publicação.

## Modelo de autorização

- Administrador da plataforma: atribuído somente por processo privilegiado confiável; app_metadata não pode ser editado pelo usuário final. A tabela platform_admins serve como registro; a claim autorizadora deve ser provisionada pelo backend/admin API.
- Owner/admin/editor/viewer local: associação explícita em establishment_memberships.
- Um estabelecimento só vê e altera seus próprios projetos e configurações.
- Prospects ainda não convertidos e tarefas de prospecção são acessíveis apenas à administração da plataforma.
- Modelos publicados podem ser listados por usuários autenticados; criar, editar, ativar e versionar modelos é ação da plataforma.
- RLS em todas as tabelas expostas; as rotas e o frontend não substituem as políticas.
- Não permitir autoatribuição de papel, nem cadastro público que crie administrador geral.

## Modelo de dados preparado

A migration supabase/migrations/20261019000000_white_label_site_builder.sql define:
- platform_admins
- establishments
- establishment_memberships
- prospects
- site_templates
- site_template_versions
- site_projects
- audit_events
- Funções de autorização no schema não exposto private, políticas RLS, grants e um modelo inicial neutro versionado.

O registro inicial de Yeshua é preservado como estabelecimento. Não são inseridos usuários administrativos, PINs, agendamentos de exemplo nem prospects fictícios.

## Fases de execução

### Fase A — Fundação de dados e segurança
- Criar/confirmar um projeto Supabase dedicado.
- Aplicar a migration e verificar tabelas, índices, grants, RLS e advisors.
- Configurar Supabase Auth, criar o primeiro administrador geral por procedimento seguro e validar os claims.
- Criar testes de isolamento entre dois estabelecimentos e de negação para usuário não autenticado.

### Fase B — Remover o modelo de marketplace
- Retirar seleção global de tenant e dados de demonstração da navegação principal.
- Remover PINs, sessões fictícias e autenticação baseada apenas no navegador.
- Substituir a persistência local por repositórios Supabase com tipos.
- Manter compatibilidade/migração não destrutiva dos dados locais do Yeshua quando necessário, sem importá-los automaticamente para um banco de produção sem revisão.

### Fase C — Prospecção e dados de origem
- Criar captura manual/assistida inicial com fontes públicas permitidas.
- Armazenar evidências e separar dados verificados, ausentes e inferidos.
- Criar revisão e qualificação humana antes da geração do site.
- Não disparar mensagens automaticamente.

### Fase D — Catálogo e personalização de modelos
- Criar catálogo administrativo de modelos ativos e pré-visualizações.
- Criar seletor de modelo dentro do projeto/editor, não no site público.
- Fixar a versão exata do modelo no projeto para evitar que atualizações futuras alterem sites já aprovados.
- Aplicar os dados aprovados, permitindo revisar texto, imagens, contato, cores e seções.

### Fase E — Aprovação e publicação
- Fluxo de rascunho → revisão → aprovação humana → publicação.
- Domínio/slug por site, status e auditoria.
- Não publicar nem compartilhar proposta sem ação explícita de aprovação.

## Bloqueios antes de execução no banco

1. Nenhum projeto Supabase acessível foi identificado como pertencente a este repositório. Os projetos existentes são de outros produtos; não reutilizar esses bancos.
2. É necessário confirmar a organização e criar/selecionar um projeto Supabase dedicado. A criação pode gerar custos.
3. A migration precisa ser aplicada e testada no banco real antes de dizer que o banco está pronto.
4. A migration preparada não substitui testes reais de RLS, autenticação, build e fluxos do navegador.

## Critérios de aceite

- Nenhum nome ou ativo do Yeshua funciona como marca global/default de plataforma.
- Não existe seletor global de marketplace.
- Um prospect pode gerar um projeto de site em rascunho.
- O operador pode escolher entre os modelos ativos e trocar o modelo antes da aprovação.
- Cada projeto guarda uma versão imutável do modelo escolhido.
- Dados de um estabelecimento não são acessíveis a outro.
- O usuário não pode elevar privilégios editando o cliente ou a própria metadata.
- Nenhum site é publicado nem contato enviado sem aprovação explícita.
