-- Link prospects to a single generated site project and create it idempotently.
begin;

alter table public.site_projects
  add column if not exists prospect_id uuid references public.prospects(id) on delete set null;

alter table public.site_demo_public_links
  add column if not exists publish_task_id bigint references public.prospecting_tasks(id) on delete set null;

create unique index if not exists site_demo_public_links_publish_task_unique
  on public.site_demo_public_links (publish_task_id);

create or replace function public.ensure_prospect_site_project(p_prospect_id uuid, p_template_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prospect public.prospects%rowtype;
  v_project_id uuid;
  v_name text;
  v_slug text;
  v_data jsonb;
  v_columns text;
begin
  if p_prospect_id is null then raise exception 'prospect_id_required'; end if;
  perform pg_advisory_xact_lock(hashtext(p_prospect_id::text));
  if p_template_version_id is null or not exists (select 1 from public.site_template_versions where id = p_template_version_id and is_published) then
    raise exception 'published_template_version_required';
  end if;

  select * into v_prospect from public.prospects where id = p_prospect_id;
  if not found then raise exception 'prospect_not_found'; end if;

  select id into v_project_id
  from public.site_projects
  where prospect_id = p_prospect_id
  order by created_at desc
  limit 1;

  if v_project_id is not null then
    return jsonb_build_object('siteProjectId', v_project_id, 'created', false);
  end if;

  v_name := coalesce(
    nullif(to_jsonb(v_prospect)->>'business_name', ''),
    nullif(to_jsonb(v_prospect)->>'name', ''),
    nullif(to_jsonb(v_prospect)->>'company_name', ''),
    'Novo projeto comercial'
  );
  v_slug := trim(both '-' from regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'));
  v_slug := left(coalesce(nullif(v_slug, ''), 'site'), 48) || '-' || left(replace(p_prospect_id::text, '-', ''), 8);

  v_data := jsonb_build_object(
    'prospect_id', p_prospect_id,
    'template_version_id', p_template_version_id,
    'name', v_name,
    'title', v_name,
    'business_name', v_name,
    'project_name', v_name,
    'slug', v_slug,
    'description', coalesce(to_jsonb(v_prospect)->>'description', to_jsonb(v_prospect)->>'business_description')
  );

  select string_agg(format('%I', c.column_name), ', ' order by c.ordinal_position)
  into v_columns
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'site_projects'
    and c.column_name = any(array[
      'prospect_id','template_version_id','name','title','business_name','project_name','slug','description'
    ]);

  if v_columns is null then raise exception 'site_projects_schema_not_compatible'; end if;

  execute format(
    'insert into public.site_projects (%1$s) select %1$s from jsonb_populate_record(null::public.site_projects, $1) returning id',
    v_columns
  ) into v_project_id using v_data;

  if v_project_id is null then
    select id into v_project_id from public.site_projects where prospect_id = p_prospect_id limit 1;
  end if;

  if v_project_id is null then raise exception 'site_project_creation_failed_check_required_columns_and_constraints'; end if;

  return jsonb_build_object('siteProjectId', v_project_id, 'created', true);
end;
$$;

revoke all on function public.ensure_prospect_site_project(uuid, uuid) from public, anon, authenticated;
grant execute on function public.ensure_prospect_site_project(uuid, uuid) to service_role;

commit;
