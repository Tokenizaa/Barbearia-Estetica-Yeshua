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
  supportWhatsapp: '+55 92 98618-7766',
};

// Primeiro e principal estabelecimento da plataforma: Barbearia & Estética Yeshua
export const INITIAL_ESTABLISHMENT_YESHUA: Establishment = {
  id: 'est-yeshua',
  slug: 'yeshua',
  name: 'Barbearia & Estética Yeshua',
  tagline: 'Barbearia & Estética • Manaus',
  status: 'active',
  isDefault: true,

  // Identidade Visual
  logoUrl: '/logo.jpg',
  coverUrl: '/images/yeshua_og_banner_1791913374687.jpg',
  primaryColor: '#f59e0b', // Dourado Âmbar
  secondaryColor: '#d97706',
  theme: 'amber',

  // Contato e Localização
  whatsapp: '+55 92 98618-7766',
  whatsappClean: '5592986187766',
  phone: '(92) 98618-7766',
  address: 'Av. Constantino Nery, 50 — Centro',
  cityState: 'Manaus — Amazonas',
  googleMapsUrl: 'https://maps.google.com/?q=Av.+Constantino+Nery,+50+Centro+Manaus',

  // Instagram e Redes
  instagramHandle: '@barbearia_estetica_yeshua',
  instagramUrl: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
  instagramBio:
    '💈 Barbearia & Estética em Manaus • Cortes Masculinos & Barba • Estética, Sobrancelhas, Cílios & Bem-Estar • Agendamentos pelo WhatsApp',
  instagramFollowers: '4.8k',
  instagramPostsCount: '348',
  showInstagramGallery: false, // Ocultado provisoriamente a pedido do usuário

  // Administração Local
  adminPin: '1234',
  adminName: 'Gerência Yeshua',
  adminEmail: 'admin@yeshua.com',
  openingHoursNote: 'Atendimento com horário marcado e por ordem de chegada no WhatsApp.',
  allowOnlineBooking: true,
  slotIntervalMinutes: 45,

  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

// Segundo estabelecimento para validação imediata da plataforma White Label
export const INITIAL_ESTABLISHMENT_DEMO: Establishment = {
  id: 'est-imperio',
  slug: 'imperio',
  name: 'Império Club & Barbearia',
  tagline: 'Estilo & Tradição Masculina • Ponta Negra',
  status: 'active',
  isDefault: false,

  // Identidade Visual
  logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  primaryColor: '#10b981', // Esmeralda
  secondaryColor: '#059669',
  theme: 'emerald',

  // Contato e Localização
  whatsapp: '+55 92 99988-1122',
  whatsappClean: '5592999881122',
  phone: '(92) 99988-1122',
  address: 'Av. Coronel Teixeira, 1200 — Ponta Negra',
  cityState: 'Manaus — Amazonas',
  googleMapsUrl: 'https://maps.google.com/?q=Ponta+Negra+Manaus',

  // Instagram e Redes
  instagramHandle: '@imperiobarberclub',
  instagramUrl: 'https://www.instagram.com/imperiobarberclub',
  instagramBio: 'Cortes clássicos, toalha quente e bar executivo.',
  instagramFollowers: '2.1k',
  instagramPostsCount: '120',
  showInstagramGallery: false,

  // Administração Local
  adminPin: '4321',
  adminName: 'Diretoria Império',
  adminEmail: 'admin@imperio.com',
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

// Canais e publicações oficiais da Barbearia & Estética Yeshua
export const INITIAL_INSTAGRAM_EMBEDS: InstagramEmbedItem[] = [
  {
    id: 'ig-1',
    establishmentId: 'est-yeshua',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'perfil-oficial',
    title: 'Canal Oficial @barbearia_estetica_yeshua',
    caption:
      'Acesse nosso perfil oficial no Instagram para conferir todas as publicações, fotos reais de cortes degradê, barba desenhada e procedimentos estéticos em Manaus! ✨💈\n\n#BarbeariaEsteticaYeshua #BarbeariaManaus #YeshuaOficial',
    type: 'post',
    previewImageUrl: '/logo.jpg',
    likesCount: '1.2k',
    commentsCount: '84',
    date: '2026-03-01',
    featured: true,
  },
  {
    id: 'ig-2',
    establishmentId: 'est-yeshua',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'cortes-fade',
    title: 'Cortes Degradê & Barbaterapia Navalhada',
    caption:
      'Degradê navalhado com alinhamento milimétrico, toalha quente e massagem facial relaxante. Conheça as transformações reais em nosso Instagram oficial! ✂️🔥\n\n#FadeNavalhado #Barbaterapia #CorteMasculino #ManausAM',
    type: 'post',
    previewImageUrl: '/og-image.jpg',
    likesCount: '980',
    commentsCount: '62',
    date: '2026-03-02',
    featured: true,
  },
  {
    id: 'ig-3',
    establishmentId: 'est-yeshua',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'reels-transformacoes',
    title: 'Reels: Transformações & Vídeos em Alta',
    caption:
      'Acompanhe nossos vídeos em formato Reel com bastidores, passo a passo de cortes e tratamentos de estética diretamente no feed do Instagram! 🚀📱\n\n#ReelsYeshua #TransformacaoVisual #BarbeiroManaus',
    type: 'reel',
    previewImageUrl: '/logo.jpg',
    likesCount: '2.4k',
    commentsCount: '143',
    date: '2026-03-03',
    featured: true,
  },
  {
    id: 'ig-demo-1',
    establishmentId: 'est-imperio',
    url: 'https://www.instagram.com/imperiobarberclub',
    shortcode: 'imperio-welcome',
    title: 'Bem-vindo ao Império Barber Club',
    caption: 'Espaço exclusivo com cerveja artesanal e corte executivo.',
    type: 'post',
    previewImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    likesCount: '340',
    commentsCount: '22',
    date: '2026-03-01',
    featured: true,
  },
];

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
    serviceName: 'Corte Executivo & Barboterapia Império',
    serviceDuration: 50,
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '16:00',
    notes: 'Cliente VIP Império.',
    status: 'confirmado',
    createdAt: new Date().toISOString(),
  },
];

