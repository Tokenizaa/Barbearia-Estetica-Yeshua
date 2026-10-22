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
import { UnifiedAdminDashboard } from './pages/UnifiedAdminDashboard';
import { readShareablePreview, SharedSitePreview } from './pages/SharedSitePreview';
import { PublicDemoSelectionPage } from './pages/PublicDemoSelectionPage';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string | null>(null);
  const { establishment, store } = useStore();
  const sharedPreview = readShareablePreview(window.location.search);
  const publicDemoMatch = window.location.pathname.match(/^\/demo\/([A-Za-z0-9_-]{40,100})\/?$/);

  const handleBookService = (serviceId?: string) => {
    setSelectedServiceIdForBooking(serviceId || null);
    setCurrentPage('agendamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPublicSite = () => {
    setCurrentPage('home');
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route: Platform Network / Super Admin
  if (['/plataforma/admin', '/admin', '/plataforma/login', '/plataforma/cadastro'].includes(window.location.pathname)) {
    return <UnifiedAdminDashboard initialSection="rede-saloes" onBackToApp={handleBackToPublicSite} />;
  }

  // Route: Leads Discovery & CRM Scraping Dashboard
  if (['/plataforma/prospeccao', '/plataforma/crm', '/plataforma/leads', '/prospeccao'].includes(window.location.pathname)) {
    return <UnifiedAdminDashboard initialSection="prospeccao-hoje" onBackToApp={handleBackToPublicSite} />;
  }

  if (publicDemoMatch) {
    return <PublicDemoSelectionPage token={publicDemoMatch[1]} />;
  }

  if (new URLSearchParams(window.location.search).has('site-preview')) {
    return <SharedSitePreview preview={sharedPreview} />;
  }

  // If in admin mode, display Unified Admin full-screen
  if (currentPage === 'admin') {
    return <UnifiedAdminDashboard initialSection="salao-dashboard" onBackToApp={handleBackToPublicSite} />;
  }

  if (currentPage === 'super-admin') {
    return <UnifiedAdminDashboard initialSection="rede-saloes" onBackToApp={handleBackToPublicSite} />;
  }

  const isPublicPage = true;

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
              Ir para o estabelecimento
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
