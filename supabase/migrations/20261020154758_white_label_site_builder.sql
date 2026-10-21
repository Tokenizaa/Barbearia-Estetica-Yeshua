-- White-label site builder: prospects -> personalized draft -> template choice -> approval -> publish.
-- No public access is granted. Server-side jobs use a secret service credential; never ship it to the browser.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  status text not null default 'draft' check (status in ('draft','active','inactive','archived')),
  logo_url text,
  primary_color text not null default '#2563eb',
  secondary_color text not null default '#111827',
  contact jsonb not null default '{}'::jsonb,
  brand_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.establishment_memberships (
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (establishment_id, user_id)
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  slug text,
  category text,
  city text,
  region text,
  country_code text not null default 'BR',
  website_url text,
  phone text,
  email text,
  social_links jsonb not null default '{}'::jsonb,
  public_source_urls text[] not null default '{}',
  source_name text,
  captured_data jsonb not null default '{}'::jsonb,
  qualification jsonb not null default '{}'::jsonb,
  status text not null default 'captured' check (status in ('captured','qualified','draft_ready','contacted_manually','converted','rejected','archived')),
  captured_by uuid references auth.users(id) on delete set null,
  converted_establishment_id uuid references public.establishments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_status_created_idx on public.prospects(status, created_at desc);
create index if not exists prospects_city_category_idx on public.prospects(city, category);

create table if not exists public.site_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  preview_image_url text,
  category text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.site_templates(id) on delete restrict,
  version integer not null check (version > 0),
  config jsonb not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (template_id, version)
);

create index if not exists site_template_versions_published_idx
  on public.site_template_versions(template_id, is_published);

create table if not exists public.site_projects (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid references public.prospects(id) on delete restrict,
  establishment_id uuid references public.establishments(id) on delete cascade,
  template_version_id uuid not null references public.site_template_versions(id) on delete restrict,
  name text not null,
  status text not null default 'draft' check (status in ('draft','awaiting_review','approved','published','paused','rejected','archived')),
  generated_content jsonb not null default '{}'::jsonb,
  design_overrides jsonb not null default '{}'::jsonb,
  public_slug text unique,
  published_url text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_project_owner_check check (
    (prospect_id is not null and establishment_id is null)
    or (prospect_id is null and establishment_id is not null)
  )
);

create index if not exists site_projects_prospect_idx on public.site_projects(prospect_id, created_at desc);
create index if not exists site_projects_establishment_idx on public.site_projects(establishment_id, created_at desc);
create index if not exists site_projects_status_idx on public.site_projects(status, created_at desc);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  site_project_id uuid references public.site_projects(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_idx on public.audit_events(created_at desc);
create index if not exists audit_events_establishment_idx on public.audit_events(establishment_id, created_at desc);

-- These helpers expose only authorization decisions. They are kept in a non-exposed schema,
-- have a fixed search_path, and are executable only by authenticated users.
create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'platform_admin', false);
$$;

create or replace function private.has_establishment_role(
  p_establishment_id uuid,
  p_roles text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.establishment_memberships m
    where m.establishment_id = p_establishment_id
      and m.user_id = auth.uid()
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.has_establishment_role(uuid, text[]) from public, anon;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_establishment_role(uuid, text[]) to authenticated;

alter table public.platform_admins enable row level security;
alter table public.establishments enable row level security;
alter table public.establishment_memberships enable row level security;
alter table public.prospects enable row level security;
alter table public.site_templates enable row level security;
alter table public.site_template_versions enable row level security;
alter table public.site_projects enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists platform_admins_read_self_or_platform_admin on public.platform_admins;
create policy platform_admins_read_self_or_platform_admin
on public.platform_admins for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_platform_admin()));

drop policy if exists platform_admins_manage_platform_admin on public.platform_admins;
create policy platform_admins_manage_platform_admin
on public.platform_admins for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

drop policy if exists establishments_read_authorized on public.establishments;
create policy establishments_read_authorized
on public.establishments for select to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_establishment_role(id, null))
);

drop policy if exists establishments_insert_platform_admin on public.establishments;
create policy establishments_insert_platform_admin
on public.establishments for insert to authenticated
with check ((select private.is_platform_admin()));

drop policy if exists establishments_update_authorized on public.establishments;
create policy establishments_update_authorized
on public.establishments for update to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_establishment_role(id, array['owner','admin']::text[]))
)
with check (
  (select private.is_platform_admin())
  or (select private.has_establishment_role(id, array['owner','admin']::text[]))
);

drop policy if exists establishments_delete_platform_admin on public.establishments;
create policy establishments_delete_platform_admin
on public.establishments for delete to authenticated
using ((select private.is_platform_admin()));

drop policy if exists memberships_read_self_or_managers on public.establishment_memberships;
create policy memberships_read_self_or_managers
on public.establishment_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_platform_admin())
  or (select private.has_establishment_role(establishment_id, array['owner','admin']::text[]))
);

drop policy if exists memberships_insert_managers on public.establishment_memberships;
create policy memberships_insert_managers
on public.establishment_memberships for insert to authenticated
with check (
  (select private.is_platform_admin())
  or (
    (select private.has_establishment_role(establishment_id, array['owner','admin']::text[]))
    and role <> 'owner'
  )
);

drop policy if exists memberships_update_managers on public.establishment_memberships;
create policy memberships_update_managers
on public.establishment_memberships for update to authenticated
using (
  (select private.is_platform_admin())
  or (select private.has_establishment_role(establishment_id, array['owner']::text[]))
)
with check (
  (select private.is_platform_admin())
  or (select private.has_establishment_role(establishment_id, array['owner']::text[]))
);

