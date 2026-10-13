import { useEffect, useState } from 'react';
import {
  CompanyInfo,
  ServiceItem,
  ProductItem,
  MediaItem,
  Appointment,
  InstagramEmbedItem,
} from '../types';
import {
  INITIAL_COMPANY_INFO,
  INITIAL_SERVICES,
  INITIAL_PRODUCTS,
  INITIAL_MEDIA,
  INITIAL_APPOINTMENTS,
  INITIAL_INSTAGRAM_EMBEDS,
} from './defaultData';

const STORAGE_KEYS = {
  COMPANY: 'yeshua_company_info_v4',
  SERVICES: 'yeshua_services_v1',
  PRODUCTS: 'yeshua_products_v1',
  MEDIA: 'yeshua_media_v4',
  APPOINTMENTS: 'yeshua_appointments_v1',
  INSTAGRAM_EMBEDS: 'yeshua_instagram_embeds_v4',
};

// Listeners for multi-component reactivity without heavy Redux
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

// In-memory cache loaded from LocalStorage
let currentCompany: CompanyInfo = (() => {
  const loaded = loadFromStorage<CompanyInfo>(
    STORAGE_KEYS.COMPANY,
    INITIAL_COMPANY_INFO
  );
  // Ensure the latest official logo and exact Instagram URL are present
  return {
    ...INITIAL_COMPANY_INFO,
    ...loaded,
    instagramUrl: INITIAL_COMPANY_INFO.instagramUrl,
    instagramHandle: INITIAL_COMPANY_INFO.instagramHandle,
    logoUrl: '/logo.jpg',
  };
})();

let currentServices: ServiceItem[] = loadFromStorage(
  STORAGE_SERVICES_KEY(STORAGE_KEYS.SERVICES),
  INITIAL_SERVICES
);
let currentProducts: ProductItem[] = loadFromStorage(
  STORAGE_KEYS.PRODUCTS,
  INITIAL_PRODUCTS
);
let currentMedia: MediaItem[] = loadFromStorage(
  STORAGE_KEYS.MEDIA,
  INITIAL_MEDIA
);
let currentAppointments: Appointment[] = loadFromStorage(
  STORAGE_KEYS.APPOINTMENTS,
  INITIAL_APPOINTMENTS
);

function STORAGE_SERVICES_KEY(k: string) { return k; }

let currentInstagramEmbeds: InstagramEmbedItem[] = (() => {
  const loaded = loadFromStorage<InstagramEmbedItem[]>(
    STORAGE_KEYS.INSTAGRAM_EMBEDS,
    INITIAL_INSTAGRAM_EMBEDS
  );
  // Reset if empty, has old unsplash images, old fake shortcodes, or synthetic generic haircuts
  const hasLegacyOrGeneric = loaded.some(
    (item) =>
      !item.shortcode ||
      item.shortcode === 'CGnw1SIhPs1' ||
      item.shortcode === 'C_1vY5ksw5F' ||
      item.shortcode.endsWith('Yesh') ||
      (item.previewImageUrl &&
        (item.previewImageUrl.includes('images.unsplash.com') ||
          item.previewImageUrl.includes('yeshua_post_')))
  );
  if (hasLegacyOrGeneric || loaded.length === 0) {
    saveToStorage(STORAGE_KEYS.INSTAGRAM_EMBEDS, INITIAL_INSTAGRAM_EMBEDS);
    return INITIAL_INSTAGRAM_EMBEDS;
  }
  return loaded;
})();

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Erro ao carregar chave ${key} do localStorage`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar no localStorage para ${key}`, err);
  }
}

