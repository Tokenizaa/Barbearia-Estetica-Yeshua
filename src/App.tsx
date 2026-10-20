import React, { useState } from 'react';
import { PageView } from './types';
import { useStore } from './data/store';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { AppointmentPage } from './pages/AppointmentPage';
import { ProductsPage } from './pages/ProductsPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { readShareablePreview, SharedSitePreview } from './pages/SharedSitePreview';
import { PlatformAccessPage } from './pages/PlatformAccessPage';
import { AlertTriangle, Building2, Check } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string | null>(null);
  const { establishment, store } = useStore();
  const sharedPreview = readShareablePreview(window.location.search);

  const handleBookService = (serviceId?: string) => {
    setSelectedServiceIdForBooking(serviceId || null);
    setCurrentPage('agendamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (window.location.pathname === '/plataforma/cadastro' || window.location.pathname === '/plataforma/login') {
    return <PlatformAccessPage />;
  }

  if (new URLSearchParams(window.location.search).has('site-preview')) {
    return <SharedSitePreview preview={sharedPreview} />;
  }

  const isPublicPage =
    currentPage !== 'admin' && currentPage !== 'super-admin';

  const renderCurrentPage = () => {
    // If establishment is inactive and client is on a public page, show inactive message
    if (establishment.status !== 'active' && isPublicPage) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-neutral-100">
                {establishment.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-2">
                Este estabelecimento está temporariamente inativo ou em manutenção.
              </p>
            </div>
            <button
              onClick={() => {
                store.selectEstablishment('est-yeshua');
                setCurrentPage('home');
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Ir para Barbearia & Estética Yeshua
            </button>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            setCurrentPage={setCurrentPage}
            onBookService={handleBookService}
          />
        );
      case 'servicos':
        return <ServicesPage onBookService={handleBookService} />;
      case 'agendamento':
        return (
          <AppointmentPage
            preselectedServiceId={selectedServiceIdForBooking}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'produtos':
        return <ProductsPage />;
      case 'galeria':
        return <GalleryPage />;
      case 'contato':
        return <ContactPage />;
      case 'admin':
        return (
          <AdminPage
            onNavigateToSuperAdmin={() => {
              window.location.assign('/plataforma/login');
            }}
            onBackToApp={() => {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'super-admin':
        // Administração geral usa a autenticação real da plataforma (Supabase),
        // nunca o PIN mestre legado armazenado no estado local do navegador.
        return <PlatformAccessPage />;
      default:
        return (
          <HomePage
            setCurrentPage={setCurrentPage}
            onBookService={handleBookService}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 pb-16 md:pb-0">{renderCurrentPage()}</main>
      <Footer setCurrentPage={setCurrentPage} />
      <MobileBottomNav
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onBookClick={() => handleBookService()}
      />
      <FloatingWhatsApp />
      <OfflineIndicator />
    </div>
  );
}
