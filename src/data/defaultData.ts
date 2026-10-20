import {
  Establishment,
  CompanyInfo,
  ServiceItem,
  ProductItem,
  MediaItem,
  Appointment,
  InstagramEmbedItem,
  PlatformConfig,
} from '../types';

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'Plataforma de Sites Personalizados',
  masterPin: '9988',
  supportEmail: 'contato@tokenizaa.com',
  supportWhatsapp: '',
};

// Estabelecimento inicial neutro para personalização pelo primeiro cliente
export const INITIAL_ESTABLISHMENT_YESHUA: Establishment = {
  id: 'est-yeshua',
  slug: 'modelo-inicial',
  name: 'Salão Modelo',
  tagline: 'Modelo inicial • Personalize sua marca',
  status: 'active',
  isDefault: true,

  // Identidade Visual
  logoUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=300&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
  primaryColor: '#f59e0b', // Dourado Âmbar
  secondaryColor: '#d97706',
  theme: 'amber',

  // Contato e Localização
  whatsapp: '',
  whatsappClean: '',
  phone: '',
  address: '',
  cityState: '',
  googleMapsUrl: '',

  // Instagram e Redes
  instagramHandle: '',
  instagramUrl: '',
  instagramBio:
    'Configure a descrição do seu estabelecimento, seus serviços e os canais de atendimento.',
  instagramFollowers: '',
  instagramPostsCount: '',
  showInstagramGallery: false, // Ocultado provisoriamente a pedido do usuário

  // Administração Local
  adminPin: '1234',
  adminName: 'Administrador do estabelecimento',
  adminEmail: '',
  openingHoursNote: 'Atendimento com horário marcado e por ordem de chegada no WhatsApp.',
  allowOnlineBooking: true,
  slotIntervalMinutes: 45,

  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

// Segundo estabelecimento fictício para demonstração da plataforma White Label
export const INITIAL_ESTABLISHMENT_DEMO: Establishment = {
  id: 'est-imperio',
  slug: 'demonstracao',
  name: 'Estabelecimento de Demonstração',
  tagline: 'Exemplo de identidade • Personalizável',
  status: 'active',
  isDefault: false,

  // Identidade Visual
  logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  primaryColor: '#10b981', // Esmeralda
  secondaryColor: '#059669',
  theme: 'emerald',

  // Contato e Localização
  whatsapp: '',
  whatsappClean: '',
  phone: '',
  address: '',
  cityState: '',
  googleMapsUrl: '',

  // Instagram e Redes
  instagramHandle: '',
  instagramUrl: '',
  instagramBio: '',
  instagramFollowers: '',
  instagramPostsCount: '',
  showInstagramGallery: false,

  // Administração Local
  adminPin: '4321',
  adminName: 'Administrador do estabelecimento',
  adminEmail: '',
  openingHoursNote: 'Terça a Sábado das 09h às 21h.',
  allowOnlineBooking: true,
  slotIntervalMinutes: 45,

  createdAt: '2026-02-15T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

export const INITIAL_ESTABLISHMENTS: Establishment[] = [
  INITIAL_ESTABLISHMENT_YESHUA,
  INITIAL_ESTABLISHMENT_DEMO,
];

// Compatibilidade retroativa
export const INITIAL_COMPANY_INFO: CompanyInfo = INITIAL_ESTABLISHMENT_YESHUA;

// Exemplos de conteúdo de demonstração sem associação a negócios reais
export const INITIAL_INSTAGRAM_EMBEDS: InstagramEmbedItem[] = [];

// Agendamentos iniciais escopados por estabelecimento
export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-sample-1',
    establishmentId: 'est-yeshua',
    clientName: 'Marcos Silva (Exemplo Confirmado)',
    clientPhone: '(92) 99123-4567',
    serviceId: 'srv-1',
    serviceName: 'Corte de Cabelo Masculino & Barba',
    serviceDuration: 45,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    notes: 'Cliente prefere corte degradê navalhado.',
    status: 'confirmado',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-sample-2',
    establishmentId: 'est-yeshua',
    clientName: 'Carla Oliveira (Exemplo Pedido WhatsApp)',
    clientPhone: '(92) 98456-7890',
    serviceId: 'srv-2',
    serviceName: 'Extensão de Cílios',
    serviceDuration: 90,
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    time: '10:30',
    notes: 'Solicitação enviada via link do WhatsApp pelo site.',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-imperio-1',
    establishmentId: 'est-imperio',
    clientName: 'Rodrigo Mendonça',
    clientPhone: '(92) 99881-2233',
    serviceId: 'srv-imp-1',
    serviceName: 'Corte Masculino — Demonstração',
    serviceDuration: 50,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '16:00',
    notes: 'Agendamento fictício para demonstração.',
    status: 'confirmado',
    createdAt: new Date().toISOString(),
  },
];