// Serviços base preparados com o catálogo Yeshua e catálogo Império
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
  // Serviços do estabelecimento Império (demonstra isolamento)
  {
    id: 'srv-imp-1',
    establishmentId: 'est-imperio',
    name: 'Corte Executivo & Barboterapia Império',
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
    name: 'Pomada Modeladora Yeshua Efeito Matte',
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
    name: 'Balm Hidratante Amadeirado Império',
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
    title: 'Corte Degradê Navalhado & Acabamento Yeshua',
    url: '/images/yeshua_post_fade_1791913375461.jpg',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
  {
    id: 'med-2',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Design de Barba & Barbaterapia com Toalha Quente',
    url: '/images/yeshua_post_beard_1791913377137.jpg',
    category: 'Barbearia',
    dateAdded: '2026-03-02',
    featured: true,
  },
  {
    id: 'med-3',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Estética Facial & Design de Sobrancelhas',
    url: '/images/yeshua_post_facial_1791913377144.jpg',
    category: 'Sobrancelhas',
    dateAdded: '2026-03-03',
    featured: true,
  },
  {
    id: 'med-4',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Lounge & Espaço Barbearia & Estética Yeshua',
    url: '/images/yeshua_og_banner_1791913374687.jpg',
    category: 'Ambiente',
    dateAdded: '2026-03-04',
    featured: true,
  },
  {
    id: 'med-5',
    establishmentId: 'est-yeshua',
    type: 'image',
    title: 'Logo Oficial Barbearia & Estética Yeshua',
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
    thumbnailUrl: '/images/yeshua_post_beard_1791913377137.jpg',
    isReelVertical: true,
    category: 'Barbearia',
    dateAdded: '2026-03-07',
    featured: true,
  },
  {
    id: 'med-imp-1',
    establishmentId: 'est-imperio',
    type: 'image',
    title: 'Corte Clássico Pompadour Império',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
];
