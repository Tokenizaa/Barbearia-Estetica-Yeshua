import {
  CompanyInfo,
  ServiceItem,
  ProductItem,
  MediaItem,
  Appointment,
  InstagramEmbedItem,
} from '../types';

export const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: 'Barbearia & Estética Yeshua',
  instagramHandle: '@barbearia_estetica_yeshua',
  instagramUrl: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
  instagramBio:
    '💈 Barbearia & Estética em Manaus • Cortes Masculinos & Barba • Estética, Sobrancelhas, Cílios & Bem-Estar • Agendamentos pelo WhatsApp',
  instagramFollowers: '4.8k',
  instagramPostsCount: '348',
  whatsapp: '+55 92 98618-7766',
  whatsappClean: '5592986187766',
  address: 'Av. Constantino Nery, 50 — Centro',
  cityState: 'Manaus — Amazonas',
  openingHoursNote: 'Atendimento com horário marcado e por ordem de chegada no WhatsApp.',
  adminPin: '1234',
  logoUrl: '/logo.jpg',
};

// Canais e publicações oficiais da Barbearia & Estética Yeshua conectados ao perfil real
export const INITIAL_INSTAGRAM_EMBEDS: InstagramEmbedItem[] = [
  {
    id: 'ig-1',
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
    id: 'ig-4',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'estetica-facial',
    title: 'Estética Facial, Sobrancelhas & Cuidados',
    caption:
      'Design de sobrancelhas personalizado, extensão de cílios, limpeza de pele e bem-estar em um espaço exclusivo no coração de Manaus. 💆‍♂️✨\n\n#EsteticaYeshua #DesignDeSobrancelhas #CiliosManaus',
    type: 'post',
    previewImageUrl: '/og-image.jpg',
    likesCount: '850',
    commentsCount: '48',
    date: '2026-03-04',
    featured: true,
  },
  {
    id: 'ig-5',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'espaco-vip',
    title: 'Estrutura & Lounge VIP Barbearia Yeshua',
    caption:
      'Ambiente climatizado, atendimento diferenciado e equipamentos de primeira linha para você relaxar enquanto cuida do seu estilo. ☕💈\n\n#LoungeYeshua #BarbeariaPremium #CentroManaus',
    type: 'post',
    previewImageUrl: '/logo.jpg',
    likesCount: '1.1k',
    commentsCount: '72',
    date: '2026-03-05',
    featured: true,
  },
  {
    id: 'ig-6',
    url: 'https://www.instagram.com/barbearia_estetica_yeshua?igsh=MTdsZ21rODA1Zjlvdg%3D%3D',
    shortcode: 'agendamento-vip',
    title: 'Agendamentos & Contato VIP WhatsApp',
    caption:
      'Garanta seu horário com facilidade pelo nosso site ou direto pelo WhatsApp. Atendimento pontual e equipe qualificada! 📲💈\n\n#AgendamentoYeshua #AtendimentoVip #Manaus',
    type: 'post',
    previewImageUrl: '/og-image.jpg',
    likesCount: '910',
    commentsCount: '55',
    date: '2026-03-06',
    featured: true,
  },
];

// Exemplo inicial de agendamentos para demonstrar bloqueio e pedidos do WhatsApp
const getInitialAppointments = (): Appointment[] => {
  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(today.getDate() + 1);
  const d1Iso = d1.toISOString().split('T')[0];

  const d2 = new Date(today);
  d2.setDate(today.getDate() + 2);
  const d2Iso = d2.toISOString().split('T')[0];

  return [
    {
      id: 'apt-sample-1',
      clientName: 'Marcos Silva (Exemplo Confirmado)',
      clientPhone: '(92) 99123-4567',
      serviceId: 'srv-1',
      serviceName: 'Corte de Cabelo Masculino & Barba',
      serviceDuration: 45,
      date: d1Iso,
      time: '14:00',
      notes: 'Cliente prefere corte degradê navalhado.',
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-sample-2',
      clientName: 'Carla Oliveira (Exemplo Pedido WhatsApp)',
      clientPhone: '(92) 98456-7890',
      serviceId: 'srv-2',
      serviceName: 'Extensão de Cílios',
      serviceDuration: 90,
      date: d2Iso,
      time: '10:30',
      notes: 'Solicitação enviada via link do WhatsApp pelo site.',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    },
  ];
};

export const INITIAL_APPOINTMENTS: Appointment[] = getInitialAppointments();

// Serviços base preparados para o catálogo (preços omitidos para não inventar valores)
export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
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
    name: 'Manicure & Pedicure',
    category: 'Unhas',
    description: 'Esmaltação, cutilagem e cuidados estéticos para as mãos e pés.',
    price: null,
    durationMinutes: 50,
    imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
    featured: false,
  },
];

// Produtos iniciais preparados (o administrador poderá cadastrar ou editar fotos e preços reais)
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
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
    name: 'Sérum Fortalecedor para Sobrancelhas e Cílios',
    category: 'Estética',
    description: 'Fórmula nutritiva que estimula o crescimento e alinhamento dos fios.',
    price: 49.9,
    mainImage: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    additionalImages: [],
    available: true,
    featured: true,
  },
];

// Galeria preparada com as categorias solicitadas pelo projeto
export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    type: 'image',
    title: 'Corte Degradê Navalhado & Acabamento Yeshua',
    url: '/images/yeshua_post_fade_1791913375461.jpg',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
  {
    id: 'med-2',
    type: 'image',
    title: 'Design de Barba & Barbaterapia com Toalha Quente',
    url: '/images/yeshua_post_beard_1791913377137.jpg',
    category: 'Barbearia',
    dateAdded: '2026-03-02',
    featured: true,
  },
  {
    id: 'med-3',
    type: 'image',
    title: 'Estética Facial & Design de Sobrancelhas',
    url: '/images/yeshua_post_facial_1791913377144.jpg',
    category: 'Sobrancelhas',
    dateAdded: '2026-03-03',
    featured: true,
  },
  {
    id: 'med-4',
    type: 'image',
    title: 'Lounge & Espaço Barbearia & Estética Yeshua',
    url: '/images/yeshua_og_banner_1791913374687.jpg',
    category: 'Ambiente',
    dateAdded: '2026-03-04',
    featured: true,
  },
  {
    id: 'med-5',
    type: 'image',
    title: 'Logo Oficial Barbearia & Estética Yeshua',
    url: '/logo.jpg',
    category: 'Ambiente',
    dateAdded: '2026-03-05',
    featured: true,
  },
  {
    id: 'med-6',
    type: 'image',
    title: 'Tranças Nagô & Acabamento Artístico',
    url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=900&q=80',
    category: 'Tranças',
    dateAdded: '2026-03-06',
    featured: true,
  },
  {
    id: 'med-7',
    type: 'video',
    title: 'Transformação Visual e Finalização Barbearia',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-shaving-a-mans-beard-with-a-razor-41484-large.mp4',
    thumbnailUrl: '/images/yeshua_post_beard_1791913377137.jpg',
    isReelVertical: true,
    category: 'Barbearia',
    dateAdded: '2026-03-07',
    featured: true,
  },
];
