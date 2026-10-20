-- Subscription access periods and booking horizons.
-- Existing historical migrations are immutable; this additive migration evolves billing safely.
alter table public.establishments
  add column if not exists billing_expires_at timestamptz,
  add column if not exists booking_horizon_days integer not null default 60
    check (booking_horizon_days between 1 and 365);
alter table public.billing_plans
  add column if not exists max_booking_horizon_days integer not null default 60
    check (max_booking_horizon_days between 1 and 365);
comment on column public.establishments.billing_expires_at is
  'End of paid access period. Null means no expiry has been recorded; access enforcement must evaluate this timestamp server-side.';
comment on column public.establishments.booking_horizon_days is
  'Maximum number of days into the future the tenant may schedule, enforced by trusted server-side booking operations.';
comment on column public.billing_plans.max_booking_horizon_days is
  'Maximum future booking horizon granted by this plan. Recommended: 60 days monthly, 365 days yearly.';
create or replace function private.apply_venopag_paid_payment(
  p_request_number text, p_amount_brl_cents integer, p_transaction_id text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare payment_row record; new_expiry timestamptz;
begin
  select bp.id, bp.establishment_id, bp.amount_brl_cents, bp.status,
         plan.access_days, plan.max_booking_horizon_days
    into payment_row
  from public.billing_payments bp
  join public.billing_plans plan on plan.id = bp.plan_id
  where bp.provider_request_number = p_request_number
  for update of bp;
  if not found then raise exception 'Cobrança não encontrada'; end if;
  if payment_row.amount_brl_cents <> p_amount_brl_cents then
    raise exception 'Valor confirmado divergente da cobrança';
  end if;
  if payment_row.status = 'paid' then
    return jsonb_build_object('received', true, 'already_applied', true);
  end if;
  update public.billing_payments
  set status = 'paid', provider_transaction_id = p_transaction_id,
      paid_at = now(),
      provider_payload = jsonb_build_object('source','venopag_webhook',
        'request_number',p_request_number,'transaction_id',p_transaction_id),
      updated_at = now()
  where id = payment_row.id;
  update public.establishments
  set billing_expires_at = greatest(coalesce(billing_expires_at, now()), now())
        + make_interval(days => payment_row.access_days),
      booking_horizon_days = payment_row.max_booking_horizon_days,
      billing_status = 'active', status = 'active', updated_at = now()
  where id = payment_row.establishment_id
  returning billing_expires_at into new_expiry;
  return jsonb_build_object('received',true,'already_applied',false,'billing_expires_at',new_expiry);
end;
$$;
revoke all on function private.apply_venopag_paid_payment(text, integer, text)
  from public, anon, authenticated;
grant execute on function private.apply_venopag_paid_payment(text, integer, text) to service_role;
