import React, { useState } from 'react';
import { useStore } from '../data/store';
import {
  Scissors,
  Clock,
  MessageCircle,
  Sparkles,
  Filter,
  CheckCircle,
  Calendar,
} from 'lucide-react';

interface ServicesPageProps {
  onBookService?: (serviceId: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onBookService }) => {
  const { services, store } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Extract distinct categories
  const categories = [
    'Todos',
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  const filteredServices =
    selectedCategory === 'Todos'
      ? services
      : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
          <Scissors className="w-3.5 h-3.5" />
          <span>Menu Completo de Atendimento</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-display uppercase tracking-wider text-neutral-100">
          Serviços & Procedimentos
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
          Técnicas modernas, biossegurança e atenção personalizada para realçar sua melhor versão. Escolha o serviço e agende com um clique pelo WhatsApp.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 justify-start sm:justify-center no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/50 rounded-2xl border border-neutral-800">
          <Scissors className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-neutral-300">
            Nenhum serviço nesta categoria no momento
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Novos serviços podem ser cadastrados na Área Administrativa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-16/10 overflow-hidden bg-neutral-950">
                  <img
                    src={
                      service.imageUrl ||
                      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80'
                    }
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-neutral-950/80 text-amber-300 border border-amber-500/20 backdrop-blur-xs">
                      {service.category}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold font-display text-neutral-100 group-hover:text-amber-200 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-neutral-800/80 text-xs text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span>
                        {service.durationMinutes
                          ? `Aprox. ${service.durationMinutes} min`
                          : 'Duração sob consulta'}
                      </span>
                    </div>

                    <div>
                      {typeof service.price === 'number' ? (
                        <span className="text-base font-bold font-display text-amber-400">
                          R$ {service.price.toFixed(2).replace('.', ',')}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">
                          Consulte valor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-2">
                <button
                  onClick={() => onBookService ? onBookService(service.id) : null}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-neutral-950" />
                  <span>Agendar Horário</span>
                </button>
                <a
                  href={store.buildServiceAppointmentUrl(service.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-semibold text-xs border border-neutral-700 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title="WhatsApp Direto"
                >
                  <MessageCircle className="w-4 h-4 fill-emerald-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Note */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-2">
        <h4 className="text-sm font-semibold text-neutral-200 font-display">
          Como funciona o agendamento?
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Ao clicar no botão "Agendar no WhatsApp", nosso canal oficial será aberto automaticamente com o nome do serviço pré-selecionado para agilizar o atendimento com nossa equipe.
        </p>
      </div>
    </div>
  );
};
