import React, { useState } from 'react';
import { PageView } from '../types';
import { useStore } from '../data/store';
import { PWAInstallButton } from './PWAInstallButton';
import { useToast } from '../context/ToastContext';
import {
  Menu,
  X,
  ShieldCheck,
  ShoppingBag,
  Images,
  Phone,
  Calendar,
  Building2,
  ChevronDown,
  Scissors,
} from 'lucide-react';

interface NavbarProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const { establishment, session } = useStore();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accessMenuOpen, setAccessMenuOpen] = useState(false);

  const navItems: { label: string; page: PageView; icon?: React.ReactNode }[] = [
    { label: 'Início', page: 'home' },
    { label: 'Serviços', page: 'servicos', icon: <Scissors className="h-4 w-4" /> },
    { label: 'Produtos', page: 'produtos', icon: <ShoppingBag className="h-4 w-4" /> },
    { label: 'Galeria', page: 'galeria', icon: <Images className="h-4 w-4" /> },
    { label: 'Contato', page: 'contato', icon: <Phone className="h-4 w-4" /> },
  ];

  const handleNavClick = (page: PageView) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    setAccessMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPlatformSuperAdmin = () => {
    setMobileMenuOpen(false);
    setAccessMenuOpen(false);
    setCurrentPage('super-admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/80 bg-neutral-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            onClick={() => handleNavClick('home')}
            className="flex min-w-0 items-center gap-2.5 text-left"
            aria-label="Ir para o início"
          >
            <img
              src={establishment.logoUrl || '/icon.svg'}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="max-w-[190px] truncate text-sm font-semibold tracking-tight text-neutral-100 sm:max-w-[260px] sm:text-base">
              {establishment.name}
            </span>
          </button>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                aria-current={currentPage === item.page ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentPage === item.page
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => handleNavClick('agendamento')}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400 sm:px-4"
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar</span>
            </button>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setAccessMenuOpen((open) => !open)}
                aria-expanded={accessMenuOpen}
                aria-label="Abrir opções adicionais"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-neutral-800 px-3 text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
              >
                <span>Mais</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${accessMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {accessMenuOpen && (
                <>
                  <button
                    aria-label="Fechar opções adicionais"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setAccessMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-xl">
                    <div className="px-3 pb-2 pt-1 text-xs font-medium text-neutral-500">Acesso e aplicativo</div>
                    <PWAInstallButton variant="navbar" className="w-full justify-start" />
                    <button
                      onClick={() => {
                        if (!session) {
                          showToast('Faça login via Supabase Auth primeiro.');
                          return;
                        }
                        if (session.role === 'establishment_admin' || session.role === 'super_admin') {
                          handleNavClick('admin');
                        } else {
                          showToast('Acesso negado. Permissões insuficientes.');
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4 text-neutral-400" />
                      Área administrativa
                    </button>
                    <button
                      onClick={() => {
                        if (!session) {
                          showToast('Faça login via Supabase Auth primeiro.');
                          return;
                        }
                        if (session.role === 'super_admin') {
                          goToPlatformSuperAdmin();
                        } else {
                          showToast('Acesso negado. Apenas super_adins.');
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      Rede & Super Admin
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white lg:hidden"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950 px-4 pb-5 pt-3 lg:hidden">
          <nav aria-label="Navegação móvel" className="mx-auto max-w-7xl space-y-1">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => handleNavClick(item.page)}
                aria-current={currentPage === item.page ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                  currentPage === item.page
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="mt-3 space-y-1 border-t border-neutral-800 pt-3">
              <PWAInstallButton variant="navbar" className="w-full justify-center" />
              <button
                onClick={() => {
                        if (!session) {
                          showToast('Faça login via Supabase Auth primeiro.');
                          return;
                        }
                        if (session.role === 'establishment_admin' || session.role === 'super_admin') {
                          handleNavClick('admin');
                        } else {
                          showToast('Acesso negado. Permissões insuficientes.');
                        }
                      }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-900 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                Área administrativa
              </button>
              <button
                onClick={goToPlatformSuperAdmin}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-neutral-300 hover:bg-neutral-900 cursor-pointer"
              >
                <Building2 className="h-4 w-4" />
                Rede & Super Admin
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
