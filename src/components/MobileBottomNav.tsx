import React, { useState } from 'react';
import { PageView } from '../types';
import { useStore } from '../data/store';
import { PWAInstallModal } from './PWAInstallModal';
import {
  Home,
  Scissors,
  Calendar,
  ShoppingBag,
  Menu,
  X,
  Images,
  Phone,
  ShieldCheck,
  Download,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentPage: PageView;
  setCurrentPage: (page: PageView) => void;
  onBookClick?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPage,
  setCurrentPage,
  onBookClick,
}) => {
  const { company, store } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPWAModal, setShowPWAModal] = useState(false);

  const handleNavigate = (page: PageView) => {
    setCurrentPage(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAgendarClick = () => {
    if (onBookClick) {
      onBookClick();
    } else {
      handleNavigate('agendamento');
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on md+ screens) */}
      <nav
        aria-label="Navegação móvel inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] transition-all"
      >
        <div className="grid grid-cols-5 items-center max-w-md mx-auto">
          {/* 1. Início */}
          <button
            onClick={() => handleNavigate('home')}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              currentPage === 'home'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Home
                className={`w-5 h-5 transition-transform ${
                  currentPage === 'home' ? 'scale-110' : ''
                }`}
              />
              {currentPage === 'home' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Início</span>
          </button>

          {/* 2. Serviços */}
          <button
            onClick={() => handleNavigate('servicos')}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              currentPage === 'servicos'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Scissors
                className={`w-5 h-5 transition-transform ${
                  currentPage === 'servicos' ? 'scale-110' : ''
                }`}
              />
              {currentPage === 'servicos' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Serviços</span>
          </button>

          {/* 3. Agendar (Destaque Central) */}
          <button
            onClick={handleAgendarClick}
            className="flex flex-col items-center justify-center -mt-3.5 group"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform group-active:scale-95 ${
                currentPage === 'agendamento'
                  ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-neutral-950 ring-4 ring-amber-500/30 shadow-amber-500/40'
                  : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-neutral-950 ring-2 ring-neutral-800 shadow-amber-500/20 group-hover:scale-105'
              }`}
            >
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span
              className={`text-[10px] mt-1 font-semibold ${
                currentPage === 'agendamento' ? 'text-amber-400' : 'text-amber-300/90'
              }`}
            >
              Agendar
            </span>
          </button>

          {/* 4. Produtos */}
          <button
            onClick={() => handleNavigate('produtos')}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              currentPage === 'produtos'
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <ShoppingBag
                className={`w-5 h-5 transition-transform ${
                  currentPage === 'produtos' ? 'scale-110' : ''
                }`}
              />
              {currentPage === 'produtos' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Loja</span>
          </button>

          {/* 5. Menu Mais / Opções */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              isMenuOpen || ['galeria', 'contato', 'admin'].includes(currentPage)
                ? 'text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className="relative">
              <Menu className="w-5 h-5" />
              {['galeria', 'contato', 'admin'].includes(currentPage) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* Drawer / Bottom Sheet do menu 'Mais' no mobile */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 flex flex-col justify-end"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header com pull handle */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-1.5 rounded-full bg-neutral-700 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md overflow-hidden border border-amber-500/40 shrink-0">
                    <img
                      src={company.logoUrl || '/logo.jpg'}
                      alt={establishment.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-semibold text-sm text-neutral-200">
                    {establishment.name}
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Banner Instalar App (PWA) no topo do drawer */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowPWAModal(true);
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-800 to-amber-500/10 border border-amber-500/40 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    Instalar Aplicativo no Celular
                    <span className="px-1.5 py-0.2 bg-amber-400 text-neutral-950 rounded text-[9px] font-extrabold uppercase">
                      PWA
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Salve no seu iPhone ou Android em 1 toque
                  </p>
                </div>
              </div>
              <span className="text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>

            {/* Lista de Navegação Secundária */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => handleNavigate('galeria')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  currentPage === 'galeria'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
                  <Images className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-semibold">Galeria & Antes/Depois</p>
                  <p className="text-[11px] text-neutral-400">Fotos de cortes, sobrancelhas e cílios</p>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('contato')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  currentPage === 'contato'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-semibold">Localização & Contato</p>
                  <p className="text-[11px] text-neutral-400">Endereço, horários e mapa</p>
                </div>
              </button>

              {/* Botão direto WhatsApp */}
              <a
                href={store.buildServiceAppointmentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-semibold">Conversar no WhatsApp</p>
                  <p className="text-[11px] text-emerald-400/80">Atendimento e dúvidas em tempo real</p>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </a>

              {/* Painel Administrativo */}
              <button
                onClick={() => handleNavigate('admin')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  currentPage === 'admin'
                    ? 'bg-neutral-800 border-neutral-600 text-amber-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-semibold">Área Administrativa</p>
                  <p className="text-[11px] text-neutral-500">Gestão de horários, produtos e mídia</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PWA aberto pelo menu mais */}
      <PWAInstallModal
        isOpen={showPWAModal}
        onClose={() => setShowPWAModal(false)}
      />
    </>
  );
};
