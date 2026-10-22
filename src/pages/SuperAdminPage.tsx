import React, { useState } from 'react';
import { LeadsDashboard } from './LeadsDashboard';
import {
  Establishment,
  EstablishmentTheme,
  EstablishmentStatus,
  SuperAdminTab,
  AuditLogEntry,
} from '../types';
import { useStore } from '../data/store';
import {
  ShieldCheck,
  Building2,
  Plus,
  Users,
  Activity,
  Settings,
  Lock,
  LogOut,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Instagram,
  MapPin,
  Palette,
  ArrowRight,
  Download,
  KeyRound,
} from 'lucide-react';

export interface SuperAdminPageProps {
  onBackToApp?: () => void;
  onEnterEstablishmentAdmin?: (establishmentId: string) => void;
  initialTab?: SuperAdminTab;
  onTabChange?: (tab: SuperAdminTab) => void;
  autoAuthenticated?: boolean;
  embeddedInUnifiedAdmin?: boolean;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({
  onBackToApp,
  onEnterEstablishmentAdmin,
  initialTab = 'overview',
  onTabChange,
  autoAuthenticated = false,
  embeddedInUnifiedAdmin = false,
}) => {
  const {
    allEstablishments,
    session,
    auditLogs,
    platformMetrics,
    platformConfig,
    store,
  } = useStore();

  const isSuperAdmin =
    Boolean(autoAuthenticated) ||
    Boolean(embeddedInUnifiedAdmin) ||
    session?.role === 'super_admin';

  // Login PIN state
  const [masterPinInput, setMasterPinInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<SuperAdminTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Edit Establishment Modal
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notification Toast
  const [notification, setNotification] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Form state for creating a new establishment
  const [newEstForm, setNewEstForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    theme: 'amber' as EstablishmentTheme,
    primaryColor: '#f59e0b',
    logoUrl: '/logo.jpg',
    coverUrl: '',
    whatsapp: '+55 92 98888-0000',
    whatsappClean: '',
    phone: '',
    address: '',
    cityState: '',
    instagramHandle: '',
    instagramUrl: '',
    adminName: 'Administrador Local',
    adminEmail: '',
    adminPin: '1234',
    status: 'active' as EstablishmentStatus,
  });

  // Settings State
  const [currentMasterPin, setCurrentMasterPin] = useState('');
  const [newMasterPin, setNewMasterPin] = useState('');
  const [confirmMasterPin, setConfirmMasterPin] = useState('');
  const [platformNameInput, setPlatformNameInput] = useState(platformConfig.platformName);

  // Handle Master Login
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = store.loginSuperAdmin(masterPinInput);
    if (result.success) {
      setLoginError(null);
      setMasterPinInput('');
      showToast('Bem-vindo ao Painel Master da Plataforma!');
    } else {
      setLoginError(result.message || 'Chave Mestre inválida.');
    }
  };

  const handleLogout = () => {
    store.logout();
    setMasterPinInput('');
  };

