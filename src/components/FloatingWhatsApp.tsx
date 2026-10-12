import React, { useState } from 'react';
import { useStore } from '../data/store';
import { MessageCircle, X } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const { company, store } = useStore();
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)] z-30 flex flex-col items-end gap-2 pointer-events-none">
      {/* Mini balloon tooltip */}
      {showTooltip && (
        <div className="pointer-events-auto bg-neutral-900/95 border border-amber-500/30 text-neutral-100 px-3.5 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-medium">
            Atendimento Yeshua no <strong className="text-amber-300">WhatsApp</strong>
          </p>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-neutral-500 hover:text-neutral-300 ml-1 p-0.5 rounded"
            aria-label="Fechar dica"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating CTA Button */}
      <a
        href={store.buildServiceAppointmentUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-emerald-400/40"
        aria-label="Falar conosco no WhatsApp"
        title="Agendar pelo WhatsApp"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-neutral-950"></span>
        </span>
        <MessageCircle className="w-7 h-7 fill-white" />
      </a>
    </div>
  );
};
