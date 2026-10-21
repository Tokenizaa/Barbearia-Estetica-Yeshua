-- Public demo links use high-entropy bearer tokens stored only as SHA-256 hashes.
begin;

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

create index if not exists site_demo_public_links_project_idx
  on public.site_demo_public_links (site_project_id, created_at desc);
create index if not exists site_demo_public_links_expiry_idx
  on public.site_demo_public_links (expires_at)
  where status = 'active';

alter table public.site_demo_public_links enable row level security;
revoke all on public.site_demo_public_links from anon, authenticated;
grant select, insert, update on public.site_demo_public_links to authenticated;
create policy site_demo_public_links_admin_read
  on public.site_demo_public_links for select to authenticated
  using ((select private.is_platform_admin()));
create policy site_demo_public_links_admin_write
  on public.site_demo_public_links for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create or replace function public.select_public_demo_version(
  p_token_hash text,
  p_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.site_demo_public_links%rowtype;
  v_version public.site_project_versions%rowtype;
begin
  if p_token_hash is null or length(p_token_hash) <> 64 then
    raise exception 'invalid_demo_token';
  end if;

  select * into v_link
  from public.site_demo_public_links
  where token_hash = p_token_hash
  for update;

  if not found or v_link.status not in ('active','selected') or v_link.expires_at <= now() then
    raise exception 'demo_link_unavailable';
  end if;

  select * into v_version
  from public.site_project_versions
  where id = p_version_id and site_project_id = v_link.site_project_id;

  if not found then raise exception 'demo_version_not_found'; end if;

  update public.site_project_versions
  set selected_by_prospect = (id = p_version_id),
      selection_source = case when id = p_version_id then 'public_landing' else selection_source end
  where site_project_id = v_link.site_project_id;

  update public.site_demo_public_links
  set status = 'selected', selected_version_id = p_version_id,
      selected_at = now(), updated_at = now()
  where id = v_link.id;

  -- Make the selected version the canonical draft consumed by the site builder.
  update public.site_projects
  set template_version_id = v_version.template_version_id,
      generated_content = v_version.generated_content,
      design_overrides = v_version.design_overrides,
      updated_at = now()
  where id = v_link.site_project_id;

  insert into public.prospect_events (
    prospect_id, site_project_id, event_type, source_provider, idempotency_key, evidence
  )
  select p.prospect_id, p.id, 'template_selected', 'public-demo',
    'demo-link:' || v_link.id::text || ':selected:' || p_version_id::text,
    jsonb_build_object('linkId', v_link.id, 'versionId', p_version_id)
  from public.site_projects p
  where p.id = v_link.site_project_id and p.prospect_id is not null
  on conflict (idempotency_key) do nothing;

  return jsonb_build_object(
    'status', 'selected',
    'siteProjectId', v_link.site_project_id,
    'selectedVersionId', p_version_id,
    'selectedAt', now()
  );
end;
$$;

revoke all on function public.select_public_demo_version(text, uuid) from public, anon, authenticated;
grant execute on function public.select_public_demo_version(text, uuid) to service_role;

commit;
