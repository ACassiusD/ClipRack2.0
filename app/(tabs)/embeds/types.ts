export interface EmbedData {
  id: string;
  type: 'youtube' | 'tiktok' | 'instagram';
  title: string;
  subtitle: string;
  url: string;
  videoId?: string;
  username?: string;
  postId?: string;
  createdAt: number; // timestamp for sorting
}

export type Provider = 'menu' | 'youtube' | 'tiktok' | 'instagram';
