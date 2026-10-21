-- Store explicit WhatsApp consent and provider delivery evidence separately from public contact data.
begin;

alter table public.prospects
  add column if not exists whatsapp_opt_in_at timestamptz,
  add column if not exists whatsapp_opt_in_evidence_url text,
  add column if not exists whatsapp_opted_out_at timestamptz,
  add column if not exists whatsapp_opt_in_source text,
  add column if not exists whatsapp_consent_updated_at timestamptz;

create index if not exists prospects_whatsapp_eligibility_idx
  on public.prospects (outreach_eligibility, whatsapp_opt_in_at)
  where whatsapp_opt_in_at is not null and whatsapp_opted_out_at is null;

commit;
