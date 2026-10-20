-- Keep the exposed PostgREST wrapper invoker-only; implementation lives in the non-exposed private schema.
alter function public.create_public_establishment_appointment(
  text,text,text,text,text,numeric,integer,date,time,text
) set schema private;

grant execute on function private.create_public_establishment_appointment(
  text,text,text,text,text,numeric,integer,date,time,text
) to anon, authenticated;

create or replace function public.create_public_establishment_appointment(
  p_establishment_slug text, p_client_name text, p_client_phone text,
  p_service_id text, p_service_name text, p_service_price numeric,
  p_service_duration_minutes integer, p_appointment_date date,
  p_appointment_time time, p_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_public_establishment_appointment(
    p_establishment_slug, p_client_name, p_client_phone,
    p_service_id, p_service_name, p_service_price,
    p_service_duration_minutes, p_appointment_date,
    p_appointment_time, p_notes
  );
$$;
revoke all on function public.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text)
  from public;
grant execute on function public.create_public_establishment_appointment(text,text,text,text,text,numeric,integer,date,time,text)
  to anon, authenticated;

drop policy if exists establishment_appointments_deny_client_access on public.establishment_appointments;
create policy establishment_appointments_deny_client_access
  on public.establishment_appointments
  for all to anon, authenticated
  using (false)
  with check (false);
