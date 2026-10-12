export type MediaCategory =
  | 'Cílios'
  | 'Sobrancelhas'
  | 'Cabelos'
  | 'Unhas'
  | 'Barbearia'
  | 'Tranças'
  | 'Produtos'
  | 'Ambiente'
  | 'Outros';

export interface CompanyInfo {
  name: string;
  instagramHandle: string;
  instagramUrl: string;
  instagramBio?: string;
  instagramFollowers?: string;
  instagramPostsCount?: string;
  whatsapp: string;
  whatsappClean: string;
  address: string;
  cityState: string;
  openingHoursNote?: string;
  adminPin: string;
}

export interface InstagramEmbedItem {
  id: string;
  url: string;
  shortcode: string;
  title: string;
  caption?: string;
  type: 'post' | 'reel';
  previewImageUrl?: string;
  likesCount?: string;
  commentsCount?: string;
  date?: string;
  featured?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price?: number | null;
  durationMinutes?: number | null;
  category: string;
  imageUrl?: string;
  featured: boolean;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  mainImage: string;
  additionalImages?: string[];
  available: boolean;
  category: string;
  featured: boolean;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  url: string;
  thumbnailUrl?: string;
  isReelVertical?: boolean;
  category: MediaCategory;
  dateAdded: string;
  featured: boolean;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  createdAt: string;
}

export type PageView =
  | 'home'
  | 'servicos'
  | 'agendamento'
  | 'produtos'
  | 'produto-detalhe'
  | 'galeria'
  | 'contato'
  | 'admin';

export type AdminTab =
  | 'dashboard'
  | 'servicos'
  | 'produtos'
  | 'galeria'
  | 'videos'
  | 'agendamentos'
  | 'instagram'
  | 'configuracoes';
