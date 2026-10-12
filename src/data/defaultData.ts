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
  instagramUrl: 'https://www.instagram.com/barbearia_estetica_yeshua/',
  instagramBio:
    '💈 Barbearia & Estética em Manaus • Cortes Masculinos & Barba • Cílios, Sobrancelhas, Tranças & Unhas • Agendamentos pelo WhatsApp',
  instagramFollowers: '4.8k',
  instagramPostsCount: '348',
  whatsapp: '+55 92 98618-7766',
  whatsappClean: '5592986187766',
  address: 'Av. Constantino Nery, 50 — Centro',
  cityState: 'Manaus — Amazonas',
  openingHoursNote: 'Atendimento sob agendamento e ordem de chegada no WhatsApp.',
  adminPin: '1234',
};

// Posts e Reels embedados do Instagram da Yeshua
export const INITIAL_INSTAGRAM_EMBEDS: InstagramEmbedItem[] = [
  {
    id: 'ig-1',
    url: 'https://www.instagram.com/p/DFcut01Yesh/',
    shortcode: 'DFcut01Yesh',
    title: 'Degradê Navalhado & Alinhamento de Barba',
    caption:
      'Degradê impecável e alinhamento de barba na navalha. O padrão que você só encontra aqui na Barbearia & Estética Yeshua! 💈 Agende seu horário pelo link.',
    type: 'post',
    previewImageUrl:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
    likesCount: '482',
    commentsCount: '34',
    date: '2026-03-01',
    featured: true,
  },
  {
    id: 'ig-2',
    url: 'https://www.instagram.com/p/DFlas02Yesh/',
    shortcode: 'DFlas02Yesh',
    title: 'Extensão de Cílios Volume Brasileiro',
    caption:
      'Olhar marcante com leveza e naturalidade. Volume Brasileiro feito com técnicas avançadas para máxima retenção e conforto. ✨',
    type: 'post',
    previewImageUrl:
      'https://images.unsplash.com/photo-1583001809863-2342a7b6f3a1?auto=format&fit=crop&w=900&q=80',
    likesCount: '620',
    commentsCount: '58',
    date: '2026-03-02',
    featured: true,
  },
  {
    id: 'ig-3',
    url: 'https://www.instagram.com/reel/DFrel03Yesh/',
    shortcode: 'DFrel03Yesh',
    title: 'Reel: Transformação Visual Masculina',
    caption:
      'Do clássico ao moderno: veja o antes e depois dessa transformação completa de barba e cabelo! 🚀🔥 #BarbeariaManaus #Yeshua',
    type: 'reel',
    previewImageUrl:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=900&q=80',
    likesCount: '1.2k',
    commentsCount: '89',
    date: '2026-03-03',
    featured: true,
  },
  {
    id: 'ig-4',
    url: 'https://www.instagram.com/p/DFsob04Yesh/',
    shortcode: 'DFsob04Yesh',
    title: 'Design & Micropigmentação de Sobrancelhas',
    caption:
      'Harmonização facial através do design de sobrancelhas personalizado para cada traço do seu rosto. 💖',
    type: 'post',
    previewImageUrl:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    likesCount: '395',
    commentsCount: '27',
    date: '2026-03-04',
    featured: true,
  },
  {
    id: 'ig-5',
    url: 'https://www.instagram.com/reel/DFtra05Yesh/',
    shortcode: 'DFtra05Yesh',
    title: 'Reel: Tranças Nagô com Desenho Exclusivo',
    caption:
      'Arte, cultura e identidade: tranças nagô masculinas e femininas com acabamento perfeito e durabilidade. ⚡',
    type: 'reel',
    previewImageUrl:
      'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=900&q=80',
    likesCount: '840',
    commentsCount: '41',
    date: '2026-03-05',
    featured: true,
  },
  {
    id: 'ig-6',
    url: 'https://www.instagram.com/p/DFunh06Yesh/',
    shortcode: 'DFunh06Yesh',
    title: 'Alongamento em Gel & Esmaltação Duradoura',
    caption:
      'Elegância nas pontas dos dedos. Alongamento em gel resistente e acabamento delicado para o seu dia a dia. ✨💅',
    type: 'post',
    previewImageUrl:
      'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
    likesCount: '512',
    commentsCount: '39',
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
    title: 'Design de Barba & Fade Masculino',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
    category: 'Barbearia',
    dateAdded: '2026-03-01',
    featured: true,
  },
  {
    id: 'med-2',
    type: 'image',
    title: 'Alongamento de Cílios Volume Brasileiro',
    url: 'https://images.unsplash.com/photo-1583001809863-2342a7b6f3a1?auto=format&fit=crop&w=900&q=80',
    category: 'Cílios',
    dateAdded: '2026-03-02',
    featured: true,
  },
  {
    id: 'med-3',
    type: 'image',
    title: 'Design e Micropigmentação de Sobrancelhas',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    category: 'Sobrancelhas',
    dateAdded: '2026-03-03',
    featured: true,
  },
  {
    id: 'med-4',
    type: 'image',
    title: 'Tranças Nagô com Desenho Exclusivo',
    url: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=900&q=80',
    category: 'Tranças',
    dateAdded: '2026-03-04',
    featured: true,
  },
  {
    id: 'med-5',
    type: 'image',
    title: 'Unhas em Gel e Nail Art Delicada',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
    category: 'Unhas',
    dateAdded: '2026-03-05',
    featured: true,
  },
  {
    id: 'med-6',
    type: 'image',
    title: 'Ambiente Sofisticado Barbearia & Estética Yeshua',
    url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80',
    category: 'Ambiente',
    dateAdded: '2026-03-06',
    featured: true,
  },
  {
    id: 'med-7',
    type: 'video',
    title: 'Transformação Visual e Finalização Barbearia',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-shaving-a-mans-beard-with-a-razor-41484-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
    isReelVertical: true,
    category: 'Barbearia',
    dateAdded: '2026-03-07',
    featured: true,
  },
];
