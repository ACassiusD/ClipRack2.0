/**
 * EmbedsScreen - Main component for displaying and managing social media clips
 * 
 * Features:
 * - Grid layout of video clips (YouTube, TikTok, Instagram)
 * - Share intent integration for adding new clips
 * - Thumbnail previews and embed playback
 * - Persistent storage with AsyncStorage
 * - Delete functionality for individual clips
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, FlatList, Image, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { CATEGORY_COLORS, DEFAULT_CATEGORIES, STARTER_EMBEDS, STORAGE_KEYS } from '../../src/embeds/constants';
import { styles } from '../../src/embeds/styles';
import { Category, EmbedData, Provider } from '../../src/embeds/types';

// ============================================================================
// HTML Generation Utilities
// ============================================================================

/** Generates YouTube embed HTML with responsive iframe */
const generateYouTubeHtml = (videoId: string): string => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0`;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;height:100%;} .wrap{position:fixed;inset:0;}
  iframe{border:0;width:100%;height:100%;display:block}
  </style></head><body>
  <div class="wrap">
    <iframe src="${embedUrl}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  </div>
  </body></html>`;
};

/** Generates TikTok embed HTML using TikTok's embed script */
const generateTikTokHtml = (postId: string): string => {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;} .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .tiktok-embed{margin:0 auto;width:100%;max-width:500px;}
  </style></head><body>
  <div class="wrap">
    <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@majasrecipes/video/${postId}" data-video-id="${postId}" data-embed-from="oembed">
      <section></section>
    </blockquote>
  </div>
  <script async src="https://www.tiktok.com/embed.js"></script>
  </body></html>`;
};

/** Generates Instagram embed HTML using Instagram's embed script */
const generateInstagramHtml = (postId: string): string => {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;} .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .instagram-media{margin:0 auto;}
  </style></head><body>
  <div class="wrap">
    <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14"></blockquote>
  </div>
  <script async src="https://www.instagram.com/embed.js"></script>
  </body></html>`;
};

/** Generates Instagram tile HTML for grid cards - sized to fit within card constraints */
const generateInstagramTileHtml = (postId: string): string => {
  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body { margin:0; padding:0; height:100%; background:#000; }
  /* Center the embed within the tile */
  .wrap {
    display:flex; align-items:center; justify-content:center;
    width:100%; height:100%; /* Use full available height */
    position:relative; /* Better positioning control */
  }
  /* Kill Instagram's min/max constraints and let it shrink */
  .instagram-media {
    margin:0 auto !important;
    max-width:100% !important;
    min-width:0 !important;
    width:100% !important;
    transform: scale(1.5) translateY(50px); /* 1.5x zoom + 50px down */
    transform-origin: center center; /* Scale from center */
  }
  /* Instagram injects inner wrappers; make sure they don't force width */
  .instagram-media, .instagram-media * {
    box-sizing:border-box;
    max-width:100% !important;
  }
</style>
</head>
<body>
  <div class="wrap">
    <blockquote class="instagram-media"
      data-instgrm-permalink="https://www.instagram.com/p/${postId}/"
      data-instgrm-version="14"></blockquote>
  </div>
  <script async src="https://www.instagram.com/embed.js"></script>
</body>
</html>`;
};

/** Main HTML generator - routes to appropriate platform-specific generator */
const generateEmbedHtml = (embed: EmbedData): string => {
  if (!embed.type) {
    return '<html><body><p>Invalid embed data: missing type</p></body></html>';
  }
  
  switch (embed.type) {
    case 'youtube':
      if (embed.videoId) {
        return generateYouTubeHtml(embed.videoId);
      }
      break;
    case 'tiktok':
      if (embed.postId) {
        return generateTikTokHtml(embed.postId);
      }
      break;
    case 'instagram':
      if (embed.postId) {
        return generateInstagramHtml(embed.postId);
      }
      break;
  }
  return '<html><body><p>Invalid embed data</p></body></html>';
};

// ============================================================================
// URL Parsing & Thumbnail Utilities
// ============================================================================

/** Returns base URL for WebView origin whitelist */
const getBaseUrl = (type: 'youtube' | 'tiktok' | 'instagram'): string => {
  switch (type) {
    case 'youtube': return 'https://www.youtube.com';
    case 'tiktok': return 'https://www.tiktok.com';
    case 'instagram': return 'https://www.instagram.com';
  }
};

/** Resolves TikTok short URL to full format */
const resolveTikTokShortUrl = async (shortUrl: string): Promise<string | null> => {
  try {
    console.log('🔄 Resolving TikTok short URL:', shortUrl);
    
    // Make a HEAD request to get the redirect URL
    const response = await fetch(shortUrl, { 
      method: 'HEAD',
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    // Check if we got a redirect
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log('✅ Resolved TikTok URL:', location);
        return location;
      }
    }
    
    // If no redirect, try a GET request with redirect following
    const getResponse = await fetch(shortUrl, { redirect: 'follow' });
    if (getResponse.url !== shortUrl) {
      console.log('✅ Resolved TikTok URL via GET:', getResponse.url);
      return getResponse.url;
    }
    
    console.log('❌ Could not resolve TikTok short URL');
    return null;
    
  } catch (error) {
    console.log('❌ Error resolving TikTok short URL:', error);
    return null;
  }
};

/** Fetches TikTok thumbnail via oEmbed API with fallback URL construction */
const fetchTikTokThumbnail = async (videoId: string, isShortUrl: boolean = false): Promise<string | null> => {
  try {
    if (isShortUrl) {
      // For short URLs, we can't use oEmbed API directly
      // Return a placeholder or try to construct a generic thumbnail
      console.log('🔄 Short TikTok URL detected, using placeholder');
      return null; // Will fall back to the "TIKTOK" text display
    }
    
    // Try TikTok's oEmbed API first
    const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@username/video/${videoId}`;
    const response = await fetch(oembedUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.thumbnail_url) {
        console.log('✅ TikTok thumbnail from oEmbed:', data.thumbnail_url);
        return data.thumbnail_url;
      }
    }
    
    // Fallback: Try to construct thumbnail URL from video ID
    // This is a common pattern for TikTok thumbnails
    const fallbackUrl = `https://p16-sign-va.tiktokcdn-us.com/obj/tos-useast2a-p-0037-euttp/${videoId}_n.jpeg`;
    console.log('🔄 Trying TikTok fallback thumbnail:', fallbackUrl);
    return fallbackUrl;
    
  } catch (error) {
    console.log('❌ TikTok thumbnail fetch error:', error);
    return null;
  }
};


