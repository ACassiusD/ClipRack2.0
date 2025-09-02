import { EmbedData } from './types';

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
  DYNAMIC_EMBEDS: 'cliprack_dynamic_embeds'
};