drop policy if exists memberships_delete_managers on public.establishment_memberships;
create policy memberships_delete_managers
on public.establishment_memberships for delete to authenticated
using (
  (select private.is_platform_admin())
  or (user_id <> (select auth.uid()) and (select private.has_establishment_role(establishment_id, array['owner']::text[])))
);

drop policy if exists prospects_platform_admin_all on public.prospects;
create policy prospects_platform_admin_all
on public.prospects for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

drop policy if exists prospects_establishment_members_read on public.prospects;
create policy prospects_establishment_members_read
on public.prospects for select to authenticated
using (
  converted_establishment_id is not null
  and (select private.has_establishment_role(converted_establishment_id, null))
);

drop policy if exists templates_read_authenticated on public.site_templates;
create policy templates_read_authenticated
on public.site_templates for select to authenticated
using (is_active or (select private.is_platform_admin()));

drop policy if exists templates_manage_platform_admin on public.site_templates;
create policy templates_manage_platform_admin
on public.site_templates for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

drop policy if exists template_versions_read_authenticated on public.site_template_versions;
create policy template_versions_read_authenticated
on public.site_template_versions for select to authenticated
using (is_published or (select private.is_platform_admin()));

drop policy if exists template_versions_manage_platform_admin on public.site_template_versions;
create policy template_versions_manage_platform_admin
on public.site_template_versions for all to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));

drop policy if exists site_projects_read_authorized on public.site_projects;
create policy site_projects_read_authorized
on public.site_projects for select to authenticated
using (
  (select private.is_platform_admin())
  or (
    establishment_id is not null
    and (select private.has_establishment_role(establishment_id, null))
  )
);

drop policy if exists site_projects_insert_authorized on public.site_projects;
create policy site_projects_insert_authorized
on public.site_projects for insert to authenticated
with check (
  (select private.is_platform_admin())
  or (
    establishment_id is not null
    and (select private.has_establishment_role(establishment_id, array['owner','admin','editor']::text[]))
  )
);

drop policy if exists site_projects_update_authorized on public.site_projects;
create policy site_projects_update_authorized
on public.site_projects for update to authenticated
using (
  (select private.is_platform_admin())
  or (
    establishment_id is not null
    and (select private.has_establishment_role(establishment_id, array['owner','admin','editor']::text[]))
  )
)
with check (
  (select private.is_platform_admin())
  or (
    establishment_id is not null
    and (select private.has_establishment_role(establishment_id, array['owner','admin','editor']::text[]))
  )
);

drop policy if exists site_projects_delete_authorized on public.site_projects;
create policy site_projects_delete_authorized
on public.site_projects for delete to authenticated
using (
  (select private.is_platform_admin())
  or (
    establishment_id is not null
    and (select private.has_establishment_role(establishment_id, array['owner','admin']::text[]))
  )
);

drop policy if exists audit_events_read_platform_admin on public.audit_events;
create policy audit_events_read_platform_admin
on public.audit_events for select to authenticated
using ((select private.is_platform_admin()));

drop policy if exists audit_events_insert_authorized on public.audit_events;
create policy audit_events_insert_authorized
on public.audit_events for insert to authenticated
with check (
  actor_user_id = (select auth.uid())
  and (
    (select private.is_platform_admin())
    or (
      establishment_id is not null
      and (select private.has_establishment_role(establishment_id, array['owner','admin']::text[]))
    )
  )
);

-- Explicit least-privilege grants; RLS policies remain the row-level boundary.
revoke all on table
  public.platform_admins,
  public.establishments,
  public.establishment_memberships,
  public.prospects,
  public.site_templates,
  public.site_template_versions,
  public.site_projects,
  public.audit_events
from anon;

grant select, insert, update, delete on table
  public.platform_admins,
  public.establishments,
  public.establishment_memberships,
  public.prospects,
  public.site_templates,
  public.site_template_versions,
  public.site_projects,
  public.audit_events
to authenticated;

grant usage, select on sequence public.audit_events_id_seq to authenticated;

-- Preserve Yeshua as one establishment record, not as the product's brand/default identity.
insert into public.establishments (slug, name, status, primary_color, secondary_color, contact, brand_settings)
values (
  'yeshua',
  'Barbearia & Estética Yeshua',
  'active',
  '#f59e0b',
  '#d97706',
  jsonb_build_object(
    'phone', '(92) 98618-7766',
    'whatsapp', '5592986187766',
    'address', 'Av. Constantino Nery, 50 — Centro',
    'city', 'Manaus',
    'region', 'Amazonas',
    'instagram', 'https://www.instagram.com/barbearia_estetica_yeshua/'
  ),
  jsonb_build_object('theme', 'amber', 'source', 'legacy-project-bootstrap')
)
on conflict (slug) do nothing;

-- One neutral starter template. Yeshua is a tenant record, never the platform brand or default template.
insert into public.site_templates (slug, name, description, category)
values (
  'modelo-inicial',
  'Modelo inicial',
  'Modelo-base responsivo e personalizável para negócios locais. O conteúdo e a identidade visual são preenchidos a partir dos dados verificados do estabelecimento.',
  'general'
)
on conflict (slug) do nothing;

insert into public.site_template_versions (template_id, version, config, is_published)
select t.id, 1,
  jsonb_build_object(
    'schemaVersion', 1,
    'layout', 'local-business',
    'sections', jsonb_build_array('hero','about','services','gallery','contact'),
    'theme', jsonb_build_object('primary', '#2563eb', 'secondary', '#111827', 'surface', '#ffffff'),
    'responsive', true,
    'contentSource', 'approved-prospect-data'
  ),
  true
from public.site_templates t
where t.slug = 'modelo-inicial'
  and not exists (
    select 1 from public.site_template_versions v
    where v.template_id = t.id and v.version = 1
  );

-- No admin users, secrets, PINs, production appointments, or fabricated prospects are seeded here.