/** Returns thumbnail URL for YouTube, null for others (handled separately) */
const getThumbnailUrl = (embed: EmbedData): string | null => {
  if (!embed.type) {
    return null;
  }
  
  switch (embed.type) {
    case 'youtube':
      if (embed.videoId) {
        return `https://img.youtube.com/vi/${embed.videoId}/hqdefault.jpg`;
      }
      break;
    case 'tiktok':
      // TikTok thumbnails need to be fetched dynamically
      return null;
    case 'instagram':
      // Instagram uses WebView embeds, no thumbnail needed
      return null;
  }
  return null;
};

/** Parses Instagram URLs (posts/reels) and extracts post ID, username, and content type */
const parseInstagramUrl = (url: string): { postId: string; username?: string; contentType: 'post' | 'reel' } | null => {
  // Instagram URL patterns:
  // https://www.instagram.com/p/POST_ID/ (posts)
  // https://www.instagram.com/reel/REEL_ID/ (reels)
  // https://www.instagram.com/username/p/POST_ID/
  // https://www.instagram.com/username/reel/REEL_ID/
  const instagramRegex = /(?:https?:\/\/(?:www\.)?instagram\.com(?:\/[^\/]+)?\/(p|reel)\/([^\/\?]+))/;
  const match = url.match(instagramRegex);
  
  if (match) {
    const contentType = match[1] as 'post' | 'reel';
    const postId = match[2];
    
    // Extract username if present
    const usernameMatch = url.match(/instagram\.com\/([^\/]+)\/(p|reel)\//);
    const username = usernameMatch ? usernameMatch[1] : undefined;
    
    return { postId, username, contentType };
  }
  
  return null;
};

/** Parses YouTube URLs and extracts video ID */
const parseYouTubeUrl = (url: string): { videoId: string } | null => {
  // YouTube URL patterns:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID (YouTube Shorts)
  // https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
  const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)|https?:\/\/youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  
  if (match) {
    return { videoId: match[1] };
  }
  
  return null;
};

/** Parses TikTok URLs and extracts video ID and username */
const parseTikTokUrl = (url: string): { postId: string; username?: string; isShortUrl?: boolean } | null => {
  // TikTok URL patterns:
  // https://www.tiktok.com/@username/video/POST_ID (full format)
  // https://tiktok.com/@username/video/POST_ID (full format)
  // https://vt.tiktok.com/SHORT_ID (shortened format)
  const fullTiktokRegex = /(?:https?:\/\/(?:www\.)?tiktok\.com\/@([^\/]+)\/video\/([^\/\?]+))/;
  const shortTiktokRegex = /(?:https?:\/\/vt\.tiktok\.com\/([^\/\?]+))/;
  
  const fullMatch = url.match(fullTiktokRegex);
  if (fullMatch) {
    const username = fullMatch[1];
    const postId = fullMatch[2];
    return { postId, username };
  }
  
  const shortMatch = url.match(shortTiktokRegex);
  if (shortMatch) {
    const shortId = shortMatch[1];
    return { postId: shortId, isShortUrl: true };
  }
  
  return null;
};

