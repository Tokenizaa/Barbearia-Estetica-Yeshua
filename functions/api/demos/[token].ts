interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}
type Context = { request: Request; env: Env; params: { token: string } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
});
async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function api(env: Env, path: string, init: RequestInit = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("demo_storage_not_configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  headers.set("content-type", "application/json");
  return fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, { ...init, headers, signal: AbortSignal.timeout(8000) });
}
export async function onRequest({ request, env, params }: Context) {
  const token = params.token ?? "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return json({ error: "demo_not_found" }, 404);
  const tokenHash = await digest(token);
  let linkResponse: Response;
  try {
    linkResponse = await api(env, `site_demo_public_links?token_hash=eq.${tokenHash}&status=in.(active,selected)&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,site_project_id,status,expires_at,selected_version_id&limit=1`);
  } catch { return json({ error: "demo_temporarily_unavailable" }, 503); }
  if (!linkResponse.ok) return json({ error: "demo_temporarily_unavailable" }, 503);
  const links = await linkResponse.json() as Array<{ id: string; site_project_id: string; status: string; expires_at: string; selected_version_id: string | null }>;
  if (!links.length) return json({ error: "demo_not_found_or_expired" }, 404);
  const link = links[0];

  if (request.method === "GET") {
    const versionsResponse = await api(env, `site_project_versions?site_project_id=eq.${encodeURIComponent(link.site_project_id)}&select=id,version,generated_content,design_overrides,template_version_id,selected_by_prospect&order=version.desc&limit=30`);
    if (!versionsResponse.ok) return json({ error: "demo_versions_unavailable" }, 503);
    const versions = await versionsResponse.json();
    return json({ status: link.status, expiresAt: link.expires_at, selectedVersionId: link.selected_version_id, versions });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  let body: { versionId?: unknown };
  try { body = await request.json() as { versionId?: unknown }; } catch { return json({ error: "invalid_json" }, 400); }
  if (typeof body.versionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.versionId)) {
    return json({ error: "version_id_invalid" }, 400);
  }
  const selection = await api(env, "rpc/select_public_demo_version", {
    method: "POST", body: JSON.stringify({ p_token_hash: tokenHash, p_version_id: body.versionId }),
  });
  if (!selection.ok) {
    if (selection.status === 400 || selection.status === 404) return json({ error: "selection_rejected" }, 409);
    return json({ error: "selection_temporarily_unavailable" }, 503);
  }
  return json(await selection.json());
}
