import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Check,
  X,
  Copy,
  Sparkles,
  Zap,
  ShieldCheck,
  Laptop,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isIOS, isAndroid, isInstalled, hasNativePrompt, triggerNativeInstall } = usePWAInstall();

  // Default active tab to device detected
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('android');
  const [copied, setCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    } else {
      setActiveTab('android');
    }
  }, [isIOS, isAndroid]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeClick = async () => {
    setInstallStatus('Iniciando instalação...');
    const result = await triggerNativeInstall();
    if (result === 'accepted') {
      setInstallStatus('Instalado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } else if (result === 'dismissed') {
      setInstallStatus(null);
    } else {
      setInstallStatus('Siga as instruções passo a passo abaixo.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-amber-500/30 text-neutral-100 shadow-2xl p-5 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors z-20 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4 border-b border-neutral-800 pb-5">
          <div className="relative w-16 h-16 rounded-2xl bg-neutral-950 border border-amber-500/40 p-1 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <img
              src="/logo.jpg"
              alt="Logo Yeshua"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-bold text-[10px] shadow">
              ✓
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Aplicativo Web Oficial (PWA)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-neutral-100">
              Salvar App no seu Celular
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              Acesse a <strong className="text-amber-300 font-medium">Yeshua</strong> direto da sua tela inicial como um aplicativo nativo!
            </p>
          </div>
        </div>

        {/* If already installed */}
        {isInstalled && (
          <div className="my-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs sm:text-sm">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>O aplicativo já está instalado no seu aparelho ou sendo executado na tela inicial.</span>
          </div>
        )}

        {/* Benefits bar */}
        <div className="grid grid-cols-3 gap-2 my-5 text-center text-[11px] sm:text-xs">
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="font-semibold text-neutral-200 block">Ultra Rápido</span>
            <span className="text-neutral-400 text-[10px]">Abre em 1 toque</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <Smartphone className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="font-semibold text-neutral-200 block">Leve (2MB)</span>
            <span className="text-neutral-400 text-[10px]">Não lota memória</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
            <ShieldCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="font-semibold text-neutral-200 block">Offline</span>
            <span className="text-neutral-400 text-[10px]">Catálogo salvo</span>
          </div>
        </div>

        {/* Tabs selector */}
        <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 mb-6">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
            {isAndroid && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-neutral-950/30 text-neutral-900 font-bold">
                Seu
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.62 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.01-.49 2.63-1.24z" />
            </svg>
            <span>iPhone / iPad</span>
            {isIOS && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-neutral-950/30 text-neutral-900 font-bold">
                Seu
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 hidden sm:flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* TAB CONTENT: ANDROID */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Native 1-click button if available */}
            {hasNativePrompt && !isInstalled && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-600/10 border border-amber-500/40 text-center space-y-2">
                <p className="text-xs text-amber-200 font-medium">
                  Seu navegador é 100% compatível com instalação instantânea:
                </p>
                <button
                  onClick={handleNativeClick}
                  className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 transition-all transform active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5 text-neutral-950" />
                  <span>Instalar Aplicativo Agora com 1 Clique</span>
                </button>
                {installStatus && (
                  <p className="text-xs text-amber-300 font-medium pt-1">{installStatus}</p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 font-display">
                Instruções passo a passo (Chrome, Samsung Internet, Opera):
              </h3>

              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Toque nos 3 Pontinhos no canto superior
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    No topo direito do navegador (Google Chrome ou Samsung Internet), toque no menu <MoreVertical className="w-3.5 h-3.5 inline text-amber-400" /> (três pontinhos verticais).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Selecione &quot;Instalar aplicativo&quot; ou &quot;Adicionar à tela inicial&quot;
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    No menu que abrir, toque na opção com o ícone de download ou tela inicial: <strong className="text-amber-300">&quot;Instalar aplicativo&quot;</strong> ou <strong className="text-amber-300">&quot;Adicionar à tela inicial&quot;</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Confirme tocando em &quot;Instalar&quot;
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    Confirme o aviso. O ícone da Barbearia Yeshua ficará salvo na sua tela principal como qualquer app da Play Store!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: IPHONE / IOS */}
        {activeTab === 'ios' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Warning if in Instagram or In-App Browser */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
              💡 <strong>Dica importante para iPhone:</strong> Abra este link pelo navegador oficial <strong>Safari</strong> (se estiver no Instagram ou WhatsApp, toque nos 3 pontinhos do topo e selecione <em>&quot;Abrir no Safari&quot;</em>).
            </div>

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 font-display">
                Passo a passo no Safari do iPhone / iPad:
              </h3>

              {/* Step 1 iOS */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span>Toque no botão Compartilhar</span>
                    <span className="p-1 rounded bg-neutral-800 text-sky-400 inline-flex items-center">
                      <Share className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    Na barra inferior (ou superior) do Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com uma seta apontando para cima).
                  </p>
                </div>
              </div>

              {/* Step 2 iOS */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <span>Role para baixo e selecione</span>
                    <span className="p-1 rounded bg-neutral-800 text-amber-400 inline-flex items-center">
                      <PlusSquare className="w-3.5 h-3.5" />
                    </span>
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    Role as opções da folha de compartilhamento para baixo e toque em <strong className="text-amber-300">&quot;Adicionar à Tela de Início&quot;</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 iOS */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Toque em &quot;Adicionar&quot; no canto superior
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    No canto superior direito da tela, toque em <strong>&quot;Adicionar&quot;</strong>. Pronto! O app Yeshua aparecerá direto na grade de aplicativos do seu iPhone!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: DESKTOP / PC */}
        {activeTab === 'desktop' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 font-display">
                No Google Chrome, Microsoft Edge ou Brave no Computador:
              </h3>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Ícone na Barra de Endereço (URL)
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    Observe o canto direito da barra de endereço onde você digita o link. Há um pequeno ícone de monitor com seta ou símbolo de computador com <Download className="w-3.5 h-3.5 inline text-amber-400" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-neutral-200">
                    Clique em &quot;Instalar Barbearia Yeshua&quot;
                  </p>
                  <p className="text-neutral-400 leading-relaxed text-xs">
                    O aplicativo abrirá em uma janela exclusiva, sem barras de navegador, podendo ser fixado na Barra de Tarefas ou no Dock do Mac.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bottom Bar */}
        <div className="mt-6 pt-5 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs sm:text-sm text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Link Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-neutral-400" />
                <span>Copiar Link do App</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
