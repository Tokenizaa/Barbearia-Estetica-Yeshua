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

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string | null>(null);
  const { store } = useStore();

  const handleBookService = (serviceId?: string) => {
    setSelectedServiceIdForBooking(serviceId || null);
    setCurrentPage('agendamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
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
        return <AdminPage />;
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
