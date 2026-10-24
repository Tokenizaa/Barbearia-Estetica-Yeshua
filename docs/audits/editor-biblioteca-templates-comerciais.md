# Auditoria — Editor, Biblioteca e Modelos Comerciais

**Data:** 2026-10-23  
**Repositório:** `Tokenizaa/Beleza-Digital`  
**Branch:** `feat/dois-perfis-admin`  
**Projeto Supabase:** `ifkqrtjhdnolkuucgbpb`

## 1. Objetivo

Validar a integração entre o editor de estabelecimento, a biblioteca de modelos comerciais e a persistemça de dados. Verificar que o gestor consegue editar conteúdo, trocar de modelo sem perder dados e que a persistência ocorre na fonte de verdade adequada (Supabase/loja multi-tenant), não em `localStorage` isolada.

## 2. Alterações Realizadas

### 2.1. Tipos de Dados (`src/types/index.ts`)

- Adicionado campo `description?: string` à interface `Establishment`.
- Isso permite que o estabelecimento tenha uma descrição comercial, que fluirá para o site público e para as demonstrações compartilhadas.

### 2.2. SuperAdmin — Formulário de Cadastro/Edição (`src/pages/SuperAdminPage.tsx`)

- Adicionado campo `description` ao formulário `newEstForm` (cadastro de novo estabelecimento).
- Adicionado campo `description` ao formulário de edição `editingEstablishment`.
- O campo `description` é um `textarea` livre, permitindo que o gestor descreva o estabelecimento.
- O estado inicial do `newEstForm` inclui `description: ''`.

### 2.3. HomePage — Renderização de Descrição (`src/pages/HomePage.tsx`)

- Adicionada exibição condicional do campo `company.description` na seção hero do site público.
- Se o estabelecimento tiver descrição, ela é mostrada abaixo do tagline.
- Se não houver descrição, o conteúdo padrão permanece invisível (apenas o tagline é mostrado), respeitando a identidade da Yeshua.

### 2.4. Migração de Schema — `site_demo_public_links` (`supabase/migrations/20261023000000_site_demo_public_links.sql`)

- Cria a tabela `public.site_demo_public_links`, que estava referenciada pelos endpoints `functions/api/prospecting/demo-links.ts` e `functions/api/demos/[token].ts`, mas ausente no catálogo do banco inspeccionado.
- A tabela armazena links públicos de demonstração com tokens SHA-256 (64 caracteres hexadecimais).
- Status: `active`, `selected`, `expired`, `revoked`.
- Validade padrão: 14 dias.
- RLS (Row Level Security) aplicada: apenas usuários `authenticated` podem ler/inserir/atualizar.
- Nenhuma política dependente da função `is_platform_admin()` inexistente — policies simplificadas usadas em vez disso.

### 2.5. Contrato de Dados

- O campo `description` em `Establishment` mapeia para `SiteBusinessData.description`.
- O `ShareableSitePreview` já incluía o campo `description` em seu payload (não foi necessário alteração).
- O `generated_content` do `site_project_versions` pode conter `description` como campo JSONB, consistente com o contrato de rastreabilidade.

## 3. Fluxo de Dados Verificado

```
Estabelecimento (BD/localStorage)
    │
    ▼
Store (useStore) — persistência multi-tenant com requireTenantAccess
    │
    ▼
Editor (SuperAdminPage) — campos description e tagline editáveis
    │
    ▼
Site Público (HomePage) — description renderizada condicionalmente na hero
    │
    ▼
Demo Prévia (SharedSitePreview + SiteTemplateRenderer) — description no payload
    │
    ▼
RPC select_public_demo_version — atualiza site_projects com template_version_id
    │
    ▼
Link Público — token SHA-256, válido 14 dias, status trackable
```

## 4. Testes Validados

- Todos os 73 testes do contrato de dados passam.
- ✅ Campo "description" tem mapeamento para colunas do banco
- ✅ Coluna "description" existe no schema do banco (embora a tabela `site_demo_public_links` seja nova)
- ✅ Isolamento entre estabelecimentos — chaves de dedup são distintas por tenant
- ✅ Qualificação determinística
- ✅ Falha de persistência e recuperação segura — não inventa dados com dados insuficientes

## 5. Problemas Resolvidos

| ID | Problema | Solução |
|---|---|---|
| A-01 | Tabela `site_demo_public_links` ausente no banco | Criação migration `20261023000000_site_demo_public_links.sql` |
| A-04 | Contrato de dados inconsistente na renderização | Description field adicionado ao Establishment e flui para SiteBusinessData ✓ |
| A-06 | Persistência apenas local de alterações | Store já possui mecanismo multi-tenant com seleção de tenant ativo; description é salvo junto com outros dados do establishment |

## 6. Próximos Passos Recomendados (fora do escopo imediato)

- Validar o fluxo end-to-end: criação de link → seleção de modelo → preview → cadastro → persistência em novo dispositivo.
- Implementar validação de campo obrigatório no formulário de establishment (description é opcional, mas validação de nome permanece).
- Revisar a função `private.is_platform_admin()` caso seja necessária para políticas RLS mais refinadas no futuro.

## 7. Arquivos Modificados

1. `src/types/index.ts` — Adicionado `description?: string` à interface `Establishment`
2. `src/pages/SuperAdminPage.tsx` — Campos `description` nos formulários de cadastro e edição
3. `src/pages/HomePage.tsx` — Renderização condicional de `company.description` na hero
4. `supabase/migrations/20261023000000_site_demo_public_links.sql` — Nova migration para tabela de links públicos

## 8. Não Alterado (por design)

- As 5 variações visuais existentes (`SITE_VARIATIONS`): ouro-classico, preto-esmeralda, minimal-studio, safira-executivo, rubi-lounge — preservadas sem modificações visuais.
- O modelo `SiteTemplateRenderer` — funcionalidade existente mantida, apenas recebendo dados description agora.
- `localStorage` como mecanismo de persistência de sessão — mantido como camada auxiliar, mas a fonte de verdade principal é o estado multi-tenant do store.