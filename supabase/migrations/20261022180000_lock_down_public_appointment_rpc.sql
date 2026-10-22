-- Security hotfix: public booking is currently a front-end demonstration.
-- Do not expose a SECURITY DEFINER RPC that accepts client-controlled service prices
-- or service metadata until a trusted server-side service catalog is implemented.
revoke all on function public.create_public_establishment_appointment(
  text, text, text, text, text, numeric, integer, date, time, text
) from public, anon, authenticated;

comment on function public.create_public_establishment_appointment(
  text, text, text, text, text, numeric, integer, date, time, text
) is
  'Restricted to trusted server-side service_role calls. Do not grant to anon/authenticated until service identity, price, duration, availability, and rate limits are validated server-side.';