  const handleCreateEstablishment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstForm.name.trim()) {
      showToast('O nome do estabelecimento é obrigatório.');
      return;
    }

    try {
      const created = store.addEstablishment({
        ...newEstForm,
        allowOnlineBooking: true,
        slotIntervalMinutes: 45,
      });

      showToast(`Estabelecimento "${created.name}" cadastrado com sucesso!`);
      setActiveTab('establishments');

      // Reset Form
      setNewEstForm({
        name: '',
        slug: '',
        tagline: '',
        theme: 'amber',
        primaryColor: '#f59e0b',
        logoUrl: '/logo.jpg',
        coverUrl: '',
        whatsapp: '+55 92 98888-0000',
        whatsappClean: '',
        phone: '',
        address: '',
        cityState: '',
        instagramHandle: '',
        instagramUrl: '',
        adminName: 'Administrador Local',
        adminEmail: '',
        adminPin: '1234',
        status: 'active',
      });
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar estabelecimento.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEstablishment) return;

    store.updateEstablishment(editingEstablishment.id, editingEstablishment);
    setIsEditModalOpen(false);
    setEditingEstablishment(null);
    showToast('Estabelecimento atualizado com sucesso!');
  };

  const handleToggleStatus = (id: string, name: string) => {
    store.toggleEstablishmentStatus(id);
    showToast(`Status do estabelecimento "${name}" alterado.`);
  };

  const handleDeleteEstablishment = (id: string, name: string) => {
    if (window.confirm(`Tem certeza de que deseja excluir o estabelecimento "${name}" e todos os seus dados? Esta ação é irreversível!`)) {
      const success = store.deleteEstablishment(id);
      if (success) {
        showToast(`Estabelecimento "${name}" excluído.`);
      } else {
        showToast('Não é possível excluir o estabelecimento padrão da plataforma.');
      }
    }
  };

  const handleEnterAsEstablishment = (estId: string) => {
    const success = store.superAdminEnterEstablishment(estId);
    if (success) {
      if (onEnterEstablishmentAdmin) {
        onEnterEstablishmentAdmin(estId);
      }
    }
  };

  const handleChangeMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMasterPin !== platformConfig.masterPin) {
      showToast('PIN Master atual incorreto.');
      return;
    }
    if (newMasterPin.length < 4) {
      showToast('O novo PIN Master deve ter no mínimo 4 caracteres.');
      return;
    }
    if (newMasterPin !== confirmMasterPin) {
      showToast('A confirmação do novo PIN não confere.');
      return;
    }

    store.updatePlatformConfig({
      masterPin: newMasterPin,
      platformName: platformNameInput,
    });
    setCurrentMasterPin('');
    setNewMasterPin('');
    setConfirmMasterPin('');
    showToast('Configurações da Plataforma e PIN Master atualizados com sucesso!');
  };

  const handleExportAuditLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Logs de auditoria exportados.');
  };

  // If not logged in as Super Admin, show Master Login Gate
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-neutral-100">
              Administração Geral
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Plataforma White Label Multiestabelecimento
            </p>
          </div>

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={12}
                value={masterPinInput}
                onChange={(e) => {
                  setMasterPinInput(e.target.value);
                  setLoginError(null);
                }}
                placeholder="Digite a Chave Mestre (PIN)"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-700 text-center text-xl tracking-widest text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />
              {loginError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Acessar Painel Master
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 flex flex-col gap-2">
            <span>
              Chave Mestre padrão inicial: <strong className="text-neutral-300">9988</strong>
            </span>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Voltar para o site do estabelecimento
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filter establishments
  const filteredEstablishments = allEstablishments.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.address && e.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && e.status === 'active') ||
      (statusFilter === 'inactive' && e.status !== 'active');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-5 z-50 bg-amber-500 text-neutral-950 px-4 py-3 rounded-xl font-semibold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-neutral-100">
                {platformConfig.platformName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Painel Geral de Controle da Rede White Label Multiestabelecimento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-950/80 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ver Site Público</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!embeddedInUnifiedAdmin && (
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('overview');
              if (onTabChange) onTabChange('overview');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Visão Geral & Métricas</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('establishments');
              if (onTabChange) onTabChange('establishments');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'establishments'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Estabelecimentos ({allEstablishments.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('new-establishment');
              if (onTabChange) onTabChange('new-establishment');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'new-establishment'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('administrators');
              if (onTabChange) onTabChange('administrators');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'administrators'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Administradores Vinculados</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('audit-logs');
              if (onTabChange) onTabChange('audit-logs');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit-logs'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Auditoria & Segurança</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('leads');
              if (onTabChange) onTabChange('leads');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-emerald-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Prospecção de Leads</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              if (onTabChange) onTabChange('settings');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações Globais</span>
          </button>
        </div>
      )}

      {activeTab === 'leads' && <LeadsDashboard />}

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Total de Estabelecimentos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-neutral-100 font-display">
                  {platformMetrics.totalEstablishments}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {platformMetrics.activeEstablishments} ativos
                </span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Serviços no Catálogo Geral
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-neutral-100 font-display">
                  {platformMetrics.totalServices}
                </span>
                <span className="text-xs text-neutral-400">na plataforma</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Produtos Disponíveis
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-neutral-100 font-display">
                  {platformMetrics.totalProducts}
                </span>
                <span className="text-xs text-neutral-400">itens cadastrados</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Agendamentos Realizados
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-400 font-display">
                  {platformMetrics.totalAppointments}
                </span>
                <span className="text-xs font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {platformMetrics.confirmedAppointments} confirmados
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Establishments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span>Estabelecimentos Registrados</span>
                </h3>
                <button
                  onClick={() => setActiveTab('new-establishment')}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo</span>
                </button>
              </div>

              <div className="divide-y divide-neutral-800">
                {allEstablishments.map((est) => (
                  <div
                    key={est.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-700 shrink-0 flex items-center justify-center">
                        <img
                          src={est.logoUrl || '/logo.jpg'}
                          alt={est.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-neutral-100">
                            {est.name}
                          </span>
                          {est.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Modelo inicial
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              est.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {est.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          slug: /{est.slug} • {est.cityState} • WhatsApp: {est.whatsapp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEnterAsEstablishment(est.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Acessar painel deste estabelecimento"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Acessar Painel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Activities */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>Auditoria Recente</span>
                </h3>
                <button
                  onClick={() => setActiveTab('audit-logs')}
                  className="text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
                >
                  Ver todos
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-neutral-300">
                        {log.action}
                      </span>
                      <span className="text-neutral-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-400 line-clamp-2">
                      {log.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESTABLISHMENTS LIST */}
      {activeTab === 'establishments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome, slug ou cidade..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Somente Ativos</option>
                <option value="inactive">Somente Inativos</option>
              </select>

              <button
                onClick={() => setActiveTab('new-establishment')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Estabelecimento</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEstablishments.map((est) => {
              const servicesCount = store.getServices(est.id).length;
              const productsCount = store.getProducts(est.id).length;
              const apptsCount = store.getAppointments(est.id).length;

              return (
                <div
                  key={est.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 hover:border-neutral-700 transition-all shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-neutral-950 border border-amber-500/30 shrink-0 flex items-center justify-center shadow-md">
                          <img
                            src={est.logoUrl || '/logo.jpg'}
                            alt={est.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-neutral-100">
                              {est.name}
                            </h3>
                            {est.isDefault && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Estabelecimento principal
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-amber-400 font-mono">
                            /{est.slug}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(est.id, est.name)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                          est.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                        title="Clique para alternar status"
                      >
                        {est.status === 'active' ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-800 text-center">
                      <div className="p-2 rounded-xl bg-neutral-950/60">
                        <span className="block text-lg font-bold text-neutral-100 font-display">
                          {servicesCount}
                        </span>
                        <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">
                          Serviços
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-neutral-950/60">
                        <span className="block text-lg font-bold text-neutral-100 font-display">
                          {productsCount}
                        </span>
                        <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">
                          Produtos
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-neutral-950/60">
                        <span className="block text-lg font-bold text-neutral-100 font-display">
                          {apptsCount}
                        </span>
                        <span className="block text-[10px] text-neutral-400 uppercase tracking-wider">
                          Agendas
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-neutral-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        <span className="truncate">{est.address} • {est.cityState}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        <span>{est.whatsapp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                        <span>PIN Local: <strong className="text-neutral-200 font-mono tracking-widest">{est.adminPin}</strong> ({est.adminName || 'Admin'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEnterAsEstablishment(est.id)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Entrar no Estabelecimento</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEstablishment(est);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar Dados do Estabelecimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!est.isDefault && (
                        <button
                          onClick={() => handleDeleteEstablishment(est.id, est.name)}
                          className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
                          title="Excluir Estabelecimento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTER NEW ESTABLISHMENT */}
      {activeTab === 'new-establishment' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto shadow-xl">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-xl font-bold font-display text-neutral-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Cadastrar Novo Estabelecimento</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Crie uma nova filial ou parceiro na plataforma com identidade visual própria, catálogo e administrador isolado.
            </p>
          </div>

          <form onSubmit={handleCreateEstablishment} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  value={newEstForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = name
                      .toLowerCase()
                      .trim()
                      .replace(/[^\w\s-]/g, '')
                      .replace(/[\s_-]+/g, '-');
                    setNewEstForm({ ...newEstForm, name, slug: autoSlug });
                  }}
                  placeholder="Ex: Barbearia Imperial VIP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Slug da URL (ex: /imperial-vip)
                </label>
                <input
                  type="text"
                  required
                  value={newEstForm.slug}
                  onChange={(e) => setNewEstForm({ ...newEstForm, slug: e.target.value })}
                  placeholder="imperial-vip"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Subtítulo / Especialidade
                </label>
                <input
                  type="text"
                  value={newEstForm.tagline}
                  onChange={(e) => setNewEstForm({ ...newEstForm, tagline: e.target.value })}
                  placeholder="Ex: Estilo & Visagismo Masculino • Ponta Negra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  WhatsApp com DDD *
                </label>
                <input
                  type="text"
                  required
                  value={newEstForm.whatsapp}
                  onChange={(e) => {
                    const val = e.target.value;
                    const clean = val.replace(/\D/g, '');
                    setNewEstForm({ ...newEstForm, whatsapp: val, whatsappClean: clean });
                  }}
                  placeholder="+55 92 98888-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Telefone Alternativo
                </label>
                <input
                  type="text"
                  value={newEstForm.phone}
                  onChange={(e) => setNewEstForm({ ...newEstForm, phone: e.target.value })}
                  placeholder="(92) 3344-5566"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={newEstForm.address}
                  onChange={(e) => setNewEstForm({ ...newEstForm, address: e.target.value })}
                  placeholder="Av. Exemplo, 100 — Bairro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Cidade — Estado
                </label>
                <input
                  type="text"
                  value={newEstForm.cityState}
                  onChange={(e) => setNewEstForm({ ...newEstForm, cityState: e.target.value })}
                  placeholder="Cidade e estado"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Tema & Cor Primária
                </label>
                <select
                  value={newEstForm.theme}
                  onChange={(e) => {
                    const theme = e.target.value as EstablishmentTheme;
                    const colors: Record<EstablishmentTheme, string> = {
                      amber: '#f59e0b',
                      emerald: '#10b981',
                      sapphire: '#3b82f6',
                      ruby: '#ef4444',
                      slate: '#94a3b8',
                    };
                    setNewEstForm({
                      ...newEstForm,
                      theme,
                      primaryColor: colors[theme] || '#f59e0b',
                    });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="amber">Âmbar Dourado (Padrão)</option>
                  <option value="emerald">Verde Esmeralda</option>
                  <option value="sapphire">Azul Safira</option>
                  <option value="ruby">Vermelho Rubi</option>
                  <option value="slate">Prata Minimalista</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  URL do Logotipo
                </label>
                <input
                  type="text"
                  value={newEstForm.logoUrl}
                  onChange={(e) => setNewEstForm({ ...newEstForm, logoUrl: e.target.value })}
                  placeholder="/logo.jpg ou URL de imagem"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Perfil no Instagram
                </label>
                <input
                  type="text"
                  value={newEstForm.instagramHandle}
                  onChange={(e) => {
                    const handle = e.target.value;
                    const cleanHandle = handle.replace('@', '');
                    setNewEstForm({
                      ...newEstForm,
                      instagramHandle: handle.startsWith('@') ? handle : `@${handle}`,
                      instagramUrl: `https://www.instagram.com/${cleanHandle}/`,
                    });
                  }}
                  placeholder="@barbearia_exemplo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Administrador Local do Estabelecimento */}
            <div className="pt-4 border-t border-neutral-800 space-y-4">
              <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Credenciais do Administrador Local</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    value={newEstForm.adminName}
                    onChange={(e) => setNewEstForm({ ...newEstForm, adminName: e.target.value })}
                    placeholder="Gerente Fulano"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    E-mail do Administrador
                  </label>
                  <input
                    type="email"
                    value={newEstForm.adminEmail}
                    onChange={(e) => setNewEstForm({ ...newEstForm, adminEmail: e.target.value })}
                    placeholder="gerente@estabelecimento.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    PIN de Acesso Local (4-8 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={newEstForm.adminPin}
                    onChange={(e) => setNewEstForm({ ...newEstForm, adminPin: e.target.value })}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveTab('establishments')}
                className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Concluir Cadastro
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ADMINISTRATORS MANAGEMENT */}
      {activeTab === 'administrators' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-display text-neutral-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Administradores Vinculados aos Estabelecimentos</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Consulte e altere credenciais dos administradores de cada unidade da rede.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Estabelecimento</th>
                  <th className="py-3 px-4">Administrador</th>
                  <th className="py-3 px-4">E-mail de Contato</th>
                  <th className="py-3 px-4">PIN Local</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {allEstablishments.map((est) => (
                  <tr key={est.id} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-neutral-200">
                      {est.name}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300">
                      {est.adminName || 'Admin Designado'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">
                      {est.adminEmail || 'Não informado'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 font-bold tracking-widest">
                      {est.adminPin}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          est.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {est.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const newPin = prompt(
                            `Digite o novo PIN para o administrador de "${est.name}":`,
                            est.adminPin
                          );
                          if (newPin && newPin.trim().length >= 4) {
                            store.updateEstablishment(est.id, { adminPin: newPin.trim() });
                            showToast(`PIN de ${est.name} alterado com sucesso.`);
                          } else if (newPin) {
                            alert('O PIN deve ter no mínimo 4 dígitos.');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-amber-400 hover:border-amber-500/40 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Alterar PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit-logs' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-neutral-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-display text-neutral-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Registro de Auditoria da Plataforma</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Todas as ações administrativas, alterações estruturais e tentativas de login são registradas de forma rastreável.
              </p>
            </div>

            <button
              onClick={handleExportAuditLogs}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar JSON</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider text-[10px] border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Ator</th>
                  <th className="py-3 px-4">Alvo</th>
                  <th className="py-3 px-4">Detalhes</th>
                  <th className="py-3 px-4">Gravidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-950/40 transition-colors">
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-3 px-4 text-neutral-400">
                      {log.targetEstablishmentName || 'Plataforma Global'}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {log.details}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.severity === 'security'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {log.severity || 'info'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: GLOBAL SETTINGS & MASTER PIN */}
      {activeTab === 'settings' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-xl">
          <div className="border-b border-neutral-800 pb-4">
            <h2 className="text-xl font-bold font-display text-neutral-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Configurações Globais da Plataforma</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Altere o nome da rede e a Chave Mestre de Administrador Geral.
            </p>
          </div>

          <form onSubmit={handleChangeMasterPin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Nome da Rede White Label
              </label>
              <input
                type="text"
                required
                value={platformNameInput}
                onChange={(e) => setPlatformNameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-3 border-t border-neutral-800 space-y-4">
              <h4 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Alterar Chave Mestre (Super Admin PIN)</span>
              </h4>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Chave Mestre Atual *
                </label>
                <input
                  type="password"
                  required
                  value={currentMasterPin}
                  onChange={(e) => setCurrentMasterPin(e.target.value)}
                  placeholder="Digite a Chave Mestre atual"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Nova Chave Mestre *
                </label>
                <input
                  type="password"
                  required
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value)}
                  placeholder="Mínimo 4 dígitos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Confirmar Nova Chave Mestre *
                </label>
                <input
                  type="password"
                  required
                  value={confirmMasterPin}
                  onChange={(e) => setConfirmMasterPin(e.target.value)}
                  placeholder="Repita a nova Chave Mestre"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT ESTABLISHMENT MODAL */}
      {isEditModalOpen && editingEstablishment && (
        <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Editar Estabelecimento: {editingEstablishment.name}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEstablishment(null);
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Nome Comercial
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEstablishment.name}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, name: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Slug da URL
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEstablishment.slug}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Subtítulo / Especialidade
                  </label>
                  <input
                    type="text"
                    value={editingEstablishment.tagline || ''}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, tagline: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingEstablishment.whatsapp}
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = val.replace(/\D/g, '');
                      setEditingEstablishment({
                        ...editingEstablishment,
                        whatsapp: val,
                        whatsappClean: clean,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    PIN Local de Acesso
                  </label>
                  <input
                    type="text"
                    value={editingEstablishment.adminPin}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, adminPin: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-mono tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={editingEstablishment.address}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, address: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Cidade — Estado
                  </label>
                  <input
                    type="text"
                    value={editingEstablishment.cityState}
                    onChange={(e) =>
                      setEditingEstablishment({ ...editingEstablishment, cityState: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tema Visual
                  </label>
                  <select
                    value={editingEstablishment.theme || 'amber'}
                    onChange={(e) =>
                      setEditingEstablishment({
                        ...editingEstablishment,
                        theme: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="amber">Âmbar Dourado</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="sapphire">Azul Safira</option>
                    <option value="ruby">Vermelho Rubi</option>
                    <option value="slate">Prata Minimalista</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEstablishment(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-neutral-700 text-neutral-300 text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
