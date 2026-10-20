import { useEffect, useState } from "react";
import { Check, Clock3, ExternalLink, LoaderCircle, ShieldAlert } from "lucide-react";
import { SharedSitePreview, type ShareableSitePreview } from "./SharedSitePreview";

type DemoVersion = {
  id: string;
  version: number;
  generated_content: Record<string, unknown> | null;
  design_overrides: Record<string, unknown> | null;
  template_version_id: string;
  selected_by_prospect: boolean;
  template?: {
    id: string;
    config?: { layout?: string; sections?: string[]; theme?: { primary?: string; secondary?: string; surface?: string } };
    site_templates?: { slug?: string; name?: string; category?: string; preview_image_url?: string | null } | null;
  } | null;
};
type DemoData = { status: string; expiresAt: string; selectedVersionId: string | null; versions: DemoVersion[] };
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function contentText(version: DemoVersion, keys: string[]) {
  const content = version.generated_content ?? {};
  for (const key of keys) {
    const value = text(content[key]);
    if (value) return value;
  }
  return "";
}
export function PublicDemoSelectionPage({ token }: { token: string }) {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/demos/${encodeURIComponent(token)}`, { headers: { accept: "application/json" } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Não foi possível carregar as demonstrações.");
        return body as DemoData;
      })
      .then((body) => {
        if (!active) return;
        setData(body);
        setSelected(body.selectedVersionId);
        setActivePreviewId(body.selectedVersionId ?? body.versions[0]?.id ?? null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Falha ao carregar a página.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function chooseVersion(versionId: string) {
    setSaving(versionId);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch(`/api/demos/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível registrar a escolha.");
      setSelected(versionId);
      setActivePreviewId(versionId);
      setSuccess(true);
      setData((current) => current ? {
        ...current, status: "selected", selectedVersionId: versionId,
        versions: current.versions.map((version) => ({ ...version, selected_by_prospect: version.id === versionId })),
      } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao registrar a escolha.");
    } finally { setSaving(null); }
  }

  if (loading) return <main className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center p-6"><LoaderCircle className="animate-spin" /><span className="sr-only">Carregando demonstrações</span></main>;
  if (error && !data) return <main className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center p-6"><section className="max-w-lg text-center space-y-4"><ShieldAlert className="mx-auto h-10 w-10 text-amber-400" /><h1 className="text-2xl font-semibold">Demonstração indisponível</h1><p className="text-neutral-400">{error}</p></section></main>;

  const expires = data?.expiresAt ? new Date(data.expiresAt).toLocaleDateString("pt-BR") : "";
  const activeVersion = data?.versions.find((version) => version.id === activePreviewId) ?? data?.versions[0] ?? null;
  const activeContent = activeVersion?.generated_content ?? {};
  const templateSlug = activeVersion?.template?.site_templates?.slug ?? "modelo-inicial";
  const preview: ShareableSitePreview | null = activeVersion ? {
    version: 1,
    businessName: contentText(activeVersion, ["businessName", "business_name", "title", "name", "brandName"]) || "Negócio local",
    category: contentText(activeVersion, ["category", "business_category", "segment"]),
    description: contentText(activeVersion, ["description", "about", "subtitle", "summary"]),
    phone: contentText(activeVersion, ["phone", "normalized_phone", "phone_number"]),
    email: contentText(activeVersion, ["email", "email_address"]),
    address: [contentText(activeVersion, ["address", "formatted_address"]), contentText(activeVersion, ["city", "locality"]), contentText(activeVersion, ["region", "state", "province"])].filter(Boolean).join(" · "),
    websiteUrl: contentText(activeVersion, ["website", "website_url", "url"]),
    templateId: ["modelo-inicial", "minimal", "editorial", "bold"].includes(templateSlug) ? templateSlug : "modelo-inicial",
    templateName: activeVersion.template?.site_templates?.name || "Modelo inicial",
    projectVersion: activeVersion.version,
    generatedAt: text(activeContent.generatedAt) || new Date().toISOString(),
  } : null;
  return <main className="min-h-screen bg-neutral-950 text-neutral-100">
    <header className="border-b border-neutral-800 px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.22em] text-amber-400">Demonstração personalizada</p><h1 className="mt-1 text-xl font-semibold sm:text-2xl">Escolha a versão do seu site</h1></div>
        <div className="hidden items-center gap-2 text-xs text-neutral-400 sm:flex"><Clock3 className="h-4 w-4" /> Disponível até {expires}</div>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <p className="max-w-2xl text-sm leading-6 text-neutral-400">Compare as propostas abaixo e selecione a versão que melhor representa seu negócio. Sua escolha será registrada para a equipe dar continuidade ao projeto.</p>
      {success && <div role="status" className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-900 bg-emerald-950/40 p-4 text-sm text-emerald-200"><Check className="h-5 w-5" /> Sua escolha foi registrada. A equipe poderá continuar com a versão selecionada.</div>}
      {error && <div role="alert" className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</div>}
      {!data?.versions?.length ? <div className="mt-8 rounded-2xl border border-neutral-800 p-8 text-center text-neutral-400">Ainda não há versões disponíveis nesta demonstração.</div> :
        <>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Versões disponíveis">
            {data.versions.map((version) => <button key={version.id} type="button" onClick={() => setActivePreviewId(version.id)} aria-pressed={activeVersion?.id === version.id} className={`rounded-lg border px-4 py-2 text-sm transition ${activeVersion?.id === version.id ? "border-emerald-600 bg-emerald-950/40 text-emerald-200" : "border-neutral-700 text-neutral-300 hover:border-neutral-500"}`}>
              {version.template?.site_templates?.name || "Modelo"} · v{version.version}{(selected === version.id || version.selected_by_prospect) ? " · Selecionada" : ""}
            </button>)}
          </div>
          {preview && <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800 bg-white">
            <SharedSitePreview preview={preview} />
            <div className="border-t border-neutral-200 p-4 sm:p-6">
              <button disabled={saving !== null || selected === activeVersion?.id} onClick={() => activeVersion && void chooseVersion(activeVersion.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50">
                {saving === activeVersion?.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : selected === activeVersion?.id ? <Check className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                {saving === activeVersion?.id ? "Registrando escolha..." : selected === activeVersion?.id ? "Esta versão já foi selecionada" : "Selecionar esta versão"}
              </button>
            </div>
          </div>}
        </> }
    </section>
    <footer className="border-t border-neutral-800 px-5 py-6 text-center text-xs text-neutral-600">Link privado da demonstração · não compartilhe publicamente</footer>
  </main>;
}
