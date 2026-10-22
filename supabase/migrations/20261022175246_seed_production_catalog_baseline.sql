-- Idempotent production baseline for the site-template and billing catalogs.
-- Keep this aligned with the live schema; the previous seed file referenced
-- columns that do not exist in the current schema (display_order/changelog).
begin;

insert into public.site_templates (slug,name,category,description,is_active)
values
('minimal','Minimal Studio','Estética Minimalista','Design limpo com foco em fotografia editorial e agendamentos diretos.',true),
('bold','Bold Barber Club','Barbearia Urbana','Visual marcante e tipografia expressiva voltada para barbearias contemporâneas.',true),
('editorial','Editorial Hair & Care','Salão & Estética','Apresentação refinada para salões com múltiplos serviços e portfólio visual.',true)
on conflict (slug) do update set
  name=excluded.name, category=excluded.category,
  description=excluded.description, is_active=excluded.is_active;

insert into public.site_template_versions (template_id,version,is_published,config,created_at)
select t.id,1,true,
jsonb_build_object(
  'layout','responsive_single_page',
  'sections',jsonb_build_array('hero','services','appointment_cta','gallery','products','contact'),
  'theme',jsonb_build_object('primary','#d97706','secondary','#171717','surface','#0a0a0a','text','#f5f5f5')
),now()
from public.site_templates t
where t.slug='modelo-inicial'
on conflict (template_id,version) do update set
  is_published=excluded.is_published, config=excluded.config;

insert into public.billing_plans
  (slug,name,description,price_brl_cents,billing_period,access_days,max_booking_horizon_days,is_active,display_order)
values
('mensal','Plano Mensal Pro','Site exclusivo publicado, painel de agendamento online e até 60 dias de horizonte futuro na agenda.',9700,'monthly',30,60,true,1),
('anual','Plano Anual Premium (2 meses grátis)','Site exclusivo publicado, painel completo, suporte prioritário e até 365 dias de horizonte na agenda.',99700,'yearly',365,365,true,2)
on conflict (slug) do update set
  name=excluded.name, description=excluded.description,
  price_brl_cents=excluded.price_brl_cents, billing_period=excluded.billing_period,
  access_days=excluded.access_days, max_booking_horizon_days=excluded.max_booking_horizon_days,
  is_active=excluded.is_active, display_order=excluded.display_order;

commit;
