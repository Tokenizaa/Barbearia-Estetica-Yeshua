-- Ensure abandoned tasks at the attempt limit cannot remain stuck in processing forever.
begin;

create or replace function public.claim_prospecting_tasks(
  p_worker_id text,
  p_limit integer default 10
)
returns setof public.prospecting_tasks
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker_id is null or length(trim(p_worker_id)) = 0 then
    raise exception 'worker_id_required';
  end if;

  update public.prospecting_tasks as t
  set status = 'dead_letter',
      last_error_code = 'attempts_exhausted_after_worker_crash',
      last_error = 'Worker perdeu o lease e o limite de tentativas foi atingido.',
      completed_at = now(),
      locked_at = null,
      locked_by = null,
      updated_at = now()
  where t.status = 'processing'
    and t.locked_at < now() - interval '5 minutes'
    and t.attempt_count >= t.max_attempts;

  return query
  with candidates as (
    select t.id
    from public.prospecting_tasks as t
    where (
      (t.status in ('pending','retryable') and t.available_at <= now())
      or (t.status = 'processing' and t.locked_at < now() - interval '5 minutes')
    )
      and t.attempt_count < t.max_attempts
    order by t.available_at asc, t.id asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 10), 50))
  )
  update public.prospecting_tasks as t
  set status = 'processing',
      attempt_count = t.attempt_count + 1,
      locked_at = now(),
      locked_by = left(trim(p_worker_id), 100),
      updated_at = now()
  from candidates
  where t.id = candidates.id
  returning t.*;
end;
$$;

revoke all on function public.claim_prospecting_tasks(text, integer) from public, anon, authenticated;
grant execute on function public.claim_prospecting_tasks(text, integer) to service_role;

commit;
