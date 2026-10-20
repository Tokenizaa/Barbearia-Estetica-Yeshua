-- One-time bootstrap for the first general platform administrator.
-- The raw activation code is intentionally NOT stored in this repository or database.
create table if not exists private.platform_admin_bootstrap_codes (
  code_hash text primary key check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

revoke all on table private.platform_admin_bootstrap_codes from public, anon, authenticated;

insert into private.platform_admin_bootstrap_codes (code_hash, expires_at)
values ('950addd39edce9fc23ac7564ae40691655a518c47a1cb48f0a8e4c1f2541e755', now() + interval '14 days')
on conflict (code_hash) do nothing;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = (select auth.uid())
  );
$$;

create or replace function private.claim_first_platform_admin(p_user_id uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_hash text;
begin
  if p_user_id is null or coalesce(trim(p_code), '') = '' then
    raise exception 'Código de ativação inválido';
  end if;

  if exists (select 1 from public.platform_admins) then
    raise exception 'A ativação do primeiro administrador já foi utilizada';
  end if;

  matched_hash := encode(extensions.digest(convert_to(trim(p_code), 'UTF8'), 'sha256'), 'hex');

  perform 1
  from private.platform_admin_bootstrap_codes c
  where c.code_hash = matched_hash
    and c.used_at is null
    and c.expires_at > now()
  for update;

  if not found then
    raise exception 'Código de ativação inválido, expirado ou já utilizado';
  end if;

  -- Lock the single-use token and recheck after obtaining the lock to prevent concurrent claims.
  if exists (select 1 from public.platform_admins) then
    raise exception 'A ativação do primeiro administrador já foi utilizada';
  end if;

  insert into public.platform_admins (user_id, created_by)
  values (p_user_id, null);

  update private.platform_admin_bootstrap_codes
  set used_at = now(), used_by = p_user_id
  where code_hash = matched_hash and used_at is null;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('platform_role', 'platform_admin'),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'platform_admin_bootstrap_code'
  where id = p_user_id;
end;
$$;

revoke all on function private.claim_first_platform_admin(uuid, text) from public, anon, authenticated;

create or replace function private.provision_platform_admin_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'signup_type', '') <> 'platform_admin' then
    return new;
  end if;

  perform private.claim_first_platform_admin(
    new.id,
    coalesce(new.raw_user_meta_data ->> 'platform_admin_bootstrap_code', '')
  );

  return new;
end;
$$;

revoke all on function private.provision_platform_admin_bootstrap() from public, anon, authenticated;
drop trigger if exists provision_platform_admin_bootstrap_after_signup on auth.users;
create trigger provision_platform_admin_bootstrap_after_signup
  after insert on auth.users
  for each row execute function private.provision_platform_admin_bootstrap();

comment on table private.platform_admin_bootstrap_codes is
  'Hash-only, expiring, single-use code for bootstrapping the first general platform administrator.';
