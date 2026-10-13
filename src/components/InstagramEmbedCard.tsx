import React, { useState, useEffect } from 'react';
import { InstagramEmbedItem } from '../types';
import { useStore } from '../data/store';
import {
  Instagram,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface InstagramEmbedCardProps {
  item: InstagramEmbedItem;
  onUpdateUrl?: (id: string, newUrl: string) => void;
}

export const InstagramEmbedCard: React.FC<InstagramEmbedCardProps> = ({
  item,
  onUpdateUrl,
}) => {
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [useCaptioned, setUseCaptioned] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inputUrl, setInputUrl] = useState('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const parsed = store.parseInstagramUrl(item.url);
  const embedUrl = useCaptioned ? parsed.embedUrl : parsed.compactEmbedUrl;

  // Trigger Instagram's official embed processor if available
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).instgrm?.Embeds?.process) {
      try {
        (window as any).instgrm.Embeds.process();
      } catch (err) {
        // silent fallback
      }
    }
  }, [embedUrl, refreshKey]);

  const handleSaveNewUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const cleanParsed = store.parseInstagramUrl(inputUrl.trim());
    store.updateInstagramEmbed(item.id, {
      url: cleanParsed.cleanUrl,
      shortcode: cleanParsed.shortcode,
      type: cleanParsed.type,
    });
    setIsEditingUrl(false);
    setInputUrl('');
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 rounded-2xl p-3 sm:p-4 flex flex-col space-y-3 shadow-xl transition-all group">
      {/* Top Header do Card */}
      <div className="flex items-center justify-between text-xs px-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Instagram className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-neutral-200 truncate text-xs leading-snug">
              {item.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
              <span className="font-mono text-amber-400 font-semibold truncate max-w-[140px]">
                {parsed.isPostOrReel ? parsed.shortcode : '@barbearia_estetica_yeshua'}
              </span>
              <span>•</span>
              <span className="uppercase text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1 rounded border border-purple-500/20">
                {item.type === 'reel' ? 'Reel' : 'Post'}
              </span>
            </div>
          </div>
        </div>

        {/* Controles rápidos */}
        <div className="flex items-center gap-1.5 shrink-0">
          {parsed.isPostOrReel && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setUseCaptioned(!useCaptioned);
              }}
              className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-[10px] font-medium text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
              title={useCaptioned ? 'Trocar para modo compacto' : 'Trocar para modo com legenda'}
            >
              {useCaptioned ? 'Legenda ON' : 'Compacto'}
            </button>
          )}

          <a
            href={parsed.cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 transition-colors"
            title="Abrir no Instagram oficial"
          >
            <span>Abrir</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Container Principal: IFRAME OU CARD INTERATIVO DE CANAL */}
      {parsed.isPostOrReel ? (
        <div className="relative w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center min-h-[460px]">
          {/* Loading Skeleton */}
          {loading && (
            <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center gap-3 z-10 p-6 text-center">
              <div className="relative w-12 h-12 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 animate-pulse">
                <div className="w-full h-full bg-neutral-950 rounded-2xl flex items-center justify-center text-white">
                  <Instagram className="w-6 h-6 text-rose-400 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-neutral-200 block">
                  Carregando iframe oficial do Instagram...
                </span>
                <span className="text-[10px] text-neutral-500 font-mono block truncate max-w-xs mx-auto">
                  https://instagram.com/{item.type === 'reel' ? 'reel' : 'p'}/{parsed.shortcode}/
                </span>
              </div>
            </div>
          )}

          {/* Iframe Real e Oficial do Instagram */}
          <iframe
            key={`${embedUrl}-${refreshKey}`}
            src={embedUrl}
            title={item.title}
            className={`w-full border-0 transition-opacity duration-300 ${
              useCaptioned
                ? 'h-[560px] sm:h-[600px]'
                : 'h-[460px] sm:h-[500px]'
            } ${loading ? 'opacity-0' : 'opacity-100'}`}
            frameBorder="0"
            scrolling="no"
            allowTransparency={true}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            onLoad={() => setLoading(false)}
          />
        </div>
      ) : (
        /* Caso seja canal/perfil: Card elegante com visual oficial e opção de colar link direto do post */
        <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-amber-500/40 p-1 shrink-0 overflow-hidden shadow-md">
              <img
                src={item.previewImageUrl || '/logo.jpg'}
                alt={item.title}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-neutral-100 truncate">
                  @barbearia_estetica_yeshua
                </span>
                <span className="p-0.5 rounded-full bg-sky-500 text-white shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              </div>
              <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed">
                {item.caption ||
                  'Confira esta e outras publicações oficiais diretamente em nosso Instagram!'}
              </p>
            </div>
          </div>

          {/* Formulário rápido para embedar post direto neste slot */}
          {isEditingUrl ? (
            <form onSubmit={handleSaveNewUrl} className="space-y-2 pt-2 border-t border-neutral-850">
              <label className="text-[11px] text-amber-300 font-semibold block">
                Cole o link do post ou reel para exibir o iframe:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/... ou /reel/..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUrl(false)}
                  className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t border-neutral-850 gap-2">
              <button
                type="button"
                onClick={() => setIsEditingUrl(true)}
                className="text-[11px] text-neutral-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Vincular link de post específico (/p/...)</span>
              </button>

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-semibold text-xs shadow-xs"
              >
                <span>Ver no Instagram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Rodapé de Ações do Card */}
      <div className="space-y-2 pt-1">
        <a
          href={store.buildWhatsAppUrl(
            `Olá! Vi o post oficial "${item.title}" no Instagram da Barbearia & Estética Yeshua pelo site e gostaria de agendar um horário para fazer esse estilo!`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-white" />
          <span>Agendar esse estilo no WhatsApp</span>
        </a>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-0.5">
          {parsed.isPostOrReel && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setRefreshKey((k) => k + 1);
              }}
              className="hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Recarregar este iframe"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Recarregar iframe</span>
            </button>
          )}

          <a
            href={parsed.cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1 ml-auto"
          >
            <span>Ver no Instagram oficial</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
