import React from 'react';

export interface ShareableSitePreview {
  version: 1;
  businessName: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  websiteUrl: string;
  templateId: string;
  templateName: string;
  projectVersion: number;
  generatedAt: string;
}

const MAX_PAYLOAD_LENGTH = 16000;

export function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function createShareablePreviewUrl(preview: ShareableSitePreview): string {
  const payload = toBase64Url(JSON.stringify(preview));
  if (typeof window === 'undefined') {
    return `/?site-preview=${payload}`;
  }
  const url = new URL(window.location.href);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  url.searchParams.set('site-preview', payload);
  return url.toString();
}

export function readShareablePreview(searchOrUrl?: string): ShareableSitePreview | null {
  let queryString = searchOrUrl;

  if (typeof queryString !== 'string' && typeof window !== 'undefined') {
    queryString = window.location.search;
    // Fallback: check if hash contains site-preview (e.g. #site-preview=...)
    if (!queryString && window.location.hash.includes('site-preview=')) {
      queryString = '?' + window.location.hash.replace(/^[#?]/, '');
    }
  }

  if (!queryString) return null;

  // If a full URL was provided, extract the query string
  if (queryString.includes('?')) {
    queryString = queryString.slice(queryString.indexOf('?'));
  }

  const params = new URLSearchParams(queryString);
  const rawPayload = params.get('site-preview');
  if (!rawPayload) return null;

  const payload = rawPayload.trim();
  if (!payload || payload.length > MAX_PAYLOAD_LENGTH) return null;

  try {
    const jsonStr = fromBase64Url(payload);
    const value = JSON.parse(jsonStr) as Partial<ShareableSitePreview>;

    if (value.version !== 1 || typeof value.businessName !== 'string' || !value.businessName.trim()) {
      return null;
    }

    const safeText = (input: unknown, max = 500) =>
      typeof input === 'string' ? input.trim().slice(0, max) : '';

    const templateId = ['modelo-inicial', 'minimal', 'editorial', 'bold'].includes(String(value.templateId))
      ? String(value.templateId)
      : 'modelo-inicial';

    const safeBusinessName = safeText(value.businessName, 120);

    return {
      version: 1,
      businessName: safeBusinessName,
      category: safeText(value.category, 100),
      description:
        safeText(value.description, 700) ||
        `Uma presença digital feita para apresentar os serviços de ${safeBusinessName} com clareza e facilitar o contato com novos clientes.`,
      phone: safeText(value.phone, 40),
      email: safeText(value.email, 120),
      address: safeText(value.address, 200),
      websiteUrl: safeText(value.websiteUrl, 300),
      templateId,
      templateName: safeText(value.templateName, 80) || 'Modelo inicial neutro',
      projectVersion:
        typeof value.projectVersion === 'number' && Number.isFinite(value.projectVersion)
          ? Math.max(1, Math.floor(value.projectVersion))
          : 1,
      generatedAt: safeText(value.generatedAt, 40),
    };
  } catch {
    return null;
  }
}

export const SharedSitePreview: React.FC<{ preview: ShareableSitePreview | null }> = ({ preview }) => {
  if (!preview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-neutral-100">
        <div className="max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            ⚠️
          </div>
          <h1 className="text-2xl font-semibold">Prévia indisponível</h1>
          <p className="mt-3 text-sm text-neutral-400">
            O link de prévia está incompleto, expirou ou contém dados malformados.
          </p>
          <a
            href="/"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400"
          >
            Voltar ao início
          </a>
        </div>
      </main>
    );
  }

  const light = preview.templateId === 'minimal' || preview.templateId === 'editorial';
  const editorial = preview.templateId === 'editorial';
  const bold = preview.templateId === 'bold';

  // Format safe contact links
  const phoneDigits = preview.phone.replace(/\D/g, '');
  let whatsappNumber = phoneDigits;
  if (phoneDigits.length === 10 || phoneDigits.length === 11) {
    whatsappNumber = `55${phoneDigits}`;
  }
  const whatsappUrl = whatsappNumber.length >= 10 ? `https://wa.me/${whatsappNumber}` : '';
  const emailHref = preview.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(preview.email) ? `mailto:${preview.email}` : '';
  const phoneHref = preview.phone ? `tel:${preview.phone.replace(/[^+\d]/g, '')}` : '';

  const primaryContactHref = whatsappUrl || emailHref || phoneHref;
  const safeWebsiteUrl = /^https?:\/\//i.test(preview.websiteUrl) ? preview.websiteUrl : '';

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* Top Banner differentiating snapshot from published site */}
      <header className="sticky top-0 z-30 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold uppercase tracking-wider text-amber-800">
              Prévia de Proposta
            </span>
            <span className="font-medium text-neutral-800">
              {preview.businessName} · Modelo: {preview.templateName} (v{preview.projectVersion})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-600 hidden sm:inline">
              Snapshot interativo não publicado
            </span>
            <a
              href="/"
              className="rounded-lg border border-neutral-300 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-white"
            >
              Voltar ao site
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {/* Main Showcase Hero */}
        <section
          className={`relative overflow-hidden rounded-3xl shadow-2xl transition-all ${
            editorial
              ? 'bg-stone-100 text-stone-900 border border-stone-300'
              : light
              ? 'bg-white text-neutral-900 border border-neutral-200'
              : bold
              ? 'bg-neutral-950 text-white border border-emerald-500/30'
              : 'bg-slate-950 text-white border border-slate-800'
          }`}
        >
          {/* Subtle Ambient Background Gradients */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              bold
                ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-neutral-950 to-neutral-950'
                : editorial
                ? 'bg-gradient-to-br from-stone-100 via-amber-50/40 to-stone-200/50'
                : light
                ? 'bg-gradient-to-br from-white via-neutral-50 to-neutral-100/50'
                : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/15 via-slate-950 to-neutral-950'
            }`}
          />

          <div className="relative grid min-h-[500px] items-center gap-10 px-6 py-12 sm:px-12 sm:py-16 md:grid-cols-[1.3fr_0.7fr]">
            {/* Left Column: Brand & Copy */}
            <div className="space-y-6">
              <span
                className={`inline-block text-xs font-bold uppercase tracking-[0.2em] ${
                  editorial || light ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                {preview.category || 'Atendimento Especializado'}
              </span>

              <h1
                className={`text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl ${
                  editorial ? 'font-serif' : ''
                }`}
              >
                {preview.businessName}
              </h1>

              <p
                className={`max-w-xl text-base sm:text-lg leading-relaxed ${
                  light ? 'text-neutral-600' : 'text-neutral-300'
                }`}
              >
                {preview.description}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {primaryContactHref ? (
                  <a
                    href={primaryContactHref}
                    target={whatsappUrl ? '_blank' : undefined}
                    rel={whatsappUrl ? 'noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 transform active:scale-95"
                  >
                    <span>Entre em contato</span>
                    {whatsappUrl && <span className="text-xs font-semibold">via WhatsApp</span>}
                  </a>
                ) : (
                  <span className="inline-flex rounded-xl bg-emerald-500/80 px-6 py-3.5 text-sm font-bold text-neutral-950">
                    Entre em contato
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Public Business Data Card */}
            <div
              className={`rounded-2xl border p-6 sm:p-8 backdrop-blur-md shadow-lg ${
                light
                  ? 'border-neutral-200/90 bg-neutral-50/90'
                  : 'border-white/10 bg-neutral-900/80'
              }`}
            >
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-60">
                Informações Confirmadas
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                {preview.address ? (
                  <div>
                    <span className="text-xs opacity-60 block font-medium">Localização</span>
                    <p className="mt-1 font-medium break-words">{preview.address}</p>
                  </div>
                ) : null}

                {preview.phone ? (
                  <div>
                    <span className="text-xs opacity-60 block font-medium">Telefone / WhatsApp</span>
                    <p className="mt-1 font-semibold">{preview.phone}</p>
                  </div>
                ) : null}

                {preview.email ? (
                  <div>
                    <span className="text-xs opacity-60 block font-medium">E-mail</span>
                    <p className="mt-1 break-words font-mono text-xs">{preview.email}</p>
                  </div>
                ) : null}

                {safeWebsiteUrl ? (
                  <div>
                    <span className="text-xs opacity-60 block font-medium">Site Atual</span>
                    <a
                      href={safeWebsiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-emerald-600 dark:text-emerald-400 underline font-medium"
                    >
                      {safeWebsiteUrl}
                    </a>
                  </div>
                ) : null}

                {!preview.address && !preview.phone && !preview.email && (
                  <p className="text-xs italic opacity-70">
                    Os dados de contato e localização serão completados antes da publicação definitiva.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer Disclaimer */}
        <footer className="mx-auto max-w-2xl py-10 text-center space-y-2">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Esta é uma proposta visual personalizada de site para avaliação do cliente. Ela não representa um site publicado, não possui domínio próprio e todas as informações serão validadas antes do lançamento.
          </p>
          {preview.generatedAt && (
            <p className="text-[11px] text-neutral-400">
              Proposta gerada em {new Date(preview.generatedAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(preview.generatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </footer>
      </div>
    </main>
  );
};
