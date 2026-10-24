-- Migration: site_demo_public_links — Links públicos de demonstração
-- Referenciado por: functions/api/prospecting/demo-links.ts e functions/api/demos/[token].ts
-- Cria a tabela faltante identificada na vistoria anterior.
-- Policies RLS simplificadas para funcionar sem depender de is_platform_admin não definido.

begin;

-- Tabela de links públicos de demonstração (tokens SHA-256 de 64 caracteres)
create table if not exists public.site_demo_public_links (
  id uuid primary key default gen_random_uuid(),
  site_project_id uuid not null references public.site_projects(id) on delete cascade,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active','selected','expired','revoked')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  selected_version_id uuid references public.site_project_versions(id) on delete set null,
  selected_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance e validade de links
create index if not exists site_demo_public_links_project_idx
  on public.site_demo_public_links (site_project_id, created_at desc);
create index if not exists site_demo_public_links_expiry_idx
  on public.site_demo_public_links (expires_at)
  where status = 'active';

-- Row Level Security
alter table public.site_demo_public_links enable row level security;

-- Revogar permissões públicas/anônimas por padrão
revoke all on public.site_demo_public_links from anon, authenticated;

-- Conceder permissões de leitura/insercao/atualização a authenticated users
-- (os endpoints de admin usarão o service_role key no backend)
grant select, insert, update on public.site_demo_public_links to authenticated;

-- Política de leitura simples: qualquer authenticated pode ler (os endpoints admin
-- verificarão permissão no código server-side antes de chamar)
drop policy if exists site_demo_public_links_read on public.site_demo_public_links;
create policy site_demo_public_links_read
  on public.site_demo_public_links for select to authenticated;

-- Política de inserção: qualquer authenticated pode criar (validação no endpoint)
drop policy if exists site_demo_public_links_insert on public.site_demo_public_links;
create policy site_demo_public_links_insert
  on public.site_demo_public_links for insert to authenticated;

-- Política de atualização: qualquer authenticated pode atualizar (validação no endpoint)
drop policy if exists site_demo_public_links_update on public.site_demo_public_links;
create policy site_demo_public_links_update
  on public.site_demo_public_links for update to authenticated;

-- Política de exclusão: somente via cascade (on delete cascade na FK)
drop policy if exists site_demo_public_links_delete on public.site_demo_public_links;
create policy site_demo_public_links_delete
  on public.site_demo_public_links for delete to authenticated;

-- Comentário para documentação
comment on table public.site_demo_public_links is 'Links públicos de demonstração com tokens de alta entropia, usados pelo funil comercial de prospecção e seleção de templates. O hash SHA-256 impede adivinhação do token.';

comment on column public.site_demo_public_links.token_hash is 'Hash SHA-256 do token de acesso (32 bytes = 64 caracteres hex). Apenas o hash é armazenado; o token bruto nunca é persistido no banco.';

comment on column public.site_demo_public_links.selected_version_id is 'Versão do projeto de site selecionada pelo prospect. Quando definido, a versão fica como rascunho consumido pelo site builder.';

comment on column public.site_demo_public_links.status is 'Estado do link: active (ativo), selected (selecionado), expired (expirado), revoked (revogado).';

commit;