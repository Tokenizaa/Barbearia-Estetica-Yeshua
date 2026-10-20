const MAX_HTML_BYTES = 1_000_000;
const USER_AGENT = "YeshuaLeadResearch/1.0 (+public-business-metadata; contact: admin)";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.includes(":") && (host === "::1" || host === "::" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("::ffff:"))) return true;
  const parts = host.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const octets = parts.map(Number);
    if (octets.some((part) => part < 0 || part > 255)) return true;
    const [a, b] = octets;
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) ||
        (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || b === 51)) ||
        (a === 203 && b === 0)) return true;
  }
  return false;
}

function safeUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || isBlockedHost(url.hostname)) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Math.min(Number(code), 0x10ffff)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Math.min(parseInt(code, 16), 0x10ffff)))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getMeta(html: string, key: string): string {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp('<meta\\b[^>]*(?:name|property)\\s*=\\s*["\\']' + escaped + '["\\'][^>]*content\\s*=\\s*["\\']([^"\\']*)["\\'][^>]*>', "i"),
    new RegExp('<meta\\b[^>]*content\\s*=\\s*["\\']([^"\\']*)["\\'][^>]*(?:name|property)\\s*=\\s*["\\']' + escaped + '["\\'][^>]*>', "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}

function findJsonLd(html: string): unknown[] {
  const result: unknown[] = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) && result.length < 20) {
    try {
      const parsed = JSON.parse(match[1]);
      result.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch { /* Ignore malformed structured data and keep parsing public metadata. */ }
  }
  return result;
}

function flattenJsonLd(items: unknown[]): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object" || result.length >= 100) return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const record = value as Record<string, unknown>;
    result.push(record);
    if (record["@graph"]) visit(record["@graph"]);
    if (record.mainEntity) visit(record.mainEntity);
  };
  items.forEach(visit);
  return result;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return decodeEntities(value).slice(0, 300);
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return [item.streetAddress, item.addressLocality, item.addressRegion, item.postalCode]
      .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
      .join(", ").slice(0, 300);
  }
  return "";
}

async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("O HTML excede o limite de 1 MB.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export const onRequestPost = async ({ request }: { request: Request }) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origem da requisição não permitida." }, 403);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 4096) return json({ error: "Corpo da requisição excede o limite permitido." }, 413);
  let payload: { url?: unknown };
  try { payload = await request.json() as { url?: unknown }; } catch { return json({ error: "Envie um JSON válido com o campo url." }, 400); }
  if (typeof payload.url !== "string" || payload.url.length > 2048) return json({ error: "Informe uma URL pública válida (até 2048 caracteres)." }, 400);

  let target = safeUrl(payload.url);
  if (!target) return json({ error: "URL bloqueada. Use um endereço público HTTP ou HTTPS, sem credenciais." }, 400);

  let response: Response | undefined;
  try {
    for (let hop = 0; hop <= 3; hop++) {
      response = await fetch(target.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9" },
        signal: AbortSignal.timeout(8000),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === 3) return json({ error: "Redirecionamento excessivo ou sem destino." }, 422);
        const redirected = safeUrl(new URL(location, target).toString());
        if (!redirected) return json({ error: "O site redirecionou para um endereço bloqueado." }, 422);
        target = redirected;
        continue;
      }
      break;
    }
    if (!response || !response.ok) return json({ error: `O site respondeu HTTP ${response?.status ?? "sem resposta"}.` }, 422);
    const type = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) return json({ error: "O endereço não retornou uma página HTML." }, 422);

    const html = await readLimited(response);
    const structured = flattenJsonLd(findJsonLd(html));
    const business = structured.find((item) => {
      const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
      return types.some((type) => typeof type === "string" && /localbusiness|organization|professionalservice|store|healthandbeautybusiness|beautysalon|barbershop|hair salon/i.test(type));
    }) ?? structured.find((item) => item.name);
    const title = decodeEntities(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)?.[1];
    const phones = html.match(/(?:href=["']tel:([^"'?]+)|(?:telephone|phone|telefone|whatsapp)["']?\s*[:=]\s*["']?([^"'<>\s]{7,24}))/i);
    const emails = html.match(/(?:href=["']mailto:([^"'?]+)|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
    const typeValue = business?.["@type"];
    const category = typeof typeValue === "string" ? typeValue : Array.isArray(typeValue) ? typeValue.find((item) => typeof item === "string") as string ?? "" : "";
    const address = textValue(business?.address) || getMeta(html, "og:street-address");
    const result = {
      requestedUrl: payload.url,
      finalUrl: target.toString(),
      sourceUrl: canonical ? new URL(canonical, target).toString() : target.toString(),
      capturedAt: new Date().toISOString(),
      businessName: textValue(business?.name) || getMeta(html, "og:site_name") || getMeta(html, "og:title") || title,
      category: category || getMeta(html, "article:section"),
      description: textValue(business?.description) || getMeta(html, "description") || getMeta(html, "og:description"),
      phone: textValue(business?.telephone) || decodeEntities(phones?.[1] ?? phones?.[2] ?? ""),
      email: textValue(business?.email) || decodeEntities(emails?.[1] ?? emails?.[0] ?? ""),
      address,
      logoUrl: typeof business?.logo === "string" ? new URL(business.logo, target).toString() : getMeta(html, "og:image"),
      evidence: {
        name: Boolean(textValue(business?.name) || getMeta(html, "og:site_name") || getMeta(html, "og:title") || title),
        description: Boolean(textValue(business?.description) || getMeta(html, "description") || getMeta(html, "og:description")),
        phone: Boolean(textValue(business?.telephone) || phones),
        email: Boolean(textValue(business?.email) || emails),
        address: Boolean(address),
      },
      notice: "Metadados públicos extraídos automaticamente. Revise os campos antes de marcar como verificados.",
    };
    if (!result.businessName) return json({ error: "A página abriu, mas não foi possível identificar o nome do negócio. Cadastre manualmente ou use outra URL." }, 422);
    return json(result);
  } catch (error) {
    return json({ error: error instanceof Error && error.name === "TimeoutError" ? "O site demorou mais de 8 segundos para responder." : error instanceof Error ? error.message : "Falha ao capturar metadados públicos." }, 502);
  } finally {
    try { await response?.body?.cancel(); } catch { /* The response body may already be consumed. */ }
  }
};
