interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
}
export async function onRequestGet({ env }: { env: Env }) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/billing_plans?select=id,slug,name,description,price_brl_cents,billing_period,access_days&is_active=eq.true&order=display_order.asc`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}` },
  });
  return new Response(await response.text(), { status: response.status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
