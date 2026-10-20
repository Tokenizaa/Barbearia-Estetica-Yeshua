import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { Download, Smartphone, Sparkles, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'card' | 'footer' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { isInstalled, isIOS, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If already running in standalone installed app, don't show intrusive install CTA
  if (isInstalled && variant !== 'footer') {
    return null;
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-900/90 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 hover:text-amber-200 transition-all shadow-sm hover:shadow-amber-500/10 cursor-pointer ${className}`}
          title="Instalar App no iPhone ou Android"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Salvar App</span>
          <span className="hidden xl:inline text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
            PWA
          </span>
        </button>
      )}

      {variant === 'footer' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-amber-300 transition-colors cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Como Salvar o App (iPhone &amp; Android)</span>
        </button>
      )}

      {variant === 'banner' && (
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/15 via-neutral-900 to-purple-950/30 border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ${className}`}
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-amber-500/40 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src="/pwa-192x192.png"
                alt="Aplicativo do estabelecimento"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-neutral-100 font-display">
                  Instale o aplicativo do estabelecimento
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Grátis
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Acesse agendamentos, serviços e galeria em 1 clique direto da sua tela inicial (iOS e Android).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-neutral-950" />
            <span>Salvar no Celular</span>
          </button>
        </div>
      )}

      {variant === 'card' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className={`w-full p-4 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer ${className}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-xs text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
              Instruções →
            </span>
          </div>
          <h4 className="text-sm font-bold text-neutral-100 group-hover:text-amber-200 transition-colors">
            Salvar Aplicativo
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            Instruções rápidas para iPhone (Safari) e Android (Chrome).
          </p>
        </button>
      )}

      {/* Instructional Modal */}
      <PWAInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