// Serviços base preparados com o catálogo Salão Modelo e catálogo de demonstração
export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    establishmentId: 'est-yeshua',
    name: 'Corte de Cabelo Masculino & Barba',
    category: 'Barbearia',
    description: 'Design de barba e corte masculino com finalização profissional.',
    price: null,
    durationMinutes: 45,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    id: 'srv-2',
    establishmentId: 'est-yeshua',
    name: 'Extensão de Cílios',
    category: 'Cílios',
    description: 'Aplicação e manutenção de extensão de cílios com técnica especializada.',
    price: null,
    durationMinutes: 90,
    imageUrl: 'https://images.unsplash.com/photo-1583001809863-2342a7b6f3a1?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    id: 'srv-3',
    establishmentId: 'est-yeshua',
    name: 'Design de Sobrancelhas',
    category: 'Sobrancelhas',
    description: 'Alinhamento, visagismo e harmonização do olhar.',
    price: null,
    durationMinutes: 30,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    id: 'srv-4',
    establishmentId: 'est-yeshua',
    name: 'Tranças & Penteados',
    category: 'Tranças',
    description: 'Tranças nagô, box braids e penteados exclusivos.',
    price: null,
    durationMinutes: 120,
    imageUrl: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    id: 'srv-5',
    establishmentId: 'est-yeshua',
    name: 'Tratamentos Capilares & Escova',
    category: 'Cabelos',
    description: 'Hidratação profunda, nutrição capilar e escovação modelada.',
    price: null,
    durationMinutes: 60,
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    featured: false,
  },
  {
    id: 'srv-6',
    establishmentId: 'est-yeshua',
    name: 'Manicure & Pedicure',
    category: 'Unhas',
    description: 'Esmaltação, cutilagem e cuidados estéticos para as mãos e pés.',
    price: null,
    durationMinutes: 50,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    featured: false,
  },
  // Serviços do estabelecimento de demonstração (demonstra isolamento)
  {
    id: 'srv-imp-1',
    establishmentId: 'est-imperio',
    name: 'Corte Masculino — Demonstração',
    category: 'Barbearia',
    description: 'Corte personalizado com visagismo completo, lavagem especial e massagem facial.',
    price: 85,
    durationMinutes: 50,
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
  {
    id: 'srv-imp-2',
    establishmentId: 'est-imperio',
    name: 'Camuflagem de Fios Brancos',
    category: 'Cabelos',
    description: 'Pigmentação natural discreta e elegante para cabelo ou barba.',
    price: 60,
    durationMinutes: 30,
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    featured: true,
  },
];

// Produtos iniciais
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    establishmentId: 'est-yeshua',
    name: 'Pomada Modeladora — Demonstração',
    category: 'Barbearia',
    description: 'Fixação forte e acabamento natural sem brilho excessivo. Ideal para penteados diários.',
    price: 35.0,
    mainImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    additionalImages: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    ],
    available: true,
    featured: true,
  },
  {
    id: 'prod-2',
    establishmentId: 'est-yeshua',
    name: 'Óleo Nutritivo para Barba e Cabelo',
    category: 'Barbearia',
    description: 'Hidratação profunda dos fios, reduz o frizz e perfuma suavemente.',
    price: 42.0,
    mainImage: 'https://images.unsplash.com/photo-1608248597359-2e11894a4c58?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    available: true,
    featured: true,
  },
  {
    id: 'prod-3',
    establishmentId: 'est-yeshua',
    name: 'Sérum Fortalecedor para Sobrancelhas e Cílios',
    category: 'Estética',
    description: 'Fórmula nutritiva que estimula o crescimento e alinhamento dos fios.',
    price: 49.9,
    mainImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    available: true,
    featured: true,
  },
  {
    id: 'prod-imp-1',
    establishmentId: 'est-imperio',
    name: 'Balm Hidratante — Demonstração',
    category: 'Barbearia',
    description: 'Essência de cedro e sândalo com manteiga de karité para alinhamento da barba.',
    price: 55.0,
    mainImage: 'https://images.unsplash.com/photo-1608248597359-2e11894a4c58?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    available: true,
    featured: true,
  },
];

// Galeria preparada
export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Exemplo de trabalho — corte e acabamento',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
  {
    id: 'med-2',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Design de Barba & Barbaterapia com Toalha Quente',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80',
    category: 'Barbearia',
    dateAdded: '2026-03-02',
    featured: true,
  },
  {
    id: 'med-3',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Estética Facial & Design de Sobrancelhas',
    url: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=900&q=80',
    category: 'Sobrancelhas',
    dateAdded: '2026-03-03',
    featured: true,
  },
  {
    id: 'med-4',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Espaço do estabelecimento — imagem de demonstração',
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
    category: 'Ambiente',
    dateAdded: '2026-03-04',
    featured: true,
  },
  {
    id: 'med-5',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Logo do estabelecimento — substitua pela sua marca',
    url: '/logo.jpg',
    category: 'Ambiente',
    dateAdded: '2026-03-05',
    featured: true,
  },
  {
    id: 'med-6',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Tranças Nagô & Acabamento Artístico',
    url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=900&q=80',
    category: 'Tranças',
    dateAdded: '2026-03-06',
    featured: true,
  },
  {
    id: 'med-7',
    establishmentId: 'est-yeshua',
    type: 'video',
    title: 'Transformação Visual e Finalização Barbearia',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-shaving-a-mans-beard-with-a-razor-41484-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80',
    isReelVertical: true,
    category: 'Barbearia',
    dateAdded: '2026-03-07',
    featured: true,
  },
  {
    id: 'med-imp-1',
    establishmentId: 'est-imperio',
    type: 'image',
    title: 'Corte Clássico — Demonstração',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
];
