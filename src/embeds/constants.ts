import { Category, EmbedData } from './types';

// Starter embed data - these are always generated when the app starts
export const STARTER_EMBEDS: EmbedData[] = [
  {
    id: 'youtube-starter',
    type: 'youtube',
    title: 'YouTube Short',
    subtitle: 'Open LV3mChwupF8',
    url: 'https://www.youtube.com/watch?v=LV3mChwupF8',
    videoId: 'LV3mChwupF8',
    createdAt: Date.now()
  },
  {
    id: 'tiktok-starter',
    type: 'tiktok',
    title: 'TikTok',
    subtitle: '@majasrecipes',
    url: 'https://www.tiktok.com/@majasrecipes/video/7498864456584285445',
    username: 'majasrecipes',
    postId: '7498864456584285445',
    createdAt: Date.now()
  },
  {
    id: 'instagram-starter',
    type: 'instagram',
    title: 'Instagram',
    subtitle: 'DI66ERaTsm8',
    url: 'https://www.instagram.com/p/DI66ERaTsm8/',
    postId: 'DI66ERaTsm8',
    createdAt: Date.now()
  }
];

// Storage keys
export const STORAGE_KEYS = {
  DYNAMIC_EMBEDS: 'cliprack_dynamic_embeds',
  CATEGORIES: 'cliprack_categories'
};

// Default categories
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    color: '#FF6B6B',
    createdAt: Date.now()
  },
  {
    id: 'funny',
    name: 'Funny',
    color: '#4ECDC4',
    createdAt: Date.now()
  },
  {
    id: 'educational',
    name: 'Educational',
    color: '#45B7D1',
    createdAt: Date.now()
  },
  {
    id: 'music',
    name: 'Music',
    color: '#96CEB4',
    createdAt: Date.now()
  },
  {
    id: 'sports',
    name: 'Sports',
    color: '#FFEAA7',
    createdAt: Date.now()
  },
  {
    id: 'cooking',
    name: 'Cooking',
    color: '#DDA0DD',
    createdAt: Date.now()
  }
];

// Category colors for new categories
export const CATEGORY_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#10AC84',
  '#EE5A24', '#0984E3', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'
];
