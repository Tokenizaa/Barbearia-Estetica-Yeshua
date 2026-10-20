-- Server-enforced, tenant-scoped public appointment creation.
create table if not exists public.establishment_appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete restrict,
  client_name text not null check (char_length(trim(client_name)) between 2 and 120),
  client_phone text not null check (char_length(trim(client_phone)) between 8 and 32),
  service_id text not null,
  service_name text not null check (char_length(trim(service_name)) between 1 and 160),
  service_price numeric(12,2),
  service_duration_minutes integer,
  appointment_date date not null,
  appointment_time time not null,
  notes text,
  status text not null default 'pendente' check (status in ('pendente','confirmado','cancelado','concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint establishment_appointments_notes_length check (notes is null or char_length(notes) <= 1000),
  constraint establishment_appointments_duration check (service_duration_minutes is null or service_duration_minutes between 1 and 1440),
  constraint establishment_appointments_price check (service_price is null or service_price >= 0)
);
create index if not exists establishment_appointments_tenant_date_idx
  on public.establishment_appointments(establishment_id, appointment_date, appointment_time);
create index if not exists establishment_appointments_tenant_created_idx
  on public.establishment_appointments(establishment_id, created_at desc);
create unique index if not exists establishment_appointments_no_duplicate_active_slot
  on public.establishment_appointments(establishment_id, appointment_date, appointment_time)
  where status in ('pendente','confirmado');
alter table public.establishment_appointments enable row level security;
revoke all on public.establishment_appointments from anon, authenticated;
comment on table public.establishment_appointments is 'Tenant-scoped appointments; direct client table access is denied.';

create or replace function public.create_public_establishment_appointment(
  p_establishment_slug text, p_client_name text, p_client_phone text,
  p_service_id text, p_service_name text, p_service_price numeric,
  p_service_duration_minutes integer, p_appointment_date date,
  p_appointment_time time, p_notes text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare tenant record; created_row public.establishment_appointments%rowtype; days_ahead integer;
begin
  if p_establishment_slug is null or p_establishment_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'Estabelecimento inválido';
  end if;
  if char_length(trim(coalesce(p_client_name,''))) not between 2 and 120
     or char_length(trim(coalesce(p_client_phone,''))) not between 8 and 32
     or char_length(trim(coalesce(p_service_id,''))) not between 1 and 120
     or char_length(trim(coalesce(p_service_name,''))) not between 1 and 160
     or (p_notes is not null and char_length(p_notes) > 1000)
     or (p_service_price is not null and p_service_price < 0)
     or (p_service_duration_minutes is not null and p_service_duration_minutes not between 1 and 1440) then
    raise exception using errcode = '22023', message = 'Dados do agendamento inválidos';
  end if;
  if p_appointment_date is null or p_appointment_time is null or p_appointment_date < current_date then
    raise exception using errcode = '22023', message = 'Data ou horário inválido';
  end if;
  select e.id, e.slug, e.status, e.billing_status, e.billing_expires_at, e.booking_horizon_days
    into tenant from public.establishments e where e.slug = p_establishment_slug limit 1;
  if not found then raise exception using errcode = 'P0002', message = 'Estabelecimento não encontrado'; end if;
  if tenant.status <> 'active' then
    raise exception using errcode = '42501', message = 'Estabelecimento indisponível';
  end if;
  -- Preserve existing Yeshua bookings during migration; every new tenant requires paid active access.
  if tenant.slug <> 'yeshua' and
     (tenant.billing_status <> 'active' or tenant.billing_expires_at is null or tenant.billing_expires_at <= now()) then
    raise exception using errcode = '42501', message = 'Assinatura inativa ou vencida';
  end if;
  if tenant.slug = 'yeshua' and tenant.billing_status not in ('active','pending') then
    raise exception using errcode = '42501', message = 'Estabelecimento indisponível';
  end if;
  days_ahead := p_appointment_date - current_date;
  if days_ahead > least(greatest(coalesce(tenant.booking_horizon_days,60),1),365) then
    raise exception using errcode = '22023', message = format('Este plano permite agendamentos com até %s dias de antecedência', tenant.booking_horizon_days);
  end if;
  insert into public.establishment_appointments (
    establishment_id, client_name, client_phone, service_id, service_name,
    service_price, service_duration_minutes, appointment_date, appointment_time, notes
  ) values (
    tenant.id, trim(p_client_name), trim(p_client_phone), trim(p_service_id), trim(p_service_name),
    p_service_price, p_service_duration_minutes, p_appointment_date, p_appointment_time, nullif(trim(coalesce(p_notes,'')),'')
  ) returning * into created_row;
  return jsonb_build_object(
    'id',created_row.id,'establishment_id',created_row.establishment_id,
    'client_name',created_row.client_name,'client_phone',created_row.client_phone,
    'service_id',created_row.service_id,'service_name',created_row.service_name,
    'service_price',created_row.service_price,'service_duration_minutes',created_row.service_duration_minutes,
    'date',created_row.appointment_date,'time',to_char(created_row.appointment_time,'HH24:MI'),
    'notes',created_row.notes,'status',created_row.status,'created_at',created_row.created_at
  );
exception when unique_violation then
  raise exception using errcode = '23505', message = 'Este horário já foi solicitado. Escolha outro horário.';
end;
$$;
revoke all on function public.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text)
  from public, anon, authenticated;
grant execute on function public.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text)
  to anon, authenticated;
