-- Durable provider discovery records, kept separate until a prospect can be safely reconciled.
begin;

create table if not exists public.prospecting_candidates (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.prospecting_campaigns(id) on delete cascade,
  provider text not null,
  provider_record_id text,
  dedupe_key text not null unique,
  business_name text not null,
  category text,
  website_url text,
  normalized_website text,
  phone text,
  normalized_phone text,
  email text,
  address text,
  city text,
  region text,
  country_code text not null default 'BR',
  description text,
  source_url text,
  source_captured_at timestamptz not null default now(),
  qualification_score integer,
  qualification_reasons jsonb not null default '[]'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  status text not null default 'discovered'
    check (status in ('discovered','qualified','disqualified','promoted','duplicate','blocked')),
  prospect_id uuid references public.prospects(id) on delete set null,
  raw_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, provider, provider_record_id)
);

create index if not exists prospecting_candidates_campaign_idx
  on public.prospecting_candidates (campaign_id, created_at desc);
create index if not exists prospecting_candidates_status_idx
  on public.prospecting_candidates (status, qualification_score desc);
create index if not exists prospecting_candidates_phone_idx
  on public.prospecting_candidates (normalized_phone)
  where normalized_phone is not null;

alter table public.prospecting_candidates enable row level security;
revoke all on public.prospecting_candidates from anon, authenticated;
grant select on public.prospecting_candidates to authenticated;
drop policy if exists prospecting_candidates_platform_admin_read on public.prospecting_candidates;
create policy prospecting_candidates_platform_admin_read
  on public.prospecting_candidates for select to authenticated
  using ((select private.is_platform_admin()));

commit;
