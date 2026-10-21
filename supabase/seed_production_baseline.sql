-- =========================================================================
-- SEED DE PRODUÇÃO E HOMOLOGAÇÃO — BASELINE DA PLATAFORMA
-- =========================================================================
-- Este script provisiona:
-- 1. Catálogo oficial de modelos de sites (site_templates)
-- 2. Versão publicada inicial com configuração visual ativa (site_template_versions)
-- 3. Planos comerciais de assinatura e limites operacionais (billing_plans)
--
-- Pode ser executado repetidamente com segurança (idempotente com ON CONFLICT).
-- =========================================================================

begin;

-- -------------------------------------------------------------------------
-- 1. Catálogo de Modelos de Sites (site_templates)
-- -------------------------------------------------------------------------
insert into public.site_templates (id, slug, name, category, description, is_active, display_order)
values
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'modelo-inicial',
    'Salão Modelo Elegance',
    'Beleza & Estética',
    'Layout moderno e sofisticado para barbearias, salões de beleza e spas premium.',
    true,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'minimal',
    'Minimal Studio',
    'Estética Minimalista',
    'Design limpo com foco em fotografia editorial e agendamentos diretos.',
    true,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'bold',
    'Bold Barber Club',
    'Barbearia Urbana',
    'Visual marcante e tipografia expressiva voltada para barbearias contemporâneas.',
    true,
    3
  ),
  (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'editorial',
    'Editorial Hair & Care',
    'Salão & Estética',
    'Apresentação refinada para salões com múltiplos serviços e portfólio visual.',
    true,
    4
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  is_active = excluded.is_active,
  display_order = excluded.display_order;

-- -------------------------------------------------------------------------
-- 2. Versão Publicada do Modelo (site_template_versions)
-- -------------------------------------------------------------------------
-- Necessária para que o gerador de demonstrações (generate_demo) localize
-- uma versão publicada válida (is_published = true).
insert into public.site_template_versions (
  id,
  template_id,
  version,
  is_published,
  changelog,
  config,
  created_at
)
values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  1,
  true,
  'Versão base oficial para geração de demonstrações públicas.',
  jsonb_build_object(
    'layout', 'responsive_single_page',
    'sections', jsonb_build_array('hero', 'services', 'appointment_cta', 'gallery', 'products', 'contact'),
    'theme', jsonb_build_object(
      'primary', '#d97706',
      'secondary', '#171717',
      'surface', '#0a0a0a',
      'text', '#f5f5f5'
    )
  ),
  now()
)
on conflict (template_id, version) do update set
  is_published = excluded.is_published,
  config = excluded.config;

-- -------------------------------------------------------------------------
-- 3. Planos Comerciais Aprovados (billing_plans)
-- -------------------------------------------------------------------------
-- Política acordada:
-- - Mensal: R$ 97,00 (9700 centavos), acesso de 30 dias, horizonte de agendamento de 60 dias
-- - Anual:  R$ 997,00 (99700 centavos), acesso de 365 dias, horizonte de agendamento de 365 dias
insert into public.billing_plans (
  id,
  slug,
  name,
  description,
  price_brl_cents,
  billing_period,
  access_days,
  max_booking_horizon_days,
  is_active,
  display_order
)
values
  (
    '22222222-2222-2222-2222-222222222221'::uuid,
    'mensal',
    'Plano Mensal Pro',
    'Site exclusivo publicado, painel de agendamento online e até 60 dias de horizonte futuro na agenda.',
    9700,
    'monthly',
    30,
    60,
    true,
    1
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'anual',
    'Plano Anual Premium (2 meses grátis)',
    'Site exclusivo publicado, painel completo, suporte prioritário e até 365 dias de horizonte na agenda.',
    99700,
    'yearly',
    365,
    365,
    true,
    2
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price_brl_cents = excluded.price_brl_cents,
  billing_period = excluded.billing_period,
  access_days = excluded.access_days,
  max_booking_horizon_days = excluded.max_booking_horizon_days,
  is_active = excluded.is_active,
  display_order = excluded.display_order;

commit;
