import React, { useState } from 'react';
import { PageView } from '../types';
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
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
}) => {
  const { company, store } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Identity */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-400/20 via-neutral-900 to-amber-900/30 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:border-amber-400 transition-colors shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="block font-display text-lg sm:text-xl font-bold tracking-wider text-neutral-100 uppercase group-hover:text-amber-200 transition-colors">
                Yeshua
              </span>
              <span className="block text-[11px] uppercase tracking-widest text-neutral-400 font-medium">
                Barbearia & Estética • Manaus
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
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
          <div className="hidden md:flex items-center gap-2.5">
            <PWAInstallButton variant="navbar" />

            <button
              onClick={() => handleNavClick('admin')}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                currentPage === 'admin'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700 bg-neutral-900/50'
              }`}
              title="Área Administrativa"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400/80" />
              <span className="hidden lg:inline">Admin</span>
            </button>

            <button
              onClick={() => handleNavClick('agendamento')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold text-sm shadow-md hover:shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-neutral-950" />
              <span>Agendar Horário</span>
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
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/98 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
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
              <span>Acessar Painel do Administrador</span>
            </button>

            <a
              href={company.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 text-xs text-neutral-400 hover:text-amber-300 transition-colors"
            >
              Instagram Oficial {company.instagramHandle}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
