import AsyncStorage from '@react-native-async-storage/async-storage';
import { useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    return {
      id: `instagram-${instagramData.postId}-${Date.now()}`,
      type: 'instagram',
      title: `Instagram ${contentType}`,
      subtitle: instagramData.username ? `@${instagramData.username}` : instagramData.postId,
      url: url,
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

  // Process shared content and create embeds
  React.useEffect(() => {
    if (hasShareIntent && shareIntent.webUrl) {
      const embed = createEmbedFromUrl(shareIntent.webUrl);
      if (embed) {
        // Check if this embed already exists (by URL, not ID since ID includes timestamp)
        const exists = dynamicEmbeds.some(e => e.url === embed.url);
        if (!exists) {
          const newEmbeds = [...dynamicEmbeds, embed];
          setDynamicEmbeds(newEmbeds);
          
          // Save to AsyncStorage
          saveDynamicEmbeds(newEmbeds);
          
          Alert.alert(
            'New Embed Created!',
            `Successfully created a ${embed.type} embed from the shared URL.`,
            [
              {
                text: 'View Now',
                onPress: () => {
                  setSelectedEmbed(embed);
                  setActive(embed.type);
                }
              },
              {
                text: 'Later',
                style: 'cancel'
              }
            ]
          );
        }
      }
    }
  }, [hasShareIntent, shareIntent.webUrl, dynamicEmbeds]);

  // Combine starter embeds with dynamic embeds, sorted by creation time
  const allEmbeds = [...STARTER_EMBEDS, ...dynamicEmbeds].sort((a, b) => b.createdAt - a.createdAt);

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>ClipRack Embed Test</Text>
      
      {/* Share Intent Status */}
      {hasShareIntent && shareIntent.webUrl && (
        <View style={styles.shareStatus}>
          <Text style={styles.shareStatusText}>
            📱 Shared URL: {shareIntent.webUrl}
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
        <Text style={styles.loadingText}>Loading embeds...</Text>
      ) : (
        <View style={styles.cards}>
          {allEmbeds.map((embed) => (
            <TouchableOpacity 
              key={embed.id}
              style={[
                styles.card,
                dynamicEmbeds.some(e => e.id === embed.id) && styles.dynamicCard
              ]} 
              onPress={() => {
                setSelectedEmbed(embed);
                setActive(embed.type);
              }}
            >
              <Text style={styles.cardTitle}>{embed.title}</Text>
              <Text style={styles.cardSubtitle}>{embed.subtitle}</Text>
              {dynamicEmbeds.some(e => e.id === embed.id) && (
                <Text style={styles.dynamicBadge}>🆕 Shared</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {!isLoading && allEmbeds.length === 0 && (
        <Text style={styles.noEmbedsText}>
          No embeds available. Share a social media URL from another app to create one!
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
    if (!selectedEmbed) return null;

    const html = generateEmbedHtml(selectedEmbed);
    const baseUrl = getBaseUrl(selectedEmbed.type);

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
        />
      </View>
    );
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
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
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
    fontSize: 12,
    flex: 1,
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
  cards: {
    gap: 12,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  dynamicCard: {
    borderColor: '#0f0',
    borderWidth: 2,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  dynamicBadge: {
    color: '#0f0',
    fontSize: 12,
    fontWeight: '600',
  },
  noEmbedsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
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
