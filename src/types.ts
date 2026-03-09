export interface HomeData {
  name: string;
  role: string;
  tagline: string;
  resumeUrl: string;
  featuredProjectIds: number[];
}

export interface AboutData {
  profileImageUrl: string;
  introText: string;
  about_services: string;
  about_experience: string;
  capabilities?: string[];
  careers?: string[];
}

export interface VideoData {
  id?: number;
  title: string;
  description: string;
  youtubeUrl: string;
}

export interface ProjectData {
  id?: number;
  title: string;
  year: string;
  type: string;
  category?: string;
  description?: string;
  role: string;
  summary: string;
  featured: boolean;
  sort_order?: number;
  home_order?: number;
  thumbnailUrl: string;
  tech: {
    camera: string;
    lens: string;
    lighting: string;
    color: string;
  };
  videos: VideoData[];
}

export interface EquipmentItem {
  id?: number;
  category: 'Camera' | 'Lens' | 'Lighting' | 'Color';
  name: string;
  note: string;
}

export interface ContactData {
  email: string;
  instagramUrl: string;
  instagramText: string;
  phone: string;
  resumeUrl: string;
}
