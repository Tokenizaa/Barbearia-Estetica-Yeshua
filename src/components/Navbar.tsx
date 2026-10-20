import React, { useState } from 'react';
import { PageView, Establishment } from '../types';
import { useStore } from '../data/store';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Scissors,
  Sparkles,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Images,
  Phone,
  Calendar,
  Building2,
  ChevronDown,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
}) => {
  const { establishment, company, allEstablishments, session, store } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const navItems: { label: string; page: PageView; icon: React.ReactNode }[] = [
    { label: 'Início', page: 'home', icon: null },
    { label: 'Serviços', page: 'servicos', icon: <Scissors className="w-4 h-4 text-amber-400" /> },
    { label: 'Agendar', page: 'agendamento', icon: <Calendar className="w-4 h-4 text-amber-400" /> },
    { label: 'Produtos', page: 'produtos', icon: <ShoppingBag className="w-4 h-4 text-amber-400" /> },
    { label: 'Galeria', page: 'galeria', icon: <Images className="w-4 h-4 text-amber-400" /> },
    { label: 'Contato', page: 'contato', icon: <Phone className="w-4 h-4 text-amber-400" /> },
  ];

  const handleNavClick = (page: PageView) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectEstablishment = (est: Establishment) => {
    store.selectEstablishment(est.id);
    setIsSwitcherOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-amber-500/40 group-hover:border-amber-400 transition-colors shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={establishment.logoUrl || '/logo.jpg'}
                  alt={establishment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="block font-display text-base sm:text-lg font-bold tracking-wider text-neutral-100 uppercase group-hover:text-amber-200 transition-colors truncate max-w-[160px] sm:max-w-xs">
                  {establishment.name}
                </span>
                <span className="block text-[10px] sm:text-[11px] uppercase tracking-widest text-amber-400/90 font-medium truncate max-w-[160px] sm:max-w-xs">
                  {establishment.tagline || establishment.cityState}
                </span>
              </div>
            </button>

            {/* Establishment Switcher Trigger */}
            {allEstablishments.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium transition-colors cursor-pointer"
                  title="Trocar de Unidade / Estabelecimento"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate max-w-[100px]">{establishment.slug}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* Switcher Dropdown */}
                {isSwitcherOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <span className="block px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 border-b border-neutral-800/80 mb-1">
                      Selecionar Estabelecimento
                    </span>
                    <div className="space-y-1">
                      {allEstablishments.map((est) => {
                        const isSelected = est.id === establishment.id;
                        return (
                          <button
                            key={est.id}
                            onClick={() => handleSelectEstablishment(est)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                                : 'text-neutral-300 hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-6 h-6 rounded-md overflow-hidden bg-neutral-950 shrink-0">
                                <img
                                  src={est.logoUrl || '/logo.jpg'}
                                  alt={est.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="truncate">{est.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30 shadow-xs'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <PWAInstallButton variant="navbar" />

            {/* Local Admin */}
            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentPage === 'admin'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700 bg-neutral-900/50'
              }`}
              title="Área Administrativa do Estabelecimento"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400/80" />
              <span className="hidden lg:inline">Admin</span>
            </button>

            {/* Super Admin Direct Link */}
            <button
              onClick={() => handleNavClick('super-admin')}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                currentPage === 'super-admin'
                  ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                  : 'text-neutral-400 border-neutral-800 hover:text-amber-400 hover:border-neutral-700 bg-neutral-900/50'
              }`}
              title="Painel Geral da Plataforma White Label"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-[11px]">Rede WL</span>
            </button>

            <button
              onClick={() => handleNavClick('agendamento')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-xs lg:text-sm shadow-md hover:shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-neutral-950" />
              <span>Agendar</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-1.5">
            <PWAInstallButton variant="navbar" />

            <button
              onClick={() => handleNavClick('agendamento')}
              className="p-2 rounded-lg bg-amber-500 text-neutral-950 font-medium text-xs flex items-center gap-1 shadow-sm cursor-pointer"
              aria-label="Agendar Horário"
            >
              <Calendar className="w-4 h-4 text-neutral-950" />
              <span>Agendar</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/80 border border-neutral-800 focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-amber-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/98 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
          {/* Mobile Establishment Switcher */}
          {allEstablishments.length > 1 && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Unidade Selecionada:
              </span>
              <div className="flex flex-wrap gap-2">
                {allEstablishments.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => handleSelectEstablishment(est)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      est.id === establishment.id
                        ? 'bg-amber-500 text-neutral-950 shadow-sm'
                        : 'bg-neutral-950 text-neutral-300 border border-neutral-800'
                    }`}
                  >
                    <span>{est.name}</span>
                    {est.id === establishment.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {item.icon}
                    {item.label}
                  </span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
            <PWAInstallButton variant="card" />

            <button
              onClick={() => handleNavClick('admin')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-neutral-400 bg-neutral-900 border border-neutral-800 hover:text-amber-300"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Painel do Administrador Local</span>
            </button>

            <button
              onClick={() => handleNavClick('super-admin')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 font-semibold"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Painel Geral da Plataforma (Super Admin)</span>
            </button>

            {company.instagramUrl && (
              <a
                href={company.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 text-xs text-neutral-400 hover:text-amber-300 transition-colors"
              >
                Instagram Oficial {company.instagramHandle}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
