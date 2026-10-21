-- Tune indexes for prospecting joins and avoid redundant permissive campaign policies.
begin;

drop policy if exists prospecting_campaigns_platform_admin_read on public.prospecting_campaigns;

create index if not exists prospecting_campaigns_created_by_idx
  on public.prospecting_campaigns (created_by)
  where created_by is not null;

create index if not exists prospecting_tasks_campaign_idx
  on public.prospecting_tasks (campaign_id)
  where campaign_id is not null;
create index if not exists prospecting_tasks_prospect_idx
  on public.prospecting_tasks (prospect_id)
  where prospect_id is not null;

create index if not exists prospect_events_campaign_idx
  on public.prospect_events (campaign_id)
  where campaign_id is not null;
create index if not exists prospect_events_site_project_idx
  on public.prospect_events (site_project_id)
  where site_project_id is not null;

create index if not exists prospect_outbound_messages_campaign_idx
  on public.prospect_outbound_messages (campaign_id)
  where campaign_id is not null;
create index if not exists prospect_outbound_messages_site_project_idx
  on public.prospect_outbound_messages (site_project_id)
  where site_project_id is not null;

create index if not exists site_project_versions_template_version_idx
  on public.site_project_versions (template_version_id);

create index if not exists prospects_captured_by_idx
  on public.prospects (captured_by)
  where captured_by is not null;
create index if not exists prospects_converted_establishment_idx
  on public.prospects (converted_establishment_id)
  where converted_establishment_id is not null;

commit;
