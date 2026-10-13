import React, { useState } from 'react';
import { InstagramEmbedItem } from '../types';
import { store } from '../data/store';
import { Instagram, Play, Sparkles, X, ExternalLink, Eye } from 'lucide-react';

interface InstagramEmbedModalProps {
  embedItem: InstagramEmbedItem | null;
  onClose: () => void;
  onSave: (data: Omit<InstagramEmbedItem, 'id'>) => void;
}

export const InstagramEmbedModal: React.FC<InstagramEmbedModalProps> = ({
  embedItem,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState(
    embedItem?.url || 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D'
  );
  const [title, setTitle] = useState(
    embedItem?.title || 'Publicação Oficial @barbearia_estetica_yeshua'
  );
  const [caption, setCaption] = useState(
    embedItem?.caption ||
      'Confira os trabalhos da Barbearia & Estética Yeshua em Manaus!'
  );
  const [previewImageUrl, setPreviewImageUrl] = useState(
    embedItem?.previewImageUrl || '/logo.jpg'
  );
  const [type, setType] = useState<'post' | 'reel'>(embedItem?.type || 'post');
  const [likesCount, setLikesCount] = useState(embedItem?.likesCount || '520');
  const [commentsCount, setCommentsCount] = useState(
    embedItem?.commentsCount || '42'
  );
  const [date, setDate] = useState(
    embedItem?.date || new Date().toISOString().split('T')[0]
  );
  const [featured, setFeatured] = useState(embedItem?.featured ?? true);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Automatically parse URL or embed code when input changes
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    const parsed = store.parseInstagramUrl(newUrl);
    setType(parsed.type);
  };

  const parsedEmbed = store.parseInstagramUrl(url);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onSave({
      url: parsedEmbed.cleanUrl || url.trim(),
      shortcode: parsedEmbed.shortcode,
      title: title.trim() || 'Publicação no Instagram',
      caption: caption.trim(),
      previewImageUrl: previewImageUrl.trim(),
      type,
      likesCount: likesCount.trim() || '450+',
      commentsCount: commentsCount.trim() || '30',
      date,
      featured,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-neutral-950 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100 font-display">
                {embedItem ? 'Editar Post / Reel Embedado' : 'Embedar Novo Post ou Reel do Instagram'}
              </h3>
              <p className="text-xs text-neutral-400">
                Cole o link oficial do post, reel ou o código embed copiado do Instagram.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Link ou Código Embed do Instagram */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Link ou Código Embed do Instagram *
              </label>
              <span className="text-[11px] text-neutral-400">
                URL, Reel ou código HTML completo
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.instagram.com/p/... ou /reel/... ou <blockquote...>"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 font-mono focus:border-amber-400 focus:outline-none"
              />
              <span className="absolute right-3 top-3 text-neutral-500">
                <Instagram className="w-4 h-4" />
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <span>Código detectado:</span>
                <code className="text-amber-400 font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                  {parsedEmbed.shortcode}
                </code>
                <span>• Tipo:</span>
                <span className="font-bold uppercase text-purple-400">
                  {type}
                </span>
              </p>

              {/* Botões rápidos com exemplos reais */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-neutral-500">Exemplos:</span>
                <button
                  type="button"
                  onClick={() => handleUrlChange('https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D')}
                  className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 transition-colors cursor-pointer"
                >
                  Perfil Oficial
                </button>
              </div>
            </div>
          </div>

          {/* Tipo e Destaque */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Tipo de Conteúdo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'post' | 'reel')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="post">Foto / Publicação Normal</option>
                <option value="reel">Reel / Vídeo Vertical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Data da Publicação
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
              </input>
            </div>
          </div>

          {/* Título / Procedimento */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Título / Procedimento no Site *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Alinhamento de Barba & Fade Masculino"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Legenda / Caption */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Legenda do Instagram
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Digite ou cole a legenda do post..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Imagem de Prévia */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
              Imagem de Capa / Prévia (URL)
            </label>
            <input
              type="url"
              value={previewImageUrl}
              onChange={(e) => setPreviewImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... ou link da foto"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Curtidas & Comentários */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Contador de Curtidas (ex: 450+)
              </label>
              <input
                type="text"
                value={likesCount}
                onChange={(e) => setLikesCount(e.target.value)}
                placeholder="450+"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                Contador de Comentários
              </label>
              <input
                type="text"
                value={commentsCount}
                onChange={(e) => setCommentsCount(e.target.value)}
                placeholder="35"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Destaque Checkbox */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-neutral-200">
                Destacar no topo da seção de Instagram
              </span>
            </div>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Toggle de Pré-visualização ao vivo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showLivePreview ? 'Ocultar Prévia do Embed' : 'Testar / Ver Prévia do Embed'}</span>
            </button>

            {showLivePreview && (
              <div className="mt-3 p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-semibold text-neutral-300">
                    Iframe oficial do Instagram:
                  </span>
                  <a
                    href={parsedEmbed.cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Abrir post no Instagram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="w-full h-[480px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 relative">
                  <iframe
                    src={parsedEmbed.embedUrl}
                    title="Live Preview"
                    className="w-full h-full border-0"
                    frameBorder="0"
                    scrolling="no"
                    allowTransparency={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Instagram className="w-4 h-4" />
              <span>{embedItem ? 'Salvar Alterações' : 'Embedar no Site'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
