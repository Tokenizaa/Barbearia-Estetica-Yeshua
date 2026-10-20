-- The function is attached to the ensure_rls DDL event trigger; it is not an RPC.
-- Restrict direct EXECUTE grants while preserving the event trigger itself.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
