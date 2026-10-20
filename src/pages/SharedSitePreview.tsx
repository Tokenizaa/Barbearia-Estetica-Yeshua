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

const MAX_PAYLOAD_LENGTH = 12000;

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function createShareablePreviewUrl(preview: ShareableSitePreview): string {
  const payload = toBase64Url(JSON.stringify(preview));
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('site-preview', payload);
  return url.toString();
}

export function readShareablePreview(search: string): ShareableSitePreview | null {
  const payload = new URLSearchParams(search).get('site-preview');
  if (!payload || payload.length > MAX_PAYLOAD_LENGTH) return null;
  try {
    const value = JSON.parse(fromBase64Url(payload)) as Partial<ShareableSitePreview>;
    if (value.version !== 1 || typeof value.businessName !== 'string' || !value.businessName.trim()) return null;
    const safeText = (input: unknown, max = 500) => typeof input === 'string' ? input.slice(0, max) : '';
    const templateId = ['modelo-inicial', 'minimal', 'editorial', 'bold'].includes(String(value.templateId)) ? String(value.templateId) : 'modelo-inicial';
    return {
      version: 1,
      businessName: safeText(value.businessName, 120),
      category: safeText(value.category, 100),
      description: safeText(value.description, 700) || `Uma presença digital feita para apresentar os serviços de ${safeText(value.businessName, 120)} com clareza e facilitar o contato com novos clientes.`,
      phone: safeText(value.phone, 40),
      email: safeText(value.email, 120),
      address: safeText(value.address, 200),
      websiteUrl: safeText(value.websiteUrl, 300),
      templateId,
      templateName: safeText(value.templateName, 80) || 'Modelo inicial neutro',
      projectVersion: typeof value.projectVersion === 'number' && Number.isFinite(value.projectVersion) ? Math.max(1, Math.floor(value.projectVersion)) : 1,
      generatedAt: safeText(value.generatedAt, 40),
    };
  } catch {
    return null;
  }
}

export const SharedSitePreview: React.FC<{ preview: ShareableSitePreview | null }> = ({ preview }) => {
  if (!preview) {
    return <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-neutral-100"><div className="max-w-lg text-center"><h1 className="text-2xl font-semibold">Prévia indisponível</h1><p className="mt-3 text-sm text-neutral-400">O link está incompleto ou não contém uma versão de prévia válida.</p><a href="/" className="mt-6 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950">Voltar ao início</a></div></main>;
  }

  const light = preview.templateId === 'minimal' || preview.templateId === 'editorial';
  const editorial = preview.templateId === 'editorial';
  const bold = preview.templateId === 'bold';
  const phoneDigits = preview.phone.replace(/\D/g, '');
  const whatsappUrl = phoneDigits.length >= 10 ? `https://wa.me/${phoneDigits}` : '';
  const contactHref = whatsappUrl || (preview.email ? `mailto:${preview.email}` : preview.phone ? `tel:${preview.phone.replace(/[^+\d]/g, '')}` : '');

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <span className="text-sm font-semibold tracking-tight">{preview.businessName}</span>
          <span className="rounded-full border border-neutral-300 px-3 py-1 text-[11px] font-medium text-neutral-600">Prévia de proposta · v{preview.projectVersion}</span>
        </div>
        <section className={`relative mt-6 overflow-hidden rounded-2xl ${editorial ? 'bg-stone-100 text-stone-900' : light ? 'bg-white text-neutral-900' : bold ? 'bg-neutral-950 text-white' : 'bg-slate-950 text-white'}`}>
          <div className={`absolute inset-0 ${bold ? 'bg-gradient-to-br from-emerald-500/20 via-neutral-950 to-neutral-950' : editorial ? 'bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50' : light ? 'bg-white' : 'bg-gradient-to-br from-blue-950 via-slate-950 to-neutral-950'}`} />
          <div className="relative grid min-h-[480px] items-center gap-12 px-7 py-14 sm:px-14 sm:py-20 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${light ? 'text-emerald-700' : 'text-emerald-300'}`}>{preview.category || 'Atendimento especializado'}</p>
              <h1 className={`mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl ${editorial ? 'font-serif' : ''}`}>{preview.businessName}</h1>
              <p className={`mt-6 max-w-xl text-base leading-7 ${light ? 'text-neutral-600' : 'text-neutral-300'}`}>{preview.description}</p>
              {contactHref ? <a href={contactHref} target={whatsappUrl ? '_blank' : undefined} rel={whatsappUrl ? 'noreferrer' : undefined} className="mt-8 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-emerald-400">Entre em contato</a> : <span className="mt-8 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-neutral-950">Entre em contato</span>}
            </div>
            <div className={`rounded-xl border p-6 backdrop-blur-sm ${light ? 'border-neutral-200 bg-neutral-50' : 'border-white/15 bg-white/5'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Informações</p>
              <div className="mt-5 space-y-4 text-sm">
                {preview.address && <div><p className="text-xs opacity-60">Localização</p><p className="mt-1 break-words">{preview.address}</p></div>}
                {preview.phone && <div><p className="text-xs opacity-60">Telefone</p><p className="mt-1">{preview.phone}</p></div>}
                {preview.email && <div><p className="text-xs opacity-60">E-mail</p><p className="mt-1 break-words">{preview.email}</p></div>}
                {preview.websiteUrl && <div><p className="text-xs opacity-60">Site atual</p><a className="mt-1 block break-all underline" href={preview.websiteUrl} target="_blank" rel="noreferrer">{preview.websiteUrl}</a></div>}
                {!preview.address && !preview.phone && !preview.email && <p className="opacity-70">Os dados de contato serão confirmados antes da publicação.</p>}
              </div>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-3xl py-10 text-center">
          <p className="text-sm text-neutral-600">Esta é uma proposta visual preliminar, criada para avaliação. O site ainda não foi publicado e as informações precisam ser confirmadas pelo estabelecimento.</p>
          {preview.generatedAt && <p className="mt-2 text-xs text-neutral-400">Prévia gerada em {new Date(preview.generatedAt).toLocaleDateString('pt-BR')}</p>}
        </div>
      </div>
    </main>
  );
};
