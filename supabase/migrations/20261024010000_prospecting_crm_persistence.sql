begin;

create table if not exists public.prospecting_crm_state (
  candidate_id uuid primary key references public.prospecting_candidates(id) on delete cascade,
  stage text not null default 'novo'
    check (stage in ('novo','contatado','respondeu','reuniao','fechado')),
  selected_template text not null default 'ouro-classico',
  notes text[] not null default '{}',
  follow_up_date date,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prospecting_crm_state enable row level security;
revoke all on public.prospecting_crm_state from anon;
grant select, insert, update on public.prospecting_crm_state to authenticated;

drop policy if exists prospecting_crm_state_admin_all on public.prospecting_crm_state;
create policy prospecting_crm_state_admin_all
  on public.prospecting_crm_state
  for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

commit;