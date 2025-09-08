export interface EmbedData {
  id: string;
  type: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  subtitle: string;
  url: string;
  videoId?: string;
  username?: string;
  postId?: string;
  isShortUrl?: boolean; // for TikTok short URLs
  createdAt: number; // timestamp for sorting
  categories?: string[]; // array of category IDs
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export type Provider = 'menu' | 'youtube' | 'tiktok' | 'instagram';
