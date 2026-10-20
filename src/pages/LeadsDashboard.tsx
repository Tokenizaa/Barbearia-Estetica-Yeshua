import React, { useEffect, useMemo, useState } from 'react';
import { createShareablePreviewUrl } from './SharedSitePreview';
import { Activity, ArrowRight, Check, CheckCircle, Clock, Edit3, ExternalLink, FilePlus2, Globe2, Plus, Search, Share2, Sparkles, Users } from 'lucide-react';

type LeadStatus =
  | 'new'
  | 'reviewing'
  | 'qualified'
  | 'site_preparing'
  | 'site_ready'
  | 'proposal_sent'
  | 'interested'
  | 'not_interested'
  | 'converted'
  | 'archived';

type VerificationStatus = 'unreviewed' | 'in_review' | 'verified' | 'needs_correction';
type ProjectStatus = 'not_started' | 'preparing' | 'ready_for_review' | 'approved_to_share' | 'shared' | 'revision_requested' | 'accepted' | 'declined' | 'failed';

interface LeadActivity {
  id: string;
  summary: string;
  createdAt: string;
}

interface SiteProject {
  status: ProjectStatus;
  templateId: string;
  templateName: string;
  templateVersion: number;
  versions: Array<{ templateId: string; templateName: string; version: number; createdAt: string }>;
  previewText: string;
  updatedAt: string;
}

interface CaptureResponse {
  requestedUrl: string; finalUrl: string; sourceUrl: string; capturedAt: string;
  businessName: string; category: string; description: string; phone: string;
  email: string; address: string; logoUrl: string; evidence: Record<string, boolean>; notice: string;
}

interface Lead {
  id: string;
  businessName: string;
  category: string;
  websiteUrl: string;
  siteDescription?: string;
  phone: string;
  email: string;
  address: string;
  sourceUrl: string;
  sourceType: string;
  notes: string;
  priority: 'low' | 'normal' | 'high';
  verificationStatus: VerificationStatus;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  activities: LeadActivity[];
  project?: SiteProject;
}

const STORAGE_KEY = 'prospecting_leads_v1';
const INITIAL_TEMPLATE = { id: 'modelo-inicial', name: 'Modelo inicial neutro' };
const ALTERNATIVE_TEMPLATES = [
  { id: 'minimal', name: 'Minimalista' },
  { id: 'editorial', name: 'Editorial' },
  { id: 'bold', name: 'Impacto visual' },
];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  reviewing: 'Em revisão',
  qualified: 'Qualificado',
  site_preparing: 'Preparando site',
  site_ready: 'Site preparado',
  proposal_sent: 'Proposta enviada',
  interested: 'Interessado',
  not_interested: 'Sem interesse',
  converted: 'Convertido',
  archived: 'Arquivado',
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  reviewing: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  site_preparing: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  site_ready: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  proposal_sent: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  interested: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  not_interested: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  converted: 'bg-green-500/10 text-green-300 border-green-500/20',
  archived: 'bg-neutral-800 text-neutral-500 border-neutral-700',
};

const now = () => new Date().toISOString();
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function parseCsvRow(line: string, delimiter = ','): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') { value += '"'; index++; }
    else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) { values.push(value.trim()); value = ''; }
    else value += character;
  }
  values.push(value.trim());
  return values;
}

function readLeads(): Lead[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as Lead[] : [];
  } catch {
    return [];
  }
}

function getPreviewText(lead: Lead) {
  const category = lead.category.trim() || 'Serviços especializados';
  const location = lead.address.trim() || 'Entre em contato para conhecer nosso atendimento';
  return `${lead.businessName}\n${category}\nUma presença digital feita para apresentar os serviços de ${lead.businessName} com clareza.\nLocalização: ${location}\nContato: ${lead.phone || lead.email || 'Contato a confirmar'}`;
}

