import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Provider = 'menu' | 'youtube' | 'tiktok' | 'instagram';

interface EmbedData {
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

// Starter embed data - these are always generated when the app starts
const STARTER_EMBEDS: EmbedData[] = [
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
const STORAGE_KEYS = {
  DYNAMIC_EMBEDS: 'cliprack_dynamic_embeds'
};

// Utility functions to generate HTML programmatically
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

// Main function to generate HTML based on embed type and data
const generateEmbedHtml = (embed: EmbedData): string => {
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

// Get base URL for each platform
const getBaseUrl = (type: 'youtube' | 'tiktok' | 'instagram'): string => {
  switch (type) {
    case 'youtube': return 'https://www.youtube.com';
    case 'tiktok': return 'https://www.tiktok.com';
    case 'instagram': return 'https://www.instagram.com';
  }
};

// TikTok thumbnail fetching function
const fetchTikTokThumbnail = async (videoId: string): Promise<string | null> => {
  try {
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

// Get thumbnail URL for each platform
const getThumbnailUrl = (embed: EmbedData): string | null => {
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

// Get screen dimensions for grid layout
const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 60) / 2; // 2 columns with padding
const cardHeight = cardWidth * 1.77; // 9:16 aspect ratio

// URL parsing utilities
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

const parseYouTubeUrl = (url: string): { videoId: string } | null => {
  // YouTube URL patterns:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(youtubeRegex);
  
  if (match) {
    return { videoId: match[1] };
  }
  
  return null;
};

const parseTikTokUrl = (url: string): { postId: string; username?: string } | null => {
  // TikTok URL patterns:
  // https://www.tiktok.com/@username/video/POST_ID
  // https://tiktok.com/@username/video/POST_ID
  const tiktokRegex = /(?:https?:\/\/(?:www\.)?tiktok\.com\/@([^\/]+)\/video\/([^\/\?]+))/;
  const match = url.match(tiktokRegex);
  
  if (match) {
    const username = match[1];
    const postId = match[2];
    return { postId, username };
  }
  
  return null;
};

// Create embed data from URL
const createEmbedFromUrl = (url: string): EmbedData | null => {
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
    return {
      id: `youtube-${youtubeData.videoId}-${Date.now()}`,
      type: 'youtube',
      title: 'YouTube Video',
      subtitle: `Open ${youtubeData.videoId}`,
      url: url,
      videoId: youtubeData.videoId,
      createdAt: Date.now()
    };
  }
  
  // Try TikTok
  const tiktokData = parseTikTokUrl(url);
  if (tiktokData) {
    return {
      id: `tiktok-${tiktokData.postId}-${Date.now()}`,
      type: 'tiktok',
      title: 'TikTok Video',
      subtitle: tiktokData.username ? `@${tiktokData.username}` : tiktokData.postId,
      url: url,
      postId: tiktokData.postId,
      username: tiktokData.username,
      createdAt: Date.now()
    };
  }
  
  return null;
};

// Storage functions
const saveDynamicEmbeds = async (embeds: EmbedData[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DYNAMIC_EMBEDS, JSON.stringify(embeds));
  } catch (error) {
    console.error('Failed to save dynamic embeds:', error);
  }
};



const loadDynamicEmbeds = async (): Promise<EmbedData[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.DYNAMIC_EMBEDS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load dynamic embeds:', error);
    return [];
  }
};

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
          const thumbnailUrl = await fetchTikTokThumbnail(embed.postId);
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

  // Delete function
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
      
      const embed = createEmbedFromUrl(shareIntent.webUrl);
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
    }
  }, [hasShareIntent, shareIntent.webUrl, dynamicEmbeds]);

  // Combine starter embeds with dynamic embeds, sorted by creation time
  const allEmbeds = [...STARTER_EMBEDS, ...dynamicEmbeds].sort((a, b) => b.createdAt - a.createdAt);

  const renderClipCard = ({ item: embed }: { item: EmbedData }) => {
    const isNewlyShared = dynamicEmbeds.some(e => e.id === embed.id);
    const isJustCreated = hasShareIntent && shareIntent.webUrl && 
      createEmbedFromUrl(shareIntent.webUrl)?.url === embed.url;
    
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
            setActive(embed.type);
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
                  {embed.type.toUpperCase()}
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
              {embed.type} • {embed.type === 'youtube' ? 'YouTube' : embed.type === 'tiktok' ? 'TikTok' : 'Instagram'}
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

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>All Saved Clips</Text>
      
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

  const BackFloating = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => {
      setActive('menu');
      setSelectedEmbed(null);
    }}>
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  title: {
    color: '#e8e8ea',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  shareStatus: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareStatusText: {
    color: '#0f0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  shareStatusSubtext: {
    color: '#0f0',
    fontSize: 12,
    flex: 1,
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  clearButtonText: {
    color: '#f00',
    fontSize: 10,
    fontWeight: '600',
  },
  // Grid Layout Styles
  gridContent: {
    paddingBottom: 100, // Add bottom padding to avoid tab bar overlap
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    width: cardWidth,
    backgroundColor: '#0f1013',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#202126',
    overflow: 'hidden',
    position: 'relative',
  },
  cardTouchable: {
    flex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: cardHeight,
    backgroundColor: '#000',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    backgroundColor: '#1a1b1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#cfcfd4',
    fontSize: 18,
    fontWeight: '600',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playIcon: {
    color: '#000',
    fontSize: 18,
    marginLeft: 3, // Slight offset to center the triangle
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  newBadge: {
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  justAddedBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    color: '#e8e8ea',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#b7b8bd',
    fontSize: 11,
    marginBottom: 4,
  },
  cardPlatform: {
    color: '#9a9ba1',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noEmbedsText: {
    color: '#9a9ba1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#e8e8ea',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
    zIndex: 10,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 20,
  },
});
