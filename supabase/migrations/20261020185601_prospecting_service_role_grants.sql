-- Explicit server-worker privileges for projects with restricted default grants.
begin;

grant select, insert, update on table public.prospects to service_role;
grant select, insert, update, delete on table public.prospecting_campaigns to service_role;
grant select, insert, update, delete on table public.prospecting_tasks to service_role;
grant select, insert on table public.prospect_events to service_role;
grant select, insert, update on table public.prospect_outbound_messages to service_role;
grant select, insert, update, delete on table public.site_projects to service_role;
grant select on table public.site_templates, public.site_template_versions to service_role;
grant select, insert on table public.site_project_versions to service_role;

grant usage, select on sequence
  public.prospecting_tasks_id_seq,
  public.prospect_events_id_seq
to service_role;

-- The queue is inaccessible to browser roles and writable only by trusted workers.
create policy prospecting_tasks_service_role_only
  on public.prospecting_tasks
  for all
  to service_role
  using (true)
  with check (true);

commit;
