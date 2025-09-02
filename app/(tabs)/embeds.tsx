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
import { useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { STARTER_EMBEDS, STORAGE_KEYS } from '../../src/embeds/constants';
import { styles } from '../../src/embeds/styles';
import { EmbedData, Provider } from '../../src/embeds/types';

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
  
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  // Load saved dynamic embeds on component mount
  React.useEffect(() => {
    const loadSavedEmbeds = async () => {
      const saved = await loadDynamicEmbeds();
      setDynamicEmbeds(saved);
      setIsLoading(false);
    };
    loadSavedEmbeds();
  }, []);

  // Fetch TikTok thumbnails for all TikTok embeds
  React.useEffect(() => {
    const fetchTikTokThumbnails = async () => {
      const allEmbeds = [...STARTER_EMBEDS, ...dynamicEmbeds];
      const tiktokEmbeds = allEmbeds.filter(embed => embed.type === 'tiktok' && embed.postId);
      
      for (const embed of tiktokEmbeds) {
        if (embed.postId && !tiktokThumbnails[embed.postId]) {
          console.log('🔄 Fetching TikTok thumbnail for:', embed.postId);
          const thumbnailUrl = await fetchTikTokThumbnail(embed.postId, embed.isShortUrl);
          if (thumbnailUrl) {
            setTiktokThumbnails(prev => ({
              ...prev,
              [embed.postId!]: thumbnailUrl
            }));
          }
        }
      }
    };

    if (!isLoading) {
      fetchTikTokThumbnails();
    }
  }, [dynamicEmbeds, isLoading, tiktokThumbnails]);

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
  }, [hasShareIntent, shareIntent.webUrl, dynamicEmbeds]);

  // Combine starter embeds with dynamic embeds, sorted by creation time
  const allEmbeds = [...STARTER_EMBEDS, ...dynamicEmbeds].sort((a, b) => b.createdAt - a.createdAt);

  /** Renders individual clip card with thumbnail, play overlay, and delete button */
  const renderClipCard = ({ item: embed }: { item: EmbedData }) => {
    const isNewlyShared = dynamicEmbeds.some(e => e.id === embed.id);
    const isJustCreated = hasShareIntent && shareIntent.webUrl && 
      shareIntent.webUrl === embed.url;
    
    // Get thumbnail URL based on platform
    let thumbnailUrl = getThumbnailUrl(embed);
    if (embed.type === 'tiktok' && embed.postId) {
      thumbnailUrl = tiktokThumbnails[embed.postId] || null;
    }
    
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
              // Instagram: Use actual embed preview like your Next.js example
              <WebView
                source={{ 
                  uri: `${embed.url.replace(/\/$/, '')}/embed`,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
                  }
                }}
                style={styles.thumbnail}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={false}
                mediaPlaybackRequiresUserAction={true}
                allowsFullscreenVideo={false}
                onLoadStart={() => {
                  console.log('🔄 Instagram embed loading:', embed.url);
                }}
                onLoadEnd={() => {
                  console.log('✅ Instagram embed loaded successfully');
                }}
                onError={(syntheticEvent) => {
                  console.log('❌ Instagram embed error:', syntheticEvent.nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  console.log('🌐 Instagram embed HTTP error:', syntheticEvent.nativeEvent);
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
              // Fallback: Show placeholder
              <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
                <Text style={styles.placeholderText}>
                  {embed.type?.toUpperCase() || 'CLIP'}
                </Text>
              </View>
            )}
            
            {/* Play Overlay */}
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
            
            {/* Badges */}
            {isNewlyShared && (
              <View style={styles.badgeContainer}>
                <Text style={styles.newBadge}>🆕</Text>
              </View>
            )}
            {isJustCreated && (
              <View style={styles.badgeContainer}>
                <Text style={styles.justAddedBadge}>✨</Text>
              </View>
            )}
          </View>
          
          {/* Card Info */}
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {embed.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {embed.subtitle}
            </Text>
            <Text style={styles.cardPlatform}>
              {embed.type || 'unknown'} • {embed.type === 'youtube' ? 'YouTube' : embed.type === 'tiktok' ? 'TikTok' : embed.type === 'instagram' ? 'Instagram' : 'Unknown'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteEmbed(embed.id)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /** Renders main grid view with all clips */
  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>Saved Clips</Text>
      
      {/* Share Intent Status */}
      {hasShareIntent && shareIntent.webUrl && (
        <View style={styles.shareStatus}>
          <Text style={styles.shareStatusText}>
            🎬 New clip created successfully!
          </Text>
          <Text style={styles.shareStatusSubtext}>
            Tap on the clip card below to view it
          </Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => resetShareIntent()}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {isLoading ? (
        <Text style={styles.loadingText}>Loading clips...</Text>
      ) : allEmbeds.length > 0 ? (
        <FlatList
          data={allEmbeds}
          renderItem={renderClipCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
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
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );

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

  return active === 'menu' ? (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderMenu()}
    </View>
  ) : (
    renderWebView()
  );
}


