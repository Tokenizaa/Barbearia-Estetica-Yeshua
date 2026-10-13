import React from 'react';
import { PageView } from '../types';
import { useStore } from '../data/store';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Sparkles,
  MapPin,
  Phone,
  Instagram,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Heart,
} from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentPage }) => {
  const { company, store } = useStore();

  const handleNav = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-neutral-950 border-t border-neutral-800/80 text-neutral-400 mt-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md">
                <img
                  src={company.logoUrl || '/logo.jpg'}
                  alt="Barbearia & Estética Yeshua"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="block font-display text-lg font-bold text-neutral-100 uppercase tracking-wider">
                  Yeshua
                </span>
                <span className="block text-xs uppercase tracking-widest text-amber-400 font-medium">
                  Barbearia & Estética • Manaus
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Excelência e cuidado com sua autoestima no coração de Manaus. Cortes, barboterapia, extensão de cílios, sobrancelhas, unhas, tranças e produtos exclusivos.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={company.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={store.buildServiceAppointmentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-neutral-200 mb-4 font-display">
              Navegação Rápida
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => handleNav('home')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Página Inicial
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('servicos')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Menu de Serviços
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('agendamento')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Agendar Horário
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('produtos')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Produtos & Cosméticos
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('galeria')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Galeria & Trabalhos
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('contato')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Localização & Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Location */}
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-neutral-200 mb-4 font-display">
              Unidade & Atendimento
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-neutral-200 block">{company.address}</strong>
                  {company.cityState}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <a
                  href={store.buildServiceAppointmentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-300 hover:text-amber-300 transition-colors"
                >
                  {company.whatsapp}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Instagram className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <a
                  href={company.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-300 hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  <span>{company.instagramHandle}</span>
                  <ArrowUpRight className="w-3 h-3 text-neutral-500" />
                </a>
              </li>
              {company.openingHoursNote && (
                <li className="flex items-start gap-2.5 text-xs text-neutral-400 pt-1">
                  <Clock className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                  <span>{company.openingHoursNote}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Commercial & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-neutral-200 mb-4 font-display">
              Atendimento Comercial
            </h4>
            <p className="text-sm text-neutral-400">
              Agendamentos e dúvidas comerciais são realizados com rapidez diretamente pelo WhatsApp oficial.
            </p>
            <a
              href={store.buildServiceAppointmentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-amber-300 hover:text-amber-200 text-sm font-medium transition-colors"
            >
              Falar com a Yeshua no WhatsApp
            </a>

            <div className="pt-2 space-y-2">
              <div>
                <PWAInstallButton variant="footer" />
              </div>

              <div>
                <button
                  onClick={() => handleNav('admin')}
                  className="text-xs text-neutral-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Painel de Controle do Administrador</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>
            © {new Date().getFullYear()} Barbearia & Estética Yeshua. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1">
            <span>Manaus, Amazonas</span>
            <span className="text-neutral-400">•</span>
            <span className="flex items-center gap-1 text-neutral-400">
              Feito com excelência <Heart className="w-3 h-3 text-rose-500/80 fill-rose-500/80" />
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
