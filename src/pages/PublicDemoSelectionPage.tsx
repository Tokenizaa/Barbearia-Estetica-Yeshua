import { useEffect, useState } from "react";
import { Check, Clock3, ExternalLink, LoaderCircle, Palette, ShieldAlert } from "lucide-react";

type DemoVersion = {
  id: string;
  version: number;
  generated_content: Record<string, unknown> | null;
  design_overrides: Record<string, unknown> | null;
  template_version_id: string;
  selected_by_prospect: boolean;
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
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.versions.map((version) => {
            const isSelected = selected === version.id || version.selected_by_prospect;
            const title = contentText(version, ["businessName", "business_name", "title", "name", "brandName"]) || `Proposta ${version.version}`;
            const headline = contentText(version, ["headline", "heroTitle", "hero_title", "tagline"]);
            const description = contentText(version, ["description", "about", "subtitle", "summary"]);
            const services = Array.isArray(version.generated_content?.services)
              ? version.generated_content.services.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6)
              : [];
            const phone = contentText(version, ["phone", "normalized_phone", "phone_number"]);
            const email = contentText(version, ["email", "email_address"]);
            const address = contentText(version, ["address", "formatted_address"]);
            const city = [contentText(version, ["city", "locality"]), contentText(version, ["region", "state", "province"])].filter(Boolean).join(" · ");
            const website = contentText(version, ["website", "website_url", "url"]);
            return <article key={version.id} className={`overflow-hidden rounded-2xl border bg-white text-neutral-900 shadow-sm ${isSelected ? "border-emerald-600 ring-1 ring-emerald-600" : "border-neutral-200"}`}>
              <div className="border-b border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium uppercase tracking-wider text-neutral-500">Prévia do site · versão {version.version}</span>{isSelected && <span className="flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3 w-3" /> Selecionada</span>}</div>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white"><Palette className="h-5 w-5" /></div>
                  <div className="min-w-0"><p className="truncate text-lg font-semibold">{title}</p><p className="text-xs text-neutral-500">{contentText(version, ["category", "business_category", "segment"]) || "Negócio local"}</p></div>
                </div>
                <div className="pb-3 pt-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Bem-vindo</p>
                  <h2 className="mt-2 text-2xl font-bold leading-tight">{headline || title}</h2>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{description || "Uma apresentação clara do negócio, dos serviços e das formas de contato."}</p>
                  <div className="mt-5 inline-flex rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white">Conheça nossos serviços</div>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Serviços</h3>
                  {services.length ? <ul className="mt-2 space-y-2">{services.map((service, index) => <li key={`${version.id}-service-${index}`} className="flex items-start gap-2 text-sm text-neutral-700"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{service}</li>)}</ul> : <p className="mt-2 text-sm text-neutral-500">A seção de serviços será personalizada com as informações confirmadas do negócio.</p>}
                </div>
                {(phone || email || address || city || website) && <div className="border-t border-neutral-200 pt-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Contato e localização</h3>
                  <div className="mt-2 space-y-1.5 text-sm text-neutral-700">
                    {phone && <p>Telefone: {phone}</p>}
                    {email && <p className="break-all">E-mail: {email}</p>}
                    {address && <p>{address}</p>}
                    {city && <p>{city}</p>}
                    {website && <p className="break-all">{website}</p>}
                  </div>
                </div>}
                <details className="border-t border-neutral-200 pt-3">
                  <summary className="cursor-pointer text-xs text-neutral-500">Detalhes técnicos da proposta</summary>
                  <p className="mt-2 break-all text-[11px] text-neutral-500">Modelo: {version.template_version_id}</p>
                </details>
                <button disabled={saving !== null || isSelected} onClick={() => chooseVersion(version.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {saving === version.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isSelected ? <Check className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  {saving === version.id ? "Registrando escolha..." : isSelected ? "Versão selecionada" : "Selecionar esta versão"}
                </button>
              </div>
            </article>;
          })}
        </div>}
    </section>
    <footer className="border-t border-neutral-800 px-5 py-6 text-center text-xs text-neutral-600">Link privado da demonstração · não compartilhe publicamente</footer>
  </main>;
}