export const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(() => readLeads());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | LeadStatus>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [activityText, setActivityText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: '', category: '', websiteUrl: '', siteDescription: '', phone: '', email: '',
    address: '', sourceUrl: '', sourceType: 'Manual', notes: '', priority: 'normal' as Lead['priority'],
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); } catch { /* Storage is provisional; keep this session usable. */ }
  }, [leads]);

  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [lead.businessName, lead.category, lead.phone, lead.email, lead.address].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (filter === 'all' || lead.status === filter);
  }), [leads, search, filter]);

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'new').length,
    qualified: leads.filter((lead) => ['qualified', 'site_preparing', 'site_ready'].includes(lead.status)).length,
    proposal: leads.filter((lead) => ['proposal_sent', 'interested'].includes(lead.status)).length,
  }), [leads]);

  const updateLead = (id: string, patch: Partial<Lead>, activity?: string) => {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== id) return lead;
      const next = { ...lead, ...patch, updatedAt: now() };
      if (activity) next.activities = [{ id: makeId(), summary: activity, createdAt: now() }, ...lead.activities];
      return next;
    }));
  };

  const createLead = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.businessName.trim();
    if (!name) return;
    const timestamp = now();
    const lead: Lead = {
      ...form,
      id: makeId(),
      businessName: name,
      verificationStatus: 'unreviewed',
      status: 'new',
      createdAt: timestamp,
      updatedAt: timestamp,
      activities: [{ id: makeId(), summary: `Lead cadastrado manualmente. Fonte: ${form.sourceType || 'não informada'}.`, createdAt: timestamp }],
    };
    setLeads((current) => [lead, ...current]);
    setSelectedId(lead.id);
    setShowCreate(false);
    setForm({ businessName: '', category: '', websiteUrl: '', siteDescription: '', phone: '', email: '', address: '', sourceUrl: '', sourceType: 'Manual', notes: '', priority: 'normal' });
  };

  const prepareSite = (lead: Lead) => {
    const timestamp = now();
    const project: SiteProject = {
      status: 'ready_for_review',
      templateId: INITIAL_TEMPLATE.id,
      templateName: INITIAL_TEMPLATE.name,
      templateVersion: 1,
      versions: [{ templateId: INITIAL_TEMPLATE.id, templateName: INITIAL_TEMPLATE.name, version: 1, createdAt: timestamp }],
      previewText: getPreviewText(lead),
      updatedAt: timestamp,
    };
    updateLead(lead.id, { project, status: 'site_ready' }, 'Primeira versão textual do site preparada para revisão interna. Nenhum site foi publicado ou enviado.');
  };

  const captureWebsite = async (url: string, targetLead?: Lead) => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) { setCaptureError('Informe a URL do site público para capturar os dados.'); return; }
    setCaptureBusy(true);
    setCaptureError(null);
    setCaptureMessage(null);
    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      if (!(response.headers.get('content-type') ?? '').includes('application/json')) {
        throw new Error('A API de captura não está disponível neste ambiente. A Cloudflare Pages Function /api/capture precisa estar implantada.');
      }
      const result = await response.json() as CaptureResponse | { error?: string };
      if (!response.ok || !('businessName' in result)) {
        throw new Error('error' in result && result.error ? result.error : 'Não foi possível capturar os metadados do site.');
      }
      const captured = result as CaptureResponse;
      if (targetLead) {
        updateLead(targetLead.id, {
          businessName: captured.businessName || targetLead.businessName,
          category: captured.category || targetLead.category,
          websiteUrl: captured.finalUrl || targetLead.websiteUrl,
          siteDescription: captured.description || targetLead.siteDescription,
          phone: captured.phone || targetLead.phone,
          email: captured.email || targetLead.email,
          address: captured.address || targetLead.address,
          sourceUrl: captured.sourceUrl || normalizedUrl,
          sourceType: 'Site público',
          verificationStatus: 'in_review',
        }, 'Metadados públicos capturados em ' + new Date(captured.capturedAt).toLocaleString('pt-BR') + '. Campos precisam de revisão humana.');
      } else {
        setForm((current) => ({
          ...current,
          businessName: current.businessName || captured.businessName,
          category: current.category || captured.category,
          websiteUrl: captured.finalUrl || normalizedUrl,
          siteDescription: current.siteDescription || captured.description,
          phone: current.phone || captured.phone,
          email: current.email || captured.email,
          address: current.address || captured.address,
          sourceUrl: captured.sourceUrl || normalizedUrl,
          sourceType: 'Site público',
          notes: current.notes,
        }));
      }
      const found = Object.values(captured.evidence ?? {}).filter(Boolean).length;
      setCaptureMessage('Captura concluída: ' + found + ' tipo(s) de dado encontrado(s). Revise todos os campos; a captura não equivale a verificação.');
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Falha inesperada na captura. Verifique se a API /api/capture está implantada.');
    } finally {
      setCaptureBusy(false);
    }
  };

  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editForm, setEditForm] = useState({
    businessName: '',
    category: '',
    siteDescription: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const startEditing = (lead: Lead) => {
    setEditForm({
      businessName: lead.businessName,
      category: lead.category,
      siteDescription: lead.siteDescription || '',
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      notes: lead.notes,
    });
    setIsEditingSelected(true);
  };

  const saveEditing = (lead: Lead) => {
    const updatedBusinessName = editForm.businessName.trim() || lead.businessName;
    const patch: Partial<Lead> = {
      businessName: updatedBusinessName,
      category: editForm.category.trim(),
      siteDescription: editForm.siteDescription.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      address: editForm.address.trim(),
      notes: editForm.notes.trim(),
    };
    if (lead.project) {
      patch.project = {
        ...lead.project,
        previewText: getPreviewText({ ...lead, ...patch } as Lead),
        updatedAt: now(),
      };
    }
    updateLead(
      lead.id,
      patch,
      'Dados do lead revisados e atualizados manualmente pelo operador.'
    );
    setIsEditingSelected(false);
    setCaptureMessage('Dados atualizados com sucesso. Prossiga com a verificação.');
  };

  const sharePreview = async (
    lead: Lead,
    versionItem?: { templateId: string; templateName: string; version: number; createdAt?: string }
  ) => {
    if (!lead.project) return;
    if (lead.verificationStatus !== 'verified') {
      setCaptureError('Revise e marque os dados como verificados antes de gerar um link compartilhável.');
      return;
    }

    const templateId = versionItem?.templateId || lead.project.templateId;
    const templateName = versionItem?.templateName || lead.project.templateName;
    const projectVersion = versionItem?.version || lead.project.templateVersion;
    const generatedAt = versionItem?.createdAt || lead.project.updatedAt;

    const url = createShareablePreviewUrl({
      version: 1,
      businessName: lead.businessName,
      category: lead.category,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      websiteUrl: lead.websiteUrl,
      description:
        lead.siteDescription ||
        (lead.project ? lead.project.previewText.split('\n')[2] : '') ||
        (`Uma presença digital feita para apresentar os serviços de ${lead.businessName} com clareza e facilitar o contato com novos clientes.`),
      templateId,
      templateName,
      projectVersion,
      generatedAt,
    });
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCaptureMessage(`Link de prévia copiado (${templateName} · v${projectVersion}). O link é autossuficiente e abre em qualquer navegador.`);
    } catch {
      setCaptureMessage(`Link de prévia gerado (${templateName} · v${projectVersion}). Copie-o no campo exibido abaixo.`);
    }
  };

  const addActivity = (lead: Lead) => {
    if (!activityText.trim()) return;
    updateLead(lead.id, {}, activityText.trim());
    setActivityText('');
  };

  const changeTemplate = (lead: Lead, templateId: string) => {
    if (!lead.project || templateId === lead.project.templateId) return;
    const template = ALTERNATIVE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const version = lead.project.templateVersion + 1;
    const timestamp = now();
    const project: SiteProject = {
      ...lead.project,
      status: 'ready_for_review',
      templateId: template.id,
      templateName: template.name,
      templateVersion: version,
      versions: [...lead.project.versions, { templateId: template.id, templateName: template.name, version, createdAt: timestamp }],
      updatedAt: timestamp,
    };
    updateLead(lead.id, { project }, `Modelo alternativo selecionado após a primeira versão: ${template.name} (versão ${version}). Revisão interna necessária.`);
  };

  const inputClass = 'w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none';
  const labelClass = 'mb-1.5 block text-xs font-medium text-neutral-400';

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400"><Users className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wider">Prospecção</span></div>
          <h2 className="mt-2 text-2xl font-semibold text-neutral-100">Leads e sites personalizados</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">Gerencie a captação, revise os dados e prepare a primeira versão do site antes de oferecer outros modelos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800">
            <ExternalLink className="h-4 w-4" /> Importar CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const raw = String(reader.result ?? '').replace(/^\\uFEFF/, '');
                const lines = raw.split(/\\r?\\n/).filter((line) => line.trim());
                if (lines.length < 2) { setImportMessage('CSV sem linhas de dados.'); return; }
                const delimiter = (lines[0].match(/;/g) ?? []).length > (lines[0].match(/,/g) ?? []).length ? ';' : ',';
                const headers = parseCsvRow(lines[0], delimiter).map((header) => header.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[ _-]/g, ''));
                const getValue = (row: string[], ...names: string[]) => {
                  const index = headers.findIndex((header) => names.includes(header));
                  return index >= 0 ? (row[index] ?? '').trim() : '';
                };
                const imported: Lead[] = lines.slice(1).map((line): Lead | null => {
                  const row = parseCsvRow(line, delimiter);
                  const timestamp = now();
                  const businessName = getValue(row, 'businessname', 'nome', 'nomedonegocio', 'empresa', 'name');
                  if (!businessName) return null;
                  const sourceType = getValue(row, 'sourcetype', 'fonte') || 'Importação CSV';
                  return {
                    id: makeId(), businessName, category: getValue(row, 'category', 'categoria'),
                    websiteUrl: getValue(row, 'websiteurl', 'site', 'website'),
                    phone: getValue(row, 'phone', 'telefone', 'whatsapp'),
                    email: getValue(row, 'email', 'emailpublico'),
                    address: getValue(row, 'address', 'endereco', 'cidade'),
                    sourceUrl: getValue(row, 'sourceurl', 'urlfonte', 'fonteurl'),
                    sourceType, notes: getValue(row, 'notes', 'notas', 'observacoes'),
                    priority: 'normal', verificationStatus: 'unreviewed', status: 'new',
                    createdAt: timestamp, updatedAt: timestamp,
                    activities: [{ id: makeId(), summary: 'Lead importado por CSV; dados pendentes de revisão.', createdAt: timestamp }],
                  };
                }).filter((lead): lead is Lead => lead !== null);
                if (imported.length) {
                  const existing = new Set(leads.map((lead) => lead.businessName.trim().toLowerCase()));
                  const unique = imported.filter((lead) => { const key = lead.businessName.trim().toLowerCase(); if (existing.has(key)) return false; existing.add(key); return true; });
                  setLeads((current) => [...unique, ...current]);
                  setImportMessage(`${unique.length} lead(s) importado(s). ${imported.length - unique.length} duplicado(s) ignorado(s) por nome.`);
                  if (unique[0]) setSelectedId(unique[0].id);
                } else setImportMessage('Nenhum lead importado. Confira a coluna obrigatória businessName ou nome.');
              };
              reader.readAsText(file);
              event.target.value = '';
            }} />
          </label>
          <button onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400">
            <Plus className="h-4 w-4" /> Novo lead
          </button>
        </div>
      </div>

      {(captureError || captureMessage) && <div role="status" className={'rounded-lg border px-4 py-3 text-xs ' + (captureError ? 'border-red-500/30 bg-red-500/5 text-red-200' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200')}>{captureError || captureMessage}<button onClick={() => { setCaptureError(null); setCaptureMessage(null); }} className="ml-3 underline">Fechar</button></div>}
      {shareUrl && <div className="space-y-2 rounded-lg border border-emerald-500/30 bg-neutral-900 p-4"><label className="block text-xs font-medium text-neutral-300">Link compartilhável da prévia</label><input readOnly className={inputClass} value={shareUrl} onFocus={(event) => event.currentTarget.select()} /><div className="flex flex-wrap gap-2"><button onClick={() => { void navigator.clipboard.writeText(shareUrl).then(() => setCaptureMessage('Link copiado.')); }} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950">Copiar link</button><a href={shareUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-200">Abrir prévia</a></div><p className="text-xs text-neutral-500">O link contém apenas os dados usados na prévia. Não é um site publicado nem uma URL de domínio próprio.</p></div>}
      {importMessage && <div role="status" className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs text-neutral-200">{importMessage}<button onClick={() => setImportMessage(null)} className="ml-3 underline">Fechar</button></div>}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
        <Clock className="h-4 w-4 shrink-0" />
        <span><strong>Modo local provisório.</strong> Os leads continuam neste navegador. A captura automatizada usa /api/capture na Cloudflare Pages Function; sincronização e publicação ainda não estão conectadas.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total de leads', value: counts.total, icon: Users },
          { label: 'Novos', value: counts.new, icon: Plus },
          { label: 'Qualificados / site', value: counts.qualified, icon: Sparkles },
          { label: 'Propostas / interessados', value: counts.proposal, icon: Activity },
        ].map((item) => <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-400"><span>{item.label}</span><item.icon className="h-4 w-4" /></div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-neutral-100">{item.value}</div>
        </div>)}
      </div>

      {showCreate && <form onSubmit={createLead} className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex items-center justify-between"><h3 className="font-semibold text-neutral-100">Cadastrar lead</h3><span className="text-xs text-neutral-500">Cadastro manual / importação assistida</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label><span className={labelClass}>Nome do negócio *</span><input required className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Nome comercial" /></label>
          <label><span className={labelClass}>Categoria</span><input className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex.: restaurante" /></label>
          <label><span className={labelClass}>Site atual</span><div className="flex gap-2"><input type="url" className={inputClass} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://" /><button type="button" disabled={captureBusy || !form.websiteUrl.trim()} onClick={() => void captureWebsite(form.websiteUrl)} className="shrink-0 rounded-lg border border-emerald-500/40 px-3 text-xs font-medium text-emerald-300 disabled:opacity-40">{captureBusy ? 'Capturando…' : 'Capturar'}</button></div></label>
          <label><span className={labelClass}>Telefone público</span><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label><span className={labelClass}>E-mail público</span><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span className={labelClass}>Endereço / cidade</span><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
          <label><span className={labelClass}>Tipo de fonte</span><select className={inputClass} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Manual</option><option>Importação CSV</option><option>Diretório público</option><option>Site público</option><option>Indicação</option></select></label>
          <label><span className={labelClass}>URL da fonte</span><input type="url" className={inputClass} value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://" /></label>
          <label><span className={labelClass}>Prioridade</span><select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Lead['priority'] })}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option></select></label>
          <label className="sm:col-span-2 lg:col-span-3"><span className={labelClass}>Notas da prospecção</span><textarea rows={2} className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Oportunidade identificada, campos a confirmar..." /></label>
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300">Cancelar</button><button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950">Salvar lead</button></div>
      </form>}

      <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)]">
        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
          <div className="space-y-3 border-b border-neutral-800 p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" /><input className={inputClass + ' pl-9'} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar leads..." /></div>
            <select className={inputClass} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
              <option value="all">Todos os status</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="max-h-[620px] divide-y divide-neutral-800 overflow-y-auto">
            {filteredLeads.map((lead) => <button key={lead.id} onClick={() => setSelectedId(lead.id)} className={`block w-full p-4 text-left transition-colors hover:bg-neutral-800/60 ${selectedId === lead.id ? 'bg-neutral-800/70' : ''}`}>
              <div className="flex items-start justify-between gap-3"><span className="font-medium text-neutral-100">{lead.businessName}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLES[lead.status]}`}>{STATUS_LABELS[lead.status]}</span></div>
              <div className="mt-1 text-xs text-neutral-400">{lead.category || 'Categoria não informada'}{lead.address ? ` · ${lead.address}` : ''}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500"><span>{lead.sourceType || 'Fonte não informada'}</span><span>{new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span></div>
            </button>)}
            {filteredLeads.length === 0 && <div className="p-8 text-center"><Globe2 className="mx-auto h-7 w-7 text-neutral-600" /><p className="mt-3 text-sm font-medium text-neutral-300">{leads.length ? 'Nenhum lead corresponde aos filtros.' : 'Nenhum lead cadastrado.'}</p><p className="mt-1 text-xs text-neutral-500">{leads.length ? 'Altere a busca ou o status.' : 'Cadastre um lead real para iniciar. Não há dados fictícios misturados à operação.'}</p></div>}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border border-neutral-800 bg-neutral-900">
          {!selected ? <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><Users className="h-8 w-8 text-neutral-600" /><p className="mt-3 text-sm text-neutral-300">Selecione um lead para revisar seus dados e preparar a proposta.</p></div> : <div className="space-y-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs text-neutral-500">Ficha do lead</p><h3 className="mt-1 text-xl font-semibold text-neutral-100">{selected.businessName}</h3><p className="mt-1 text-sm text-neutral-400">{selected.category || 'Categoria não informada'}</p></div>
              <select aria-label="Status do lead" className={inputClass + ' sm:max-w-52'} value={selected.status} onChange={(e) => updateLead(selected.id, { status: e.target.value as LeadStatus }, `Status alterado para ${STATUS_LABELS[e.target.value as LeadStatus]}.`)}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-neutral-950 p-3"><p className={labelClass}>Telefone</p><p className="break-words text-sm text-neutral-200">{selected.phone || 'Não informado'}</p></div>
              <div className="rounded-lg bg-neutral-950 p-3"><p className={labelClass}>E-mail</p><p className="break-words text-sm text-neutral-200">{selected.email || 'Não informado'}</p></div>
              <div className="rounded-lg bg-neutral-950 p-3"><p className={labelClass}>Endereço</p><p className="break-words text-sm text-neutral-200">{selected.address || 'Não informado'}</p></div>
              <div className="rounded-lg bg-neutral-950 p-3"><p className={labelClass}>Verificação</p><select className={inputClass} value={selected.verificationStatus} onChange={(e) => updateLead(selected.id, { verificationStatus: e.target.value as VerificationStatus }, `Verificação alterada para ${e.target.value}.`)}><option value="unreviewed">Não revisado</option><option value="in_review">Em revisão</option><option value="verified">Verificado</option><option value="needs_correction">Precisa de correção</option></select></div>
            </div>
            <div className="space-y-2 text-sm">
              {selected.websiteUrl && <div className="space-y-2"><p className="break-all text-neutral-300"><ExternalLink className="mr-2 inline h-3.5 w-3.5" /><a className="text-emerald-300 underline" href={selected.websiteUrl} target="_blank" rel="noreferrer">{selected.websiteUrl}</a></p><button disabled={captureBusy} onClick={() => void captureWebsite(selected.websiteUrl, selected)} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-300 disabled:opacity-40">{captureBusy ? 'Capturando metadados…' : 'Capturar / atualizar dados do site'}</button></div>}
              <p className="break-all text-xs text-neutral-500">Fonte: {selected.sourceUrl || selected.sourceType || 'Não informada'}</p>
              {selected.notes && <p className="rounded-lg bg-neutral-950 p-3 text-sm text-neutral-300">{selected.notes}</p>}
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-neutral-100">Site personalizado</h4><p className="mt-1 text-xs text-neutral-500">A primeira versão usa o modelo neutro. Nenhum site é publicado automaticamente.</p></div>
                {!selected.project && <button disabled={selected.verificationStatus !== 'verified'} onClick={() => prepareSite(selected)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"><FilePlus2 className="h-4 w-4" /> Preparar primeira versão</button>}
              </div>
              {selected.verificationStatus !== 'verified' && !selected.project && <p className="mt-2 text-xs text-amber-300">Revise os dados e marque-os como verificados para preparar a primeira versão.</p>}
              {selected.project && <div className="mt-4 space-y-3 rounded-lg border border-neutral-700 bg-neutral-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-xs text-emerald-300"><Check className="h-4 w-4" /> Primeira versão preparada para revisão</span><span className="text-xs text-neutral-500">Versão {selected.project.templateVersion}</span></div>
                <p className="text-sm font-medium text-neutral-100">Modelo: {selected.project.templateName}</p>
                <div className={`overflow-hidden rounded-xl border ${selected.project.templateId === 'bold' ? 'border-emerald-500/50 bg-neutral-900' : selected.project.templateId === 'editorial' ? 'border-neutral-600 bg-stone-100' : selected.project.templateId === 'minimal' ? 'border-neutral-700 bg-white' : 'border-sky-500/30 bg-slate-950'}`}>
                  <div className={`px-5 py-3 text-xs ${selected.project.templateId === 'editorial' || selected.project.templateId === 'minimal' ? 'text-neutral-600' : 'text-neutral-400'}`}>{selected.businessName}</div>
                  <div className={`px-6 py-10 sm:px-10 sm:py-14 ${selected.project.templateId === 'editorial' ? 'bg-stone-100 text-stone-900 font-serif' : selected.project.templateId === 'minimal' ? 'bg-white text-neutral-900' : selected.project.templateId === 'bold' ? 'bg-neutral-900 text-white' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${selected.project.templateId === 'editorial' || selected.project.templateId === 'minimal' ? 'text-emerald-700' : 'text-emerald-300'}`}>{selected.category || 'Atendimento especializado'}</p>
                    <h5 className="mt-4 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">{selected.businessName}</h5>
                    <p className={`mt-4 max-w-lg text-sm leading-6 ${selected.project.templateId === 'editorial' || selected.project.templateId === 'minimal' ? 'text-neutral-600' : 'text-neutral-300'}`}>Uma presença digital feita para apresentar os serviços de {selected.businessName} com clareza e facilitar o contato com novos clientes.</p>
                    <div className="mt-7 inline-flex rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950">Entre em contato</div>
                    <div className={`mt-8 border-t pt-4 text-xs ${selected.project.templateId === 'editorial' || selected.project.templateId === 'minimal' ? 'border-neutral-300 text-neutral-600' : 'border-white/15 text-neutral-400'}`}>{selected.address || 'Endereço a confirmar'}{selected.phone ? ` · ${selected.phone}` : ''}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-neutral-500">Prévia interativa para revisão. O link compartilhável abre a versão embutida no navegador de quem o recebe.</p><button onClick={() => void sharePreview(selected)} disabled={selected.verificationStatus !== 'verified'} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40">Gerar link compartilhável</button></div>
                <label className="block"><span className={labelClass}>Após a primeira versão, escolher outro modelo</span><select className={inputClass} value={selected.project.templateId} onChange={(e) => changeTemplate(selected, e.target.value)}><option value={INITIAL_TEMPLATE.id}>{INITIAL_TEMPLATE.name} (original)</option>{ALTERNATIVE_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
                <div className="space-y-2 border-t border-neutral-800 pt-3"><p className="text-xs font-semibold text-neutral-400">Histórico de versões</p>{[...selected.project.versions].reverse().map((version) => <div key={`${version.templateId}-${version.version}`} className="flex items-center justify-between gap-3 text-xs"><span className="text-neutral-300">v{version.version} · {version.templateName}</span><span className="text-neutral-500">{new Date(version.createdAt).toLocaleString('pt-BR')}</span></div>)}</div>
              </div>}
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <h4 className="font-semibold text-neutral-100">Histórico de acompanhamento</h4>
              <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); addActivity(selected); }}><input className={inputClass} value={activityText} onChange={(e) => setActivityText(e.target.value)} placeholder="Registrar contato, resposta ou próximo passo..." /><button type="submit" className="rounded-lg border border-neutral-700 px-3 text-sm text-neutral-200 hover:bg-neutral-800">Registrar</button></form>
              <div className="mt-3 space-y-2">{selected.activities.map((activity) => <div key={activity.id} className="rounded-lg bg-neutral-950 p-3"><p className="text-sm text-neutral-300">{activity.summary}</p><p className="mt-1 text-[11px] text-neutral-500">{new Date(activity.createdAt).toLocaleString('pt-BR')}</p></div>)}</div>
            </div>
          </div>}
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs text-neutral-500"><ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" /><p>A captura automatizada depende da Cloudflare Pages Function /api/capture estar implantada. Links de prévia são autossuficientes e compartilháveis, mas não são sites publicados nem registros persistidos no servidor.</p></div>
    </section>
  );
};
