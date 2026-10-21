import React, { useEffect, useState } from 'react';
import { Building2, Globe, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProspectingConsole } from './ProspectingConsole';

type Salon = { id: string; name: string; slug: string; status: string; billing_status: string; created_at: string };

export function PlatformAdminDashboard() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [projects, setProjects] = useState(0);
  const [prospects, setProspects] = useState(0);

  const load = async () => {
    if (!supabase) { setError('Conexão com a plataforma não configurada.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { window.location.replace('/plataforma/login'); return; }
      setEmail(user.email ?? '');
      const { data: admin, error: adminError } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (adminError || !admin) { setUnauthorized(true); return; }
      const [s, p, l] = await Promise.all([
        supabase.from('establishments').select('id,name,slug,status,billing_status,created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('site_projects').select('id', { count: 'exact', head: true }),
        supabase.from('prospects').select('id', { count: 'exact', head: true }),
      ]);
      if (s.error) throw s.error;
      setSalons((s.data ?? []) as Salon[]);
      setProjects(p.error ? 0 : p.count ?? 0);
      setProspects(l.error ? 0 : l.count ?? 0);
      if (p.error || l.error) setError('Alguns indicadores não puderam ser carregados. A lista de salões está disponível.');
    } catch {
      setError('Não foi possível carregar os dados administrativos. Tente atualizar a página.');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const logout = async () => { await supabase?.auth.signOut(); window.location.replace('/plataforma/login'); };

  if (unauthorized) return <main className="grid min-h-screen place-items-center bg-neutral-950 px-4 text-neutral-100"><section className="max-w-md rounded-2xl border border-neutral-800 p-6 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-amber-400" /><h1 className="text-xl font-semibold">Acesso exclusivo do administrador geral</h1><p className="mt-2 text-sm text-neutral-400">Esta conta não possui a função de administrador geral.</p><a className="mt-5 inline-block text-sm text-amber-300 underline" href="/plataforma/login">Voltar ao acesso</a></section></main>;

  return <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-6"><div className="mx-auto max-w-6xl">
    <header className="flex flex-col gap-4 border-b border-neutral-800 pb-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-amber-400/10 p-3 text-amber-300"><ShieldCheck className="h-6 w-6" /></div><div><p className="text-xs uppercase tracking-wider text-neutral-500">Plataforma de sites personalizados</p><h1 className="text-2xl font-semibold">Administração geral</h1><p className="mt-1 text-sm text-neutral-400">Conta administrativa: {email}</p></div></div><div className="flex items-center gap-2"><a href="/plataforma/prospeccao" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-900/30 transition"><Users className="h-4 w-4" /> Prospecção & CRM</a><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900 disabled:opacity-50"><RefreshCw className="h-4 w-4" /> Atualizar</button><button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"><LogOut className="h-4 w-4" /> Sair</button></div></header>
    {error && <p role="status" className="mt-5 rounded-lg border border-amber-900/70 bg-amber-950/30 p-3 text-sm text-amber-200">{error}</p>}
    <section className="mt-7 grid gap-4 sm:grid-cols-3">
      <article className="rounded-xl border border-neutral-800 p-5"><div className="flex items-center gap-2 text-sm text-neutral-400"><Building2 className="h-4 w-4" /> Salões cadastrados</div><p className="mt-3 text-3xl font-semibold">{loading ? '—' : salons.length}</p></article>
      <article className="rounded-xl border border-neutral-800 p-5"><div className="flex items-center gap-2 text-sm text-neutral-400"><Globe className="h-4 w-4" /> Sites / projetos</div><p className="mt-3 text-3xl font-semibold">{loading ? '—' : projects}</p></article>
      <article className="rounded-xl border border-neutral-800 p-5"><div className="flex items-center gap-2 text-sm text-neutral-400"><Users className="h-4 w-4" /> Prospecções</div><p className="mt-3 text-3xl font-semibold">{loading ? '—' : prospects}</p></article>
    </section>
    <section className="mt-8"><div className="mb-4"><h2 className="text-lg font-semibold">Salões e estabelecimentos</h2><p className="mt-1 text-sm text-neutral-400">Contas cadastradas, situação do site e situação da cobrança.</p></div><div className="overflow-x-auto rounded-xl border border-neutral-800"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3 font-medium">Salão</th><th className="px-4 py-3 font-medium">Identificador do site</th><th className="px-4 py-3 font-medium">Site</th><th className="px-4 py-3 font-medium">Cobrança</th></tr></thead><tbody className="divide-y divide-neutral-800">{loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Carregando salões...</td></tr> : salons.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Nenhum salão cadastrado.</td></tr> : salons.map(s => <tr key={s.id} className="text-neutral-300"><td className="px-4 py-3 font-medium text-neutral-100">{s.name}</td><td className="px-4 py-3 text-neutral-400">/{s.slug}</td><td className="px-4 py-3">{s.status}</td><td className="px-4 py-3">{s.billing_status || 'pendente'}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs text-neutral-500">Visão geral da plataforma. A edição e a publicação dos sites serão feitas na área de gestão de cada salão.</p></section>
    <section className="mt-10 border-t border-neutral-800 pt-8">
      <ProspectingConsole />
    </section>
    <footer className="mt-8 border-t border-neutral-800 pt-5"><a href="/" className="text-sm text-neutral-400 hover:text-white">Voltar ao site público</a></footer>
  </div></main>;
}
