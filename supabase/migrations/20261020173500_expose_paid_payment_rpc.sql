-- Expose a service-role-only RPC wrapper in PostgREST's public schema.
create or replace function public.apply_venopag_paid_payment(
  p_request_number text,
  p_amount_brl_cents integer,
  p_transaction_id text default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.apply_venopag_paid_payment(
    p_request_number,
    p_amount_brl_cents,
    p_transaction_id
  );
$$;
revoke all on function public.apply_venopag_paid_payment(text, integer, text)
  from public, anon, authenticated;
grant execute on function public.apply_venopag_paid_payment(text, integer, text)
  to service_role;