/** Creates EmbedData object from shared URL, converts reel URLs to post format */
const createEmbedFromUrl = async (url: string): Promise<EmbedData | null> => {
  // Try Instagram first
  const instagramData = parseInstagramUrl(url);
  if (instagramData) {
    const contentType = instagramData.contentType === 'reel' ? 'Reel' : 'Post';
    
    // Convert reel URLs to post format for consistency
    const cleanUrl = instagramData.contentType === 'reel' 
      ? `https://www.instagram.com/p/${instagramData.postId}/`
      : url;
    
    return {
      id: `instagram-${instagramData.postId}-${Date.now()}`,
      type: 'instagram',
      title: `Instagram ${contentType}`,
      subtitle: instagramData.username ? `@${instagramData.username}` : instagramData.postId,
      url: cleanUrl, // Use the cleaned URL
      postId: instagramData.postId,
      username: instagramData.username,
      createdAt: Date.now()
    };
  }
  
  // Try YouTube
  const youtubeData = parseYouTubeUrl(url);
  if (youtubeData) {
    const isShorts = url.includes('/shorts/');
    return {
      id: `youtube-${youtubeData.videoId}-${Date.now()}`,
      type: 'youtube',
      title: isShorts ? 'YouTube Short' : 'YouTube Video',
      subtitle: `Open ${youtubeData.videoId}`,
      url: url,
      videoId: youtubeData.videoId,
      createdAt: Date.now()
    };
  }
  
  // Try TikTok
  const tiktokData = parseTikTokUrl(url);
  if (tiktokData) {
    let finalUrl = url;
    let finalPostId = tiktokData.postId;
    let finalUsername = tiktokData.username;
    let isShortUrl = tiktokData.isShortUrl;
    
    // If it's a short URL, try to resolve it
    if (tiktokData.isShortUrl) {
      const resolvedUrl = await resolveTikTokShortUrl(url);
      if (resolvedUrl) {
        // Parse the resolved URL to get the full format data
        const resolvedData = parseTikTokUrl(resolvedUrl);
        if (resolvedData && !resolvedData.isShortUrl) {
          finalUrl = resolvedUrl;
          finalPostId = resolvedData.postId;
          finalUsername = resolvedData.username;
          isShortUrl = false;
          console.log('✅ Successfully resolved TikTok short URL to full format');
        }
      }
    }
    
    return {
      id: `tiktok-${finalPostId}-${Date.now()}`,
      type: 'tiktok',
      title: 'TikTok Video',
      subtitle: finalUsername ? `@${finalUsername}` : (isShortUrl ? 'Short URL' : finalPostId),
      url: finalUrl,
      postId: finalPostId,
      username: finalUsername,
      isShortUrl: isShortUrl,
      createdAt: Date.now()
    };
  }
  
  return null;
};

// ============================================================================
// Storage Functions
// ============================================================================

/** Saves dynamic embeds to AsyncStorage */
const saveDynamicEmbeds = async (embeds: EmbedData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DYNAMIC_EMBEDS, JSON.stringify(embeds));
  } catch (error) {
    console.error('Failed to save dynamic embeds:', error);
  }
};


/** Loads dynamic embeds from AsyncStorage */
const loadDynamicEmbeds = async (): Promise<EmbedData[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_EMBEDS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load dynamic embeds:', error);
    return [];
  }
};

/** Saves categories to AsyncStorage */
const saveCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save categories:', error);
  }
};

