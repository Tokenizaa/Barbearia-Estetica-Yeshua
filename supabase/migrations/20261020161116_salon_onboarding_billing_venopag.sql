-- Self-service salon onboarding and VenoPag PIX billing.
-- VenoPag currently exposes PIX cash-in/status/webhook in the SDK; this does not implement recurring automatic charges.

alter table public.establishments
  add column if not exists billing_status text not null default 'pending'
    check (billing_status in ('pending','active','past_due','canceled'));

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  price_brl_cents integer not null check (price_brl_cents > 0),
  billing_period text not null default 'one_time' check (billing_period in ('one_time','monthly','yearly')),
  access_days integer not null default 30 check (access_days > 0),
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_payments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  provider text not null default 'venopag' check (provider = 'venopag'),
  provider_request_number text unique,
  provider_transaction_id text,
  amount_brl_cents integer not null check (amount_brl_cents > 0),
  status text not null default 'pending' check (status in ('pending','paid','expired','canceled','failed')),
  checkout_url text,
  qr_url text,
  pix_copy_paste text,
  expires_at timestamptz,
  paid_at timestamptz,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_payments_establishment_created_idx
  on public.billing_payments(establishment_id, created_at desc);
create index if not exists billing_payments_status_created_idx
  on public.billing_payments(status, created_at desc);

alter table public.billing_plans enable row level security;
alter table public.billing_payments enable row level security;

drop policy if exists billing_plans_read_active on public.billing_plans;
drop policy if exists billing_plans_read_active_anon on public.billing_plans;
drop policy if exists billing_plans_read_active_authenticated on public.billing_plans;
create policy billing_plans_read_active_anon
  on public.billing_plans for select to anon
  using (is_active);
create policy billing_plans_read_active_authenticated
  on public.billing_plans for select to authenticated
  using (is_active or (select private.is_platform_admin()));

drop policy if exists billing_plans_manage_platform_admin on public.billing_plans;
create policy billing_plans_manage_platform_admin
  on public.billing_plans for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

drop policy if exists billing_payments_read_own_establishment on public.billing_payments;
create policy billing_payments_read_own_establishment
  on public.billing_payments for select to authenticated
  using (
    (select private.is_platform_admin())
    or (select private.has_establishment_role(establishment_id, null))
  );

drop policy if exists billing_payments_manage_platform_admin on public.billing_payments;
create policy billing_payments_manage_platform_admin
  on public.billing_payments for all to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

-- Creates a draft tenant when a user signs up with signup_type=salon_owner.
-- The owner membership is created atomically in the auth.users transaction, before email confirmation.
create or replace function private.provision_salon_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
  requested_slug text;
  safe_slug text;
  new_establishment_id uuid;
begin
  if coalesce(new.raw_user_meta_data ->> 'signup_type', '') <> 'salon_owner' then
    return new;
  end if;

  requested_name := left(trim(coalesce(new.raw_user_meta_data ->> 'establishment_name', '')), 120);
  if requested_name = '' then
    raise exception 'Nome do salão é obrigatório';
  end if;

  requested_slug := lower(coalesce(new.raw_user_meta_data ->> 'establishment_slug', ''));
  safe_slug := trim(both '-' from regexp_replace(requested_slug, '[^a-z0-9-]+', '-', 'g'));
  safe_slug := trim(both '-' from regexp_replace(safe_slug, '-+', '-', 'g'));
  if safe_slug = '' then
    safe_slug := trim(both '-' from regexp_replace(lower(requested_name), '[^a-z0-9]+', '-', 'g'));
  end if;
  safe_slug := left(safe_slug, 45);
  if safe_slug = '' then
    safe_slug := 'salao';
  end if;

  if exists (select 1 from public.establishments e where e.slug = safe_slug) then
    safe_slug := left(safe_slug, 34) || '-' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.establishments (slug, name, status, billing_status, contact)
  values (
    safe_slug,
    requested_name,
    'draft',
    'pending',
    jsonb_build_object('owner_name', left(trim(coalesce(new.raw_user_meta_data ->> 'owner_name', '')), 120),
                       'owner_email', lower(new.email))
  )
  returning id into new_establishment_id;

  insert into public.establishment_memberships (establishment_id, user_id, role, created_by)
  values (new_establishment_id, new.id, 'owner', new.id);

  insert into public.audit_events (actor_user_id, establishment_id, action, details)
  values (new.id, new_establishment_id, 'salon_signup_created',
          jsonb_build_object('source', 'supabase_auth_trigger'));

  return new;
end;
$$;

revoke all on function private.provision_salon_owner() from public, anon, authenticated;
drop trigger if exists provision_salon_owner_after_signup on auth.users;
create trigger provision_salon_owner_after_signup
  after insert on auth.users
  for each row execute function private.provision_salon_owner();

comment on table public.billing_plans is 'Publicly selectable service plans; activate and price plans through trusted platform administration.';
comment on table public.billing_payments is 'Server-created VenoPag PIX payment records; clients cannot insert or change payment status.';