export const store = {
  // Getters
  getCompany(): CompanyInfo {
    return currentCompany;
  },
  getServices(): ServiceItem[] {
    return currentServices;
  },
  getProducts(): ProductItem[] {
    return currentProducts;
  },
  getMedia(): MediaItem[] {
    return currentMedia;
  },

  // Company info actions
  updateCompany(newInfo: Partial<CompanyInfo>) {
    currentCompany = { ...currentCompany, ...newInfo };
    saveToStorage(STORAGE_KEYS.COMPANY, currentCompany);
    notify();
  },

  // Services actions
  addService(service: Omit<ServiceItem, 'id'>) {
    const newService: ServiceItem = {
      ...service,
      id: `srv-${Date.now()}`,
    };
    currentServices = [newService, ...currentServices];
    saveToStorage(STORAGE_KEYS.SERVICES, currentServices);
    notify();
    return newService;
  },

  updateService(id: string, updates: Partial<ServiceItem>) {
    currentServices = currentServices.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveToStorage(STORAGE_KEYS.SERVICES, currentServices);
    notify();
  },

  deleteService(id: string) {
    currentServices = currentServices.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.SERVICES, currentServices);
    notify();
  },

  toggleFeaturedService(id: string) {
    currentServices = currentServices.map((item) =>
      item.id === id ? { ...item, featured: !item.featured } : item
    );
    saveToStorage(STORAGE_KEYS.SERVICES, currentServices);
    notify();
  },

  // Products actions
  addProduct(product: Omit<ProductItem, 'id'>) {
    const newProduct: ProductItem = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    currentProducts = [newProduct, ...currentProducts];
    saveToStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
    notify();
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<ProductItem>) {
    currentProducts = currentProducts.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveToStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
    notify();
  },

  deleteProduct(id: string) {
    currentProducts = currentProducts.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
    notify();
  },

  toggleFeaturedProduct(id: string) {
    currentProducts = currentProducts.map((item) =>
      item.id === id ? { ...item, featured: !item.featured } : item
    );
    saveToStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
    notify();
  },

  // Media actions
  addMedia(media: Omit<MediaItem, 'id' | 'dateAdded'>) {
    const newMedia: MediaItem = {
      ...media,
      id: `med-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
    };
    currentMedia = [newMedia, ...currentMedia];
    saveToStorage(STORAGE_KEYS.MEDIA, currentMedia);
    notify();
    return newMedia;
  },

  updateMedia(id: string, updates: Partial<MediaItem>) {
    currentMedia = currentMedia.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    saveToStorage(STORAGE_KEYS.MEDIA, currentMedia);
    notify();
  },

  deleteMedia(id: string) {
    currentMedia = currentMedia.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.MEDIA, currentMedia);
    notify();
  },

  // Reset to default
  resetAllData() {
    currentCompany = INITIAL_COMPANY_INFO;
    currentServices = INITIAL_SERVICES;
    currentProducts = INITIAL_PRODUCTS;
    currentMedia = INITIAL_MEDIA;
    currentAppointments = INITIAL_APPOINTMENTS;
    currentInstagramEmbeds = INITIAL_INSTAGRAM_EMBEDS;

    saveToStorage(STORAGE_KEYS.COMPANY, currentCompany);
    saveToStorage(STORAGE_KEYS.SERVICES, currentServices);
    saveToStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
    saveToStorage(STORAGE_KEYS.MEDIA, currentMedia);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, currentAppointments);
    saveToStorage(STORAGE_KEYS.INSTAGRAM_EMBEDS, currentInstagramEmbeds);
    notify();
  },

  // Instagram Embeds actions
  getInstagramEmbeds(): InstagramEmbedItem[] {
    return currentInstagramEmbeds;
  },

  addInstagramEmbed(
    item: Omit<InstagramEmbedItem, 'id'>
  ): InstagramEmbedItem {
    const parsed = this.parseInstagramUrl(item.url);
    const newEmbed: InstagramEmbedItem = {
      ...item,
      id: `ig-${Date.now()}`,
      shortcode: parsed.shortcode,
      type: item.type || parsed.type,
      likesCount: item.likesCount || '500+',
      commentsCount: item.commentsCount || '30+',
      date: item.date || new Date().toISOString().split('T')[0],
      featured: item.featured ?? true,
    };
    currentInstagramEmbeds = [newEmbed, ...currentInstagramEmbeds];
    saveToStorage(STORAGE_KEYS.INSTAGRAM_EMBEDS, currentInstagramEmbeds);
    notify();
    return newEmbed;
  },

  updateInstagramEmbed(id: string, updates: Partial<InstagramEmbedItem>) {
    currentInstagramEmbeds = currentInstagramEmbeds.map((item) => {
      if (item.id !== id) return item;
      const updatedUrl = updates.url || item.url;
      const parsed = updates.url ? this.parseInstagramUrl(updatedUrl) : null;
      return {
        ...item,
        ...updates,
        ...(parsed ? { shortcode: parsed.shortcode, type: updates.type || parsed.type } : {}),
      };
    });
    saveToStorage(STORAGE_KEYS.INSTAGRAM_EMBEDS, currentInstagramEmbeds);
    notify();
  },

  deleteInstagramEmbed(id: string) {
    currentInstagramEmbeds = currentInstagramEmbeds.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.INSTAGRAM_EMBEDS, currentInstagramEmbeds);
    notify();
  },

  parseInstagramUrl(inputUrl: string): {
    shortcode: string;
    type: 'post' | 'reel';
    embedUrl: string;
    compactEmbedUrl: string;
    cleanUrl: string;
    isProfile: boolean;
    isPostOrReel: boolean;
  } {
    let clean = (inputUrl || '').trim();

    // 1. If user pasted a full HTML blockquote or iframe snippet from Instagram Embed
    // e.g. <blockquote ... data-instgrm-permalink="https://www.instagram.com/p/CODE/..."
    const permalinkMatch = clean.match(/data-instgrm-permalink=["']([^"']+)["']/i);
    if (permalinkMatch && permalinkMatch[1]) {
      clean = permalinkMatch[1];
    } else {
      // e.g. <iframe ... src="https://www.instagram.com/p/CODE/embed/..."
      const iframeSrcMatch = clean.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (iframeSrcMatch && iframeSrcMatch[1]) {
        clean = iframeSrcMatch[1];
      }
    }

    // Strip URL query parameters and hashes for shortcode extraction
    const urlWithoutQuery = clean.split('?')[0].split('#')[0];

    // 2. Reel or Reels match (/reel/CODE or /reels/CODE)
    const reelMatch = urlWithoutQuery.match(/(?:reel|reels)\/([A-Za-z0-9_-]+)/i);
    if (reelMatch && reelMatch[1]) {
      const code = reelMatch[1];
      return {
        shortcode: code,
        type: 'reel',
        embedUrl: `https://www.instagram.com/reel/${code}/embed/captioned/`,
        compactEmbedUrl: `https://www.instagram.com/reel/${code}/embed/`,
        cleanUrl: `https://www.instagram.com/reel/${code}/`,
        isProfile: false,
        isPostOrReel: true,
      };
    }

    // 3. Post match (/p/CODE)
    const postMatch = urlWithoutQuery.match(/\/p\/([A-Za-z0-9_-]+)/i);
    if (postMatch && postMatch[1]) {
      const code = postMatch[1];
      return {
        shortcode: code,
        type: 'post',
        embedUrl: `https://www.instagram.com/p/${code}/embed/captioned/`,
        compactEmbedUrl: `https://www.instagram.com/p/${code}/embed/`,
        cleanUrl: `https://www.instagram.com/p/${code}/`,
        isProfile: false,
        isPostOrReel: true,
      };
    }

    // 4. IGTV match (/tv/CODE)
    const tvMatch = urlWithoutQuery.match(/\/tv\/([A-Za-z0-9_-]+)/i);
    if (tvMatch && tvMatch[1]) {
      const code = tvMatch[1];
      return {
        shortcode: code,
        type: 'reel',
        embedUrl: `https://www.instagram.com/reel/${code}/embed/captioned/`,
        compactEmbedUrl: `https://www.instagram.com/reel/${code}/embed/`,
        cleanUrl: `https://www.instagram.com/reel/${code}/`,
        isProfile: false,
        isPostOrReel: true,
      };
    }

    // 5. Profile check (e.g. instagram.com/barbearia_estetica_yeshua or starts with @)
    const profileMatch = clean.match(/(?:instagram\.com\/|@)([A-Za-z0-9_.-]+)/i);
    if (profileMatch && profileMatch[1]) {
      const username = profileMatch[1];
      const isYeshua = username.toLowerCase().includes('yeshua');
      const profileUrl = isYeshua
        ? 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D'
        : `https://www.instagram.com/${username}/`;
      return {
        shortcode: username,
        type: 'post',
        embedUrl: profileUrl,
        compactEmbedUrl: profileUrl,
        cleanUrl: profileUrl,
        isProfile: true,
        isPostOrReel: false,
      };
    }

    // 6. Direct shortcode if alphanumeric (e.g. "C_1vY5ksw5F") without url
    const codeMatch = clean.replace(/[^A-Za-z0-9_-]/g, '');
    if (codeMatch && codeMatch.length >= 6 && codeMatch.length <= 25) {
      const isReel = clean.toLowerCase().includes('reel');
      const type: 'post' | 'reel' = isReel ? 'reel' : 'post';
      const path = isReel ? 'reel' : 'p';
      return {
        shortcode: codeMatch,
        type,
        embedUrl: `https://www.instagram.com/${path}/${codeMatch}/embed/captioned/`,
        compactEmbedUrl: `https://www.instagram.com/${path}/${codeMatch}/embed/`,
        cleanUrl: `https://www.instagram.com/${path}/${codeMatch}/`,
        isProfile: false,
        isPostOrReel: true,
      };
    }

    // Fallback to official Yeshua profile
    const defaultProfile =
      'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D';
    return {
      shortcode: 'barbearia_estetica_yeshua',
      type: 'post',
      embedUrl: defaultProfile,
      compactEmbedUrl: defaultProfile,
      cleanUrl: defaultProfile,
      isProfile: true,
      isPostOrReel: false,
    };
  },

  getAppointments(): Appointment[] {
    return currentAppointments;
  },

  addAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Appointment {
    const newAppt: Appointment = {
      ...appointment,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    currentAppointments = [newAppt, ...currentAppointments];
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, currentAppointments);
    notify();
    return newAppt;
  },

  updateAppointmentStatus(
    id: string,
    status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  ) {
    currentAppointments = currentAppointments.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, currentAppointments);
    notify();
  },

  deleteAppointment(id: string) {
    currentAppointments = currentAppointments.filter((item) => item.id !== id);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, currentAppointments);
    notify();
  },

  // Conflict prevention helpers
  isTimeSlotBooked(date: string, time: string): boolean {
    return currentAppointments.some(
      (item) => item.date === date && item.time === time && item.status === 'confirmado'
    );
  },

  getConfirmedTimesForDate(date: string): string[] {
    return currentAppointments
      .filter((item) => item.date === date && item.status === 'confirmado')
      .map((item) => item.time);
  },

  // WhatsApp link generator
  buildWhatsAppUrl(customMessage: string): string {
    const cleanPhone = currentCompany.whatsappClean || '5592986187766';
    const encoded = encodeURIComponent(customMessage);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  },

  buildScheduledAppointmentWhatsAppUrl(appointment: {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    date: string;
    time: string;
    notes?: string;
  }): string {
    const [year, month, day] = appointment.date.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    const text = [
      '💈 *SOLICITAÇÃO DE AGENDAMENTO — YESHUA* 💈',
      '',
      `👤 *Cliente:* ${appointment.clientName}`,
      `📱 *Telefone/WhatsApp:* ${appointment.clientPhone}`,
      `✂️ *Serviço Escolhido:* ${appointment.serviceName}`,
      `📅 *Data Desejada:* ${formattedDate}`,
      `⏰ *Horário Preferencial:* ${appointment.time}`,
      appointment.notes ? `💬 *Observações:* ${appointment.notes}` : '',
      '',
      'Olá equipe da Barbearia & Estética Yeshua! Vim pelo site e gostaria de confirmar este horário para meu atendimento. Aguardo confirmação!',
    ]
      .filter((line) => line !== null && line !== undefined)
      .join('\n');

    return this.buildWhatsAppUrl(text);
  },

  buildServiceAppointmentUrl(serviceName?: string): string {
    if (serviceName) {
      return this.buildWhatsAppUrl(
        `Olá! Vim pelo site da Barbearia & Estética Yeshua e gostaria de agendar o serviço de ${serviceName}.`
      );
    }
    return this.buildWhatsAppUrl(
      `Olá! Vim pelo site da Barbearia & Estética Yeshua e gostaria de agendar um horário.`
    );
  },

  buildProductInquiryUrl(productName: string): string {
    return this.buildWhatsAppUrl(
      `Olá! Vim pelo site da Barbearia & Estética Yeshua e gostaria de saber mais sobre o produto ${productName}.`
    );
  },
};

// Custom React Hook to subscribe to store changes
export function useStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    company: store.getCompany(),
    services: store.getServices(),
    products: store.getProducts(),
    media: store.getMedia(),
    appointments: store.getAppointments(),
    instagramEmbeds: store.getInstagramEmbeds(),
    store,
  };
}