/** Loads categories from AsyncStorage */
const loadCategories = async (): Promise<Category[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Failed to load categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

// ============================================================================
// Main Component
// ============================================================================

/** Main EmbedsScreen component - handles grid display, share intents, and embed playback */
export default function EmbedsScreen() {
  const [active, setActive] = React.useState<Provider>('menu');
  const [selectedEmbed, setSelectedEmbed] = React.useState<EmbedData | null>(null);
  const [dynamicEmbeds, setDynamicEmbeds] = React.useState<EmbedData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [tiktokThumbnails, setTiktokThumbnails] = React.useState<Record<string, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = React.useState<Set<string>>(new Set());
  const [loadingInstagramEmbeds, setLoadingInstagramEmbeds] = React.useState<Set<string>>(new Set());
  const [showShareBanner, setShowShareBanner] = React.useState(false);
  const [showFilterPage, setShowFilterPage] = React.useState(false);
  const [selectedSites, setSelectedSites] = React.useState<Set<string>>(new Set(['youtube', 'tiktok', 'instagram']));
  const [refreshing, setRefreshing] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [showClipDetails, setShowClipDetails] = React.useState(false);
  const [selectedClipForDetails, setSelectedClipForDetails] = React.useState<EmbedData | null>(null);
  const [showCategoryManager, setShowCategoryManager] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [filterByCategory, setFilterByCategory] = React.useState<string | null>(null);
  
  // Ref to track if thumbnails have been loaded to prevent Strict Mode double execution
  const thumbnailsLoadedRef = React.useRef(false);
  
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  // Load saved dynamic embeds and categories on component mount
  React.useEffect(() => {
    const loadSavedData = async () => {
      const [savedEmbeds, savedCategories] = await Promise.all([
        loadDynamicEmbeds(),
        loadCategories()
      ]);
      setDynamicEmbeds(savedEmbeds);
      setCategories(savedCategories);
      setIsLoading(false);
    };
    loadSavedData();
  }, []);

  // Fetch thumbnails for specific embeds only (TikTok only)
  const fetchThumbnailsForEmbeds = React.useCallback(async (embeds: EmbedData[]) => {
    const tiktokEmbeds = embeds.filter(embed => embed.type === 'tiktok' && embed.postId);
    
    // Fetch TikTok thumbnails
    for (const embed of tiktokEmbeds) {
      if (embed.postId) {
        // Check current state values directly instead of relying on closure
        setTiktokThumbnails(currentThumbnails => {
          setLoadingThumbnails(currentLoading => {
            if (!currentThumbnails[embed.postId!] && !currentLoading.has(embed.postId!)) {
              console.log('🔄 Fetching TikTok thumbnail for:', embed.postId);
              
              // Mark as loading
              const newLoading = new Set([...currentLoading, embed.postId!]);
              setLoadingThumbnails(newLoading);
              
              // Fetch thumbnail asynchronously
              fetchTikTokThumbnail(embed.postId!, Boolean(embed.isShortUrl))
                .then(thumbnailUrl => {
                  if (thumbnailUrl) {
                    setTiktokThumbnails(prev => ({
                      ...prev,
                      [embed.postId!]: thumbnailUrl
                    }));
                  }
                })
                .catch(error => {
                  console.error('Failed to fetch TikTok thumbnail for:', embed.postId, error);
                })
                .finally(() => {
                  // Remove from loading state
                  setLoadingThumbnails(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(embed.postId!);
                    return newSet;
                  });
                });
            }
            return currentLoading;
          });
          return currentThumbnails;
        });
      }
    }
  }, []); // Remove dependencies to prevent re-creation


  // Initial load: fetch thumbnails for all embeds on first load
  React.useEffect(() => {
    if (!isLoading && dynamicEmbeds.length > 0 && !thumbnailsLoadedRef.current) {
      thumbnailsLoadedRef.current = true;
      fetchThumbnailsForEmbeds([...STARTER_EMBEDS, ...dynamicEmbeds]);
    }
  }, [isLoading, dynamicEmbeds, fetchThumbnailsForEmbeds]);

  /** Removes embed from state and AsyncStorage */
  const deleteEmbed = async (embedId: string): Promise<void> => {
    try {
      const newEmbeds = dynamicEmbeds.filter(e => e.id !== embedId);
      setDynamicEmbeds(newEmbeds);
      await saveDynamicEmbeds(newEmbeds);
      console.log('🗑️ Deleted embed:', embedId);
    } catch (error) {
      console.error('Failed to delete embed:', error);
    }
  };

  /** Updates embed categories */
  const updateEmbedCategories = async (embedId: string, newCategories: string[]): Promise<void> => {
    try {
      const updatedEmbeds = dynamicEmbeds.map(embed => 
        embed.id === embedId 
          ? { ...embed, categories: newCategories }
          : embed
      );
      setDynamicEmbeds(updatedEmbeds);
      await saveDynamicEmbeds(updatedEmbeds);
      console.log('🏷️ Updated embed categories:', embedId, newCategories);
    } catch (error) {
      console.error('Failed to update embed categories:', error);
    }
  };

  /** Creates a new category */
  const createCategory = async (name: string): Promise<void> => {
    if (!name.trim()) return;
    
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: name.trim(),
      color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
      createdAt: Date.now()
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await saveCategories(updatedCategories);
    setNewCategoryName('');
    console.log('➕ Created new category:', newCategory);
  };

  /** Deletes a category */
  const deleteCategory = async (categoryId: string): Promise<void> => {
    // Remove category from all embeds
    const updatedEmbeds = dynamicEmbeds.map(embed => ({
      ...embed,
      categories: embed.categories?.filter(id => id !== categoryId) || []
    }));
    
    // Remove category from categories list
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    
    setCategories(updatedCategories);
    setDynamicEmbeds(updatedEmbeds);
    await Promise.all([
      saveCategories(updatedCategories),
      saveDynamicEmbeds(updatedEmbeds)
    ]);
    console.log('🗑️ Deleted category:', categoryId);
  };

  /** Refreshes the clips list */
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset the thumbnails loaded flag
      thumbnailsLoadedRef.current = false;
      
      // Reload saved embeds
      const saved = await loadDynamicEmbeds();
      setDynamicEmbeds(saved);
      
      // Clear thumbnails to force re-fetch
      setTiktokThumbnails({});
      setLoadingThumbnails(new Set());
      setLoadingInstagramEmbeds(new Set());
      
      // Re-fetch all thumbnails
      fetchThumbnailsForEmbeds([...STARTER_EMBEDS, ...saved]);
      
      console.log('🔄 Refreshed clips list');
    } catch (error) {
      console.error('Failed to refresh clips:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchThumbnailsForEmbeds]);

  // Process shared content and create embeds
  React.useEffect(() => {
    if (hasShareIntent && shareIntent.webUrl) {
      console.log('🔄 Processing shared URL:', shareIntent.webUrl);
      
      const processShareIntent = async () => {
        const embed = await createEmbedFromUrl(shareIntent.webUrl!);
        console.log('🎬 Created embed object:', embed);
        
        if (embed) {
          // Check if this embed already exists (by URL, not ID since ID includes timestamp)
          const exists = dynamicEmbeds.some(e => e.url === embed.url);
          console.log('🔍 Embed already exists:', exists);
          
          if (!exists) {
            const newEmbeds = [...dynamicEmbeds, embed];
            setDynamicEmbeds(newEmbeds);
            
            // Save to AsyncStorage
            saveDynamicEmbeds(newEmbeds);
            console.log('💾 Saved embed to storage');
            
            // Fetch thumbnail only for the new clip (incremental loading)
            fetchThumbnailsForEmbeds([embed]);
            
            // Show the banner for 8 seconds
            setShowShareBanner(true);
            setTimeout(() => {
              setShowShareBanner(false);
            }, 8000);
            
            // Don't automatically show the clip - just stay on the clips list
            // User can tap on the new clip card to view it
            console.log('💾 Clip created and saved - staying on clips list');
          } else {
            console.log('🔍 Clip already exists - staying on clips list');
          }
        } else {
          console.log('❌ Failed to create embed from URL');
        }
      };
      
      processShareIntent();
    }
  }, [hasShareIntent, shareIntent.webUrl, dynamicEmbeds, fetchThumbnailsForEmbeds]);

  // Combine starter embeds with dynamic embeds, with dynamic embeds always on top, then apply filters
  const allEmbeds = [...dynamicEmbeds, ...STARTER_EMBEDS]
    .filter(embed => {
      // Filter by platform
      if (!selectedSites.has(embed.type || '')) return false;
      
      // Filter by category if selected
      if (filterByCategory) {
        return embed.categories?.includes(filterByCategory) || false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // If both are dynamic embeds, sort by creation time (newest first)
      const aIsDynamic = dynamicEmbeds.some(e => e.id === a.id);
      const bIsDynamic = dynamicEmbeds.some(e => e.id === b.id);
      
      if (aIsDynamic && bIsDynamic) {
        return b.createdAt - a.createdAt;
      }
      // If one is dynamic and one is starter, dynamic comes first
      if (aIsDynamic && !bIsDynamic) return -1;
      if (!aIsDynamic && bIsDynamic) return 1;
      // If both are starter embeds, sort by creation time
      return b.createdAt - a.createdAt;
    });

  /** Renders individual clip card with thumbnail, play overlay, and delete button */
  const ClipCard = React.memo(({ item: embed, isMostRecent, thumbnailUrl }: { 
    item: EmbedData; 
    isMostRecent: boolean; 
    thumbnailUrl: string | null; 
  }) => {
    // Create a stable ref for Instagram WebViews to prevent unnecessary re-mounts
    const webViewRef = React.useRef<WebView>(null);

    // Get platform display name and color
    const getPlatformInfo = (type: string) => {
      switch (type) {
        case 'youtube': return { name: 'YouTube', color: '#FF0000' };
        case 'tiktok': return { name: 'TikTok', color: '#000000' };
        case 'instagram': return { name: 'Instagram', color: '#E4405F' };
        default: return { name: 'Unknown', color: '#666666' };
      }
    };

    const platformInfo = getPlatformInfo(embed.type || '');
    
    return (
      <View style={styles.gridCard}>
        <TouchableOpacity 
          style={styles.cardTouchable}
          onPress={() => {
            setSelectedEmbed(embed);
            setActive(embed.type || 'menu');
          }}
        >
          {/* Thumbnail Container */}
          <View style={styles.thumbnailContainer}>
            {embed.type === 'instagram' ? (
              // Instagram: Use custom HTML wrapper for proper grid sizing
              <WebView
                ref={webViewRef}
                key={`instagram-${embed.id}-${embed.postId}`}
                source={{ 
                  html: generateInstagramTileHtml(embed.postId!),
                  baseUrl: 'https://www.instagram.com'
                }}
                originWhitelist={['*']}
                style={styles.thumbnail}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                setSupportMultipleWindows={false}
                allowsInlineMediaPlayback={false}
                mediaPlaybackRequiresUserAction={true}
                allowsFullscreenVideo={false}
                onLoadStart={() => {
                  if (!loadingInstagramEmbeds.has(embed.id)) {
                    console.log('🔄 Instagram embed loading:', embed.url);
                    setLoadingInstagramEmbeds(prev => new Set([...prev, embed.id]));
                  }
                }}
                onLoadEnd={() => {
                  console.log('✅ Instagram embed loaded successfully');
                  setLoadingInstagramEmbeds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(embed.id);
                    return newSet;
                  });
                }}
                onError={(syntheticEvent) => {
                  console.log('❌ Instagram embed error:', syntheticEvent.nativeEvent);
                  setLoadingInstagramEmbeds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(embed.id);
                    return newSet;
                  });
                }}
                onHttpError={(syntheticEvent) => {
                  console.log('🌐 Instagram embed HTTP error:', syntheticEvent.nativeEvent);
                  setLoadingInstagramEmbeds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(embed.id);
                    return newSet;
                  });
                }}
              />
            ) : thumbnailUrl ? (
              // YouTube/TikTok: Use thumbnail image
              <Image 
                source={{ uri: thumbnailUrl }} 
                style={styles.thumbnail}
                resizeMode="cover"
                onError={() => {
                  console.log('❌ Failed to load thumbnail:', thumbnailUrl);
                }}
                onLoad={() => {
                  console.log('✅ Thumbnail loaded successfully:', thumbnailUrl);
                }}
              />
            ) : (
              // Fallback: Show placeholder or loading state
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                {embed.type === 'tiktok' && embed.postId && loadingThumbnails.has(embed.postId) ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>
                    {embed.type?.toUpperCase() || 'CLIP'}
                  </Text>
                )}
              </View>
            )}
            
            {/* Play Overlay */}
            {/* <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View> */}
            
            {/* Platform Tag */}
            <View style={[
              styles.platformTag,
              embed.type === 'youtube' && styles.platformTagYouTube,
              embed.type === 'tiktok' && styles.platformTagTikTok,
              embed.type === 'instagram' && styles.platformTagInstagram,
            ]}>
              {embed.type === 'tiktok' ? (
                <View style={styles.platformTagTikTokGradient}>
                  <View style={[styles.tiktokColorSection, styles.tiktokColorSection1]} />
                  <View style={[styles.tiktokColorSection, styles.tiktokColorSection2]} />
                  <View style={[styles.tiktokColorSection, styles.tiktokColorSection3]} />
                </View>
              ) : null}
              {embed.type === 'instagram' ? (
                <View style={styles.platformTagInstagramGradient}>
                  <View style={[styles.instagramColorSection, styles.instagramColorSection1]} />
                  <View style={[styles.instagramColorSection, styles.instagramColorSection2]} />
                  <View style={[styles.instagramColorSection, styles.instagramColorSection3]} />
                </View>
              ) : null}
              <Text style={[styles.platformTagText, { zIndex: 1, position: 'relative' }]}>{platformInfo.name}</Text>
            </View>
            
            {/* New Badge */}
            {isMostRecent && (
              <View style={styles.badgeContainer}>
                <Text style={styles.newBadge}>New</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Edit Button */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedClipForDetails(embed);
            setSelectedCategories(new Set(embed.categories || []));
            setShowClipDetails(true);
          }}
        >
          <Text style={styles.editButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if the embed data actually changed
    const isEqual = prevProps.item.id === nextProps.item.id && 
           prevProps.item.url === nextProps.item.url &&
           prevProps.item.type === nextProps.item.type &&
           prevProps.item.createdAt === nextProps.item.createdAt &&
           prevProps.item.postId === nextProps.item.postId &&
           prevProps.item.videoId === nextProps.item.videoId &&
           prevProps.isMostRecent === nextProps.isMostRecent &&
           prevProps.thumbnailUrl === nextProps.thumbnailUrl;
    
    // Return true if props are equal (don't re-render), false if different (re-render)
    return isEqual;
  });

  ClipCard.displayName = 'ClipCard';

  /** Render function for FlatList */
  const renderClipCard = React.useCallback(({ item }: { item: EmbedData }) => {
    // Calculate values outside the memoized component
    const isMostRecent = dynamicEmbeds.length > 0 && 
      dynamicEmbeds[dynamicEmbeds.length - 1].id === item.id;
    
    let thumbnailUrl = getThumbnailUrl(item);
    if (item.type === 'tiktok' && item.postId) {
      thumbnailUrl = tiktokThumbnails[item.postId] || null;
    }
    
    return <ClipCard item={item} isMostRecent={isMostRecent} thumbnailUrl={thumbnailUrl} />;
  }, [dynamicEmbeds, tiktokThumbnails]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Renders main grid view with all clips */
  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Saved Clips</Text>
        <TouchableOpacity 
          style={[styles.filterButton, (filterByCategory || selectedSites.size < 3) && styles.filterButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilterPage(true);
          }}
        >
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>
      
      {/* Active Filter Indicator */}
      {filterByCategory && (
        <View style={styles.activeFilterIndicator}>
          <View style={[
            styles.categoryColorDot, 
            { backgroundColor: categories.find(c => c.id === filterByCategory)?.color || '#007bff' }
          ]} />
          <Text style={styles.activeFilterText}>
            {categories.find(c => c.id === filterByCategory)?.name || 'Unknown'}
          </Text>
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={() => setFilterByCategory(null)}
          >
            <Text style={styles.clearFilterButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Share Intent Status */}
      {showShareBanner && shareIntent.webUrl && (() => {
        // Determine platform from the shared URL
        let platform = 'Unknown';
        if (shareIntent.webUrl.includes('instagram.com')) {
          platform = 'Instagram';
        } else if (shareIntent.webUrl.includes('youtube.com') || shareIntent.webUrl.includes('youtu.be')) {
          platform = 'YouTube';
        } else if (shareIntent.webUrl.includes('tiktok.com') || shareIntent.webUrl.includes('vt.tiktok.com')) {
          platform = 'TikTok';
        }
        
        return (
          <View style={styles.shareStatus}>
            <Text style={styles.shareStatusText}>
              🎬 New clip added from {platform}
            </Text>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowShareBanner(false);
                resetShareIntent();
              }}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        );
      })()}
      
      {isLoading ? (
        <Text style={styles.loadingText}>Loading clips...</Text>
      ) : allEmbeds.length > 0 ? (
        <FlatList
          data={allEmbeds}
          renderItem={renderClipCard}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e8e8ea"
              colors={['#e8e8ea']}
              progressBackgroundColor="#0f1013"
            />
          }
        />
      ) : (
        <Text style={styles.noEmbedsText}>
          No clips available. Share a social media URL from another app to create one!
        </Text>
      )}
    </View>
  );

  /** Floating back button for embed view */
  const BackFloating = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => {
      setActive('menu');
      setSelectedEmbed(null);
    }}>
      <Text style={styles.backButtonText}>‹</Text>
    </TouchableOpacity>
  );

  /** Renders clip details modal */
  const renderClipDetailsModal = () => {
    if (!selectedClipForDetails) return null;

    const handleCategoryToggle = (categoryId: string) => {
      const newSelected = new Set(selectedCategories);
      if (newSelected.has(categoryId)) {
        newSelected.delete(categoryId);
      } else {
        newSelected.add(categoryId);
      }
      setSelectedCategories(newSelected);
    };

    const handleSaveCategories = () => {
      updateEmbedCategories(selectedClipForDetails.id, Array.from(selectedCategories));
      setShowClipDetails(false);
      setSelectedClipForDetails(null);
    };

    const handleDeleteClip = () => {
      Alert.alert(
        'Delete Clip',
        'Are you sure you want to delete this clip? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: () => {
              deleteEmbed(selectedClipForDetails.id);
              setShowClipDetails(false);
              setSelectedClipForDetails(null);
            }
          }
        ]
      );
    };

    return (
      <Modal
        visible={showClipDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClipDetails(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar style="light" />
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowClipDetails(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Clip Details</Text>
            <View style={styles.modalHeaderActions}>
              <TouchableOpacity 
                style={styles.modalDeleteButton}
                onPress={handleDeleteClip}
              >
                <Text style={styles.modalDeleteButtonText}>🗑️</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={handleSaveCategories}
              >
                <Text style={styles.modalSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.clipInfo}>
              <Text style={styles.clipTitle}>{selectedClipForDetails.title}</Text>
              <Text style={styles.clipSubtitle}>{selectedClipForDetails.subtitle}</Text>
              <Text style={styles.clipUrl}>{selectedClipForDetails.url}</Text>
            </View>

            <View style={styles.categoriesSection}>
              <View style={styles.categoriesHeader}>
                <Text style={styles.categoriesTitle}>Categories</Text>
                <TouchableOpacity 
                  style={styles.manageCategoriesButton}
                  onPress={() => setShowCategoryManager(true)}
                >
                  <Text style={styles.manageCategoriesButtonText}>Manage</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.categoriesList}>
                {categories.map(category => {
                  const isSelected = selectedCategories.has(category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                        { borderColor: category.color }
                      ]}
                      onPress={() => handleCategoryToggle(category.id)}
                    >
                      <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                      <Text style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  /** Renders category manager modal */
  const renderCategoryManagerModal = () => {
    const handleCreateCategory = () => {
      if (newCategoryName.trim()) {
        createCategory(newCategoryName);
      }
    };

    const handleDeleteCategory = (categoryId: string) => {
      Alert.alert(
        'Delete Category',
        'Are you sure you want to delete this category? This will remove it from all clips.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(categoryId) }
        ]
      );
    };

    return (
      <Modal
        visible={showCategoryManager}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryManager(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar style="light" />
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryManager(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manage Categories</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.addCategorySection}>
              <Text style={styles.addCategoryTitle}>Add New Category</Text>
              <View style={styles.addCategoryInput}>
                <TextInput
                  style={styles.categoryInput}
                  placeholder="Category name"
                  placeholderTextColor="#666"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <TouchableOpacity 
                  style={styles.addCategoryButton}
                  onPress={handleCreateCategory}
                >
                  <Text style={styles.addCategoryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.existingCategoriesSection}>
              <Text style={styles.existingCategoriesTitle}>Existing Categories</Text>
              {categories.map(category => (
                <View key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryItemInfo}>
                    <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryItemName}>{category.name}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteCategoryButton}
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    <Text style={styles.deleteCategoryButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };


  /** Renders combined filter page */
  const renderFilterPage = () => {
    const sites = [
      { key: 'youtube', label: 'YouTube', icon: '📺', color: '#FF0000' },
      { key: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000000' },
      { key: 'instagram', label: 'Instagram', icon: '📷', color: '#E4405F' }
    ];

    const toggleSite = (siteKey: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const newSelectedSites = new Set(selectedSites);
      if (newSelectedSites.has(siteKey)) {
        newSelectedSites.delete(siteKey);
      } else {
        newSelectedSites.add(siteKey);
      }
      setSelectedSites(newSelectedSites);
    };

    const handleCategorySelect = (categoryId: string | null) => {
      setFilterByCategory(categoryId);
    };

    const ToggleSwitch = ({ isActive }: { isActive: boolean }) => (
      <View style={[styles.toggleSwitch, isActive && styles.toggleSwitchActive]}>
        <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
      </View>
    );

    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.filterContainer}>
          <View style={styles.filterHeader}>
            <TouchableOpacity 
              style={styles.filterBackButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilterPage(false);
              }}
            >
              <Text style={styles.filterBackButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.filterTitle}>Filter Clips</Text>
          </View>
          
          <ScrollView 
            style={styles.filterContent}
            contentContainerStyle={styles.filterScrollContent}
          >
            {/* Platform Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Platforms</Text>
              {sites.map(site => {
                const isSelected = selectedSites.has(site.key);
                return (
                  <TouchableOpacity
                    key={site.key}
                    style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                    onPress={() => toggleSite(site.key)}
                  >
                    <Text style={[styles.filterOptionIcon, { color: site.color }]}>{site.icon}</Text>
                    <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
                      {site.label}
                    </Text>
                    <ToggleSwitch isActive={isSelected} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category Filter Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories</Text>
              
              <TouchableOpacity
                style={[
                  styles.categoryFilterOption,
                  !filterByCategory && styles.categoryFilterOptionSelected
                ]}
                onPress={() => handleCategorySelect(null)}
              >
                <Text style={[
                  styles.categoryFilterOptionText,
                  !filterByCategory && styles.categoryFilterOptionTextSelected
                ]}>
                  All Categories
                </Text>
              </TouchableOpacity>

              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilterOption,
                    filterByCategory === category.id && styles.categoryFilterOptionSelected
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View style={styles.categoryFilterOptionInfo}>
                    <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                    <Text style={[
                      styles.categoryFilterOptionText,
                      filterByCategory === category.id && styles.categoryFilterOptionTextSelected
                    ]}>
                      {category.name}
                    </Text>
                  </View>
                  <Text style={styles.categoryCount}>
                    {allEmbeds.filter(embed => embed.categories?.includes(category.id)).length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  /** Renders WebView for playing selected embed with error handling */
  const renderWebView = () => {
    if (!selectedEmbed) {
      console.log('No selected embed, returning to menu');
      return null;
    }

    try {
      const html = generateEmbedHtml(selectedEmbed);
      const baseUrl = getBaseUrl(selectedEmbed.type);
      
      console.log('Rendering WebView for embed:', selectedEmbed.type);
      console.log('Base URL:', baseUrl);
      console.log('HTML length:', html.length);

      if (!html || html.length < 100) {
        console.error('Generated HTML is too short or invalid:', html);
        return (
          <View style={styles.container}>
            <StatusBar style="light" />
            <BackFloating />
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to generate embed content</Text>
              <Text style={styles.errorSubtext}>Please try again or contact support</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <BackFloating />
          <WebView
            originWhitelist={["*"]}
            source={{ html, baseUrl }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error:', nativeEvent);
            }}
          />
        </View>
      );
    } catch (error) {
      console.error('Error rendering WebView:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <BackFloating />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading content</Text>
            <Text style={styles.errorSubtext}>{errorMessage}</Text>
          </View>
        </View>
      );
    }
  };

  if (showFilterPage) {
    return renderFilterPage();
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {active === 'menu' ? renderMenu() : renderWebView()}
      {renderClipDetailsModal()}
      {renderCategoryManagerModal()}
    </View>
  );
}


