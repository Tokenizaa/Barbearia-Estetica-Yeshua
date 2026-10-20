-- Fase 1: infraestrutura persistente para prospecção autônoma.
-- Esta migration prepara o modelo de dados; não configura fornecedores nem executa jobs sozinha.
-- Execução de jobs e escrita operacional devem usar credencial server-side confiável.

begin;

alter table public.prospects
  add column if not exists dedupe_key text,
  add column if not exists normalized_website text,
  add column if not exists normalized_phone text,
  add column if not exists qualification_score integer,
  add column if not exists qualification_reasons jsonb not null default '[]'::jsonb,
  add column if not exists source_captured_at timestamptz,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists outreach_eligibility text not null default 'unknown'
    check (outreach_eligibility in ('unknown','eligible','ineligible','opted_out','blocked'));

create unique index if not exists prospects_dedupe_key_uidx
  on public.prospects (dedupe_key)
  where dedupe_key is not null;

create index if not exists prospects_normalized_phone_idx
  on public.prospects (normalized_phone)
  where normalized_phone is not null;

create index if not exists prospects_normalized_website_idx
  on public.prospects (normalized_website)
  where normalized_website is not null;

-- Campaign parameters are configured once; execution is asynchronous and independent of a browser.
create table if not exists public.prospecting_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'paused'
    check (status in ('draft','active','paused','blocked','completed','archived')),
  segment text not null,
  region text not null,
  country_code text not null default 'BR',
  source_provider text,
  source_config jsonb not null default '{}'::jsonb,
  qualification_rules jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  daily_discovery_limit integer not null default 100 check (daily_discovery_limit between 1 and 10000),
  last_run_at timestamptz,
  next_run_at timestamptz,
  blocked_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospecting_campaigns_due_idx
  on public.prospecting_campaigns (next_run_at)
  where status = 'active';

-- Durable queue with idempotency and retry scheduling. Workers must claim rows atomically.
create table if not exists public.prospecting_tasks (
  id bigint generated always as identity primary key,
  campaign_id uuid references public.prospecting_campaigns(id) on delete set null,
  prospect_id uuid references public.prospects(id) on delete set null,
  task_type text not null check (task_type in (
    'discover','capture','qualify','generate_demo','publish_demo','send_whatsapp','sync_delivery'
  )),
  status text not null default 'pending'
    check (status in ('pending','processing','succeeded','retryable','blocked','dead_letter','cancelled')),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error_code text,
  last_error text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists prospecting_tasks_ready_idx
  on public.prospecting_tasks (available_at, id)
  where status in ('pending','retryable');

create index if not exists prospecting_tasks_stale_lock_idx
  on public.prospecting_tasks (locked_at)
  where status = 'processing';

-- Append-only funnel events; delivery states must be based on provider evidence.
create table if not exists public.prospect_events (
  id bigint generated always as identity primary key,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  campaign_id uuid references public.prospecting_campaigns(id) on delete set null,
  site_project_id uuid references public.site_projects(id) on delete set null,
  event_type text not null check (event_type in (
    'discovered','captured','deduplicated','qualified','disqualified',
    'demo_generated','demo_published','template_selected',
    'message_queued','message_attempted','message_sent','message_delivered',
    'message_failed','message_replied','opted_out','blocked','converted'
  )),
  source_provider text,
  provider_event_id text,
  idempotency_key text,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists prospect_events_provider_event_uidx
  on public.prospect_events (source_provider, provider_event_id)
  where source_provider is not null and provider_event_id is not null;

create unique index if not exists prospect_events_idempotency_uidx
  on public.prospect_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists prospect_events_prospect_timeline_idx
  on public.prospect_events (prospect_id, occurred_at desc);

-- Outbound messages record provider-confirmed states; a queued row is not a sent message.
create table if not exists public.prospect_outbound_messages (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  campaign_id uuid references public.prospecting_campaigns(id) on delete set null,
  site_project_id uuid references public.site_projects(id) on delete set null,
  channel text not null default 'whatsapp'
    check (channel in ('whatsapp')),
  provider text,
  provider_message_id text,
  destination_hash text,
  template_name text,
  template_variables jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('blocked','queued','attempting','sent','delivered','read','failed','replied','opted_out')),
  idempotency_key text not null unique,
  attempts integer not null default 0 check (attempts >= 0),
  last_error_code text,
  last_error text,
  queued_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  opted_out_at timestamptz,
  provider_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_message_id)
);

create index if not exists prospect_outbound_messages_prospect_idx
  on public.prospect_outbound_messages (prospect_id, created_at desc);

-- Preserve each demo version and the model choice made by the prospect.
create table if not exists public.site_project_versions (
  id uuid primary key default gen_random_uuid(),
  site_project_id uuid not null references public.site_projects(id) on delete cascade,
  version integer not null check (version > 0),
  template_version_id uuid not null references public.site_template_versions(id) on delete restrict,
  generated_content jsonb not null default '{}'::jsonb,
  design_overrides jsonb not null default '{}'::jsonb,
  selected_by_prospect boolean not null default false,
  selection_source text not null default 'system'
    check (selection_source in ('system','public_landing','admin')),
  created_at timestamptz not null default now(),
  unique (site_project_id, version)
);

create index if not exists site_project_versions_project_idx
  on public.site_project_versions (site_project_id, version desc);

-- Keep automation tables inaccessible to anonymous and regular authenticated clients.
alter table public.prospecting_campaigns enable row level security;
alter table public.prospecting_tasks enable row level security;
alter table public.prospect_events enable row level security;
alter table public.prospect_outbound_messages enable row level security;
alter table public.site_project_versions enable row level security;

revoke all on table
  public.prospecting_campaigns,
  public.prospecting_tasks,
  public.prospect_events,
  public.prospect_outbound_messages,
  public.site_project_versions
from anon, authenticated;

grant select, insert, update, delete on table public.prospecting_campaigns to authenticated;
create policy prospecting_campaigns_platform_admin_read
  on public.prospecting_campaigns for select to authenticated
  using ((select private.is_platform_admin()));
create policy prospecting_campaigns_platform_admin_write
  on public.prospecting_campaigns for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

grant select on table
  public.prospect_events,
  public.prospect_outbound_messages,
  public.site_project_versions
to authenticated;

create policy prospect_events_platform_admin_read
  on public.prospect_events for select to authenticated
  using ((select private.is_platform_admin()));
create policy prospect_outbound_messages_platform_admin_read
  on public.prospect_outbound_messages for select to authenticated
  using ((select private.is_platform_admin()));
create policy site_project_versions_platform_admin_read
  on public.site_project_versions for select to authenticated
  using ((select private.is_platform_admin()));

-- Service-role workers bypass RLS. Do not grant queue writes to browser roles.
revoke all on table public.prospecting_tasks from anon, authenticated;
grant usage, select on sequence
  public.prospecting_tasks_id_seq,
  public.prospect_events_id_seq
to service_role;

commit;
