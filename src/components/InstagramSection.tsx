import React, { useState } from 'react';
import { InstagramEmbedItem } from '../types';
import { useStore } from '../data/store';
import {
  Instagram,
  Heart,
  MessageCircle,
  ExternalLink,
  Play,
  Share2,
  Check,
  Bookmark,
  Sparkles,
  Layers,
  Monitor,
} from 'lucide-react';

interface InstagramSectionProps {
  onSelectServiceForBooking?: (serviceName: string) => void;
}

export const InstagramSection: React.FC<InstagramSectionProps> = ({
  onSelectServiceForBooking,
}) => {
  const { company, instagramEmbeds, store } = useStore();
  const [activeTab, setActiveTab] = useState<'todos' | 'posts' | 'reels'>('todos');
  const [viewMode, setViewMode] = useState<'feed' | 'embeds'>('feed');
  const [selectedPost, setSelectedPost] = useState<InstagramEmbedItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const handleCopyProfileLink = () => {
    navigator.clipboard.writeText(company.instagramUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = instagramEmbeds.filter((item) => {
    if (activeTab === 'posts') return item.type === 'post';
    if (activeTab === 'reels') return item.type === 'reel';
    return true;
  });

  return (
    <section id="instagram-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-10 shadow-2xl">
        {/* Glow ambient background effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-gradient-to-tr from-amber-500/10 to-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* 1. CABEÇALHO DO PERFIL INSTAGRAM (ESTILO OFICIAL) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-800/80 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Foto de perfil com anel gradiente do Instagram */}
              <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-lg group">
                <div className="w-full h-full rounded-full bg-neutral-950 p-[2px] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80"
                    alt={company.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-purple-600 border-2 border-neutral-950 flex items-center justify-center text-white shadow-md">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Informações da conta */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-100 font-display">
                    {company.instagramHandle}
                  </h3>
                  {/* Badge de verificado / oficial */}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Oficial</span>
                  </span>
                </div>

                {/* Estatísticas resumidas */}
                <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-300 py-0.5">
                  <span>
                    <strong className="text-neutral-100 font-semibold font-mono">
                      {company.instagramPostsCount || '340+'}
                    </strong>{' '}
                    posts
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-neutral-100 font-semibold font-mono">
                      {company.instagramFollowers || '4.8k'}
                    </strong>{' '}
                    seguidores
                  </span>
                  <span>•</span>
                  <span className="text-neutral-400">Manaus, AM</span>
                </div>

                {/* Bio do Instagram */}
                <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
                  {company.instagramBio ||
                    '💈 Barbearia & Estética em Manaus • Cortes Masculinos & Barba • Cílios, Sobrancelhas, Tranças & Unhas • Atendimento de Excelência'}
                </p>
              </div>
            </div>

            {/* Ações do perfil */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <a
                href={company.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                <Instagram className="w-4 h-4" />
                <span>Seguir no Instagram</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleCopyProfileLink}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700/80 transition-colors cursor-pointer"
                title="Copiar link do Instagram"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. BARRA DE CONTROLES & FILTROS DO FEED EMBED */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filtros de Tipo */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'todos'
                    ? 'bg-neutral-800 text-amber-300 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Todos ({instagramEmbeds.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'posts'
                    ? 'bg-neutral-800 text-amber-300 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Fotos & Posts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reels')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'reels'
                    ? 'bg-neutral-800 text-amber-300 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Reels & Vídeos</span>
              </button>
            </div>

            {/* Alternador de Modo de Visualização */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 hidden sm:inline">Modo:</span>
              <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setViewMode('feed')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'feed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Grade interativa estilo Feed Instagram"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grade Instagram</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('embeds')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === 'embeds'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Player Iframe oficial do Instagram"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Embeds Oficiais</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. CONTEÚDO DOS POSTS */}
          {filteredItems.length === 0 ? (
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-10 text-center space-y-3">
              <Instagram className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-neutral-400 text-sm">
                Nenhum item encontrado nesta categoria.
              </p>
            </div>
          ) : viewMode === 'feed' ? (
            /* MODO FEED: GRADE DE FOTOS E REELS COM EFEITO HOVER & INTERAÇÕES */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-5">
              {filteredItems.map((item) => {
                const isLiked = likedPosts[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPost(item)}
                    className="group relative rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/90 hover:border-amber-400/50 transition-all duration-300 cursor-pointer flex flex-col shadow-md"
                  >
                    {/* Header do Card com Usuário */}
                    <div className="p-3 bg-neutral-950 flex items-center justify-between border-b border-neutral-850 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=100&q=80"
                            alt="avatar"
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <span className="font-semibold text-neutral-200 truncate text-[11px]">
                          barbearia_estetica_yeshua
                        </span>
                      </div>

                      <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                        {item.type === 'reel' ? 'Reel' : 'Post'}
                      </span>
                    </div>

                    {/* Mídia do Card */}
                    <div className="relative aspect-square overflow-hidden bg-neutral-900">
                      <img
                        src={
                          item.previewImageUrl ||
                          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Badge de Reel */}
                      {item.type === 'reel' && (
                        <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-neutral-950/80 backdrop-blur-xs text-white border border-white/20">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      )}

                      {/* Overlay com Métricas ao passar o mouse */}
                      <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white backdrop-blur-[2px]">
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : 'fill-white'}`} />
                          <span>{item.likesCount || '450+'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-sm">
                          <MessageCircle className="w-5 h-5 fill-white" />
                          <span>{item.commentsCount || '32'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações rápidas abaixo da foto */}
                    <div className="p-3 bg-neutral-950 flex-1 flex flex-col justify-between space-y-2 border-t border-neutral-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => toggleLike(e, item.id)}
                            className="text-neutral-300 hover:text-rose-500 transition-colors"
                            title="Curtir"
                          >
                            <Heart
                              className={`w-4 h-4 transition-transform active:scale-125 ${
                                isLiked ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPost(item)}
                            className="text-neutral-300 hover:text-amber-400 transition-colors"
                            title="Comentar"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-neutral-300 hover:text-purple-400 transition-colors"
                            title="Abrir no Instagram"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500">
                          {item.likesCount || '500+'} curtidas
                        </span>
                      </div>

                      {/* Legenda resumida */}
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        <strong className="text-neutral-100 mr-1.5">
                          barbearia_estetica_yeshua
                        </strong>
                        {item.caption || item.title}
                      </p>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-amber-400">
                        <span className="hover:underline">Ver post completo</span>
                        <span className="text-neutral-500">
                          {item.date ? item.date.split('-').reverse().join('/') : 'Recente'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* MODO EMBED OFICIAL: IFRAMES DO INSTAGRAM */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => {
                const embedUrl = store.parseInstagramUrl(item.url).embedUrl;
                return (
                  <div
                    key={item.id}
                    className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 sm:p-4 flex flex-col space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-semibold text-neutral-200 truncate flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-rose-400" />
                        <span>{item.title}</span>
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Iframe oficial do Instagram */}
                    <div className="relative w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 aspect-[9/13] max-h-[520px]">
                      <iframe
                        src={embedUrl}
                        title={item.title}
                        className="w-full h-full border-0"
                        loading="lazy"
                        allowTransparency={true}
                      />
                    </div>

                    <a
                      href={store.buildWhatsAppUrl(
                        `Olá! Vi o post "${item.title}" no Instagram da Yeshua pelo site e gostaria de agendar um horário para fazer esse mesmo estilo!`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Agendar esse estilo no WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. RODAPÉ DO BLOCO DE INSTAGRAM COM CTA */}
          <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-950/60 p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-200">
                  Quer ver mais fotos e vídeos do nosso espaço?
                </h4>
                <p className="text-xs text-neutral-400">
                  Marque <strong className="text-amber-300">@barbearia_estetica_yeshua</strong> na sua transformação para aparecer em nossos destaques!
                </p>
              </div>
            </div>

            <a
              href={company.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors shrink-0"
            >
              <Instagram className="w-4 h-4" />
              <span>Ver feed completo no Instagram</span>
            </a>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALHES DO POST SELECIONADO */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            {/* Lado da Imagem/Vídeo */}
            <div className="relative md:w-3/5 bg-neutral-950 flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[500px]">
              <img
                src={
                  selectedPost.previewImageUrl ||
                  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80'
                }
                alt={selectedPost.title}
                className="w-full h-full object-cover max-h-[520px]"
              />

              {selectedPost.type === 'reel' && (
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reel no Instagram</span>
                </div>
              )}
            </div>

            {/* Lado dos Detalhes & Comentários */}
            <div className="md:w-2/5 p-5 sm:p-6 bg-neutral-900 flex flex-col justify-between space-y-5 overflow-y-auto">
              <div className="space-y-4">
                {/* Header do modal */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600">
                      <img
                        src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&q=80"
                        alt="avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">
                        {company.instagramHandle}
                      </h4>
                      <p className="text-[11px] text-neutral-400">Manaus — Centro</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Título & Legenda */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-neutral-100 font-display">
                    {selectedPost.title}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                    {selectedPost.caption ||
                      'Confira esta transformação incrível realizada pelos profissionais da Barbearia & Estética Yeshua.'}
                  </p>
                </div>

                {/* Tags & Métricas */}
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>❤️ Curtidas:</span>
                    <strong className="text-neutral-200">
                      {selectedPost.likesCount || '500+'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>💬 Comentários:</span>
                    <strong className="text-neutral-200">
                      {selectedPost.commentsCount || '35'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>📅 Publicado em:</span>
                    <span className="text-neutral-300">
                      {selectedPost.date
                        ? selectedPost.date.split('-').reverse().join('/')
                        : 'Recente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação no Modal */}
              <div className="space-y-2.5 pt-4 border-t border-neutral-800">
                <a
                  href={store.buildWhatsAppUrl(
                    `Olá! Gostei muito do post "${selectedPost.title}" no Instagram da Barbearia & Estética Yeshua e quero agendar um horário para fazer esse estilo!`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-neutral-950" />
                  <span>Quero esse estilo (WhatsApp)</span>
                </a>

                <a
                  href={selectedPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4 text-rose-400" />
                  <span>Ver post original no Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
