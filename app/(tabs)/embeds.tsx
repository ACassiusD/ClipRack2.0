import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Provider = 'menu' | 'youtube' | 'tiktok' | 'instagram';

export default function EmbedsScreen() {
  const [active, setActive] = React.useState<Provider>('menu');

  const youtubeVideoId = 'LV3mChwupF8';
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?playsinline=1&modestbranding=1&rel=0`;
  const youtubeHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;height:100%;} .wrap{position:fixed;inset:0;}
  iframe{border:0;width:100%;height:100%;display:block}
  </style></head><body>
  <div class="wrap">
    <iframe src="${youtubeEmbedUrl}" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
  </div>
  </body></html>`;

  const tiktokHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;} .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .tiktok-embed{margin:0 auto;width:100%;max-width:500px;}
  </style></head><body>
  <div class="wrap">
    <blockquote class="tiktok-embed" cite="https://www.tiktok.com/@majasrecipes/video/7498864456584285445" data-video-id="7498864456584285445" data-embed-from="oembed">
      <section></section>
    </blockquote>
  </div>
  <script async src="https://www.tiktok.com/embed.js"></script>
  </body></html>`;

  const instagramHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#000;} .wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .instagram-media{margin:0 auto;}
  </style></head><body>
  <div class="wrap">
    <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/DI66ERaTsm8/" data-instgrm-version="14"></blockquote>
  </div>
  <script async src="https://www.instagram.com/embed.js"></script>
  </body></html>`;

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>ClipRack Embed Test</Text>
      <View style={styles.cards}>
        <TouchableOpacity style={styles.card} onPress={() => setActive('youtube')}>
          <Text style={styles.cardTitle}>YouTube Short</Text>
          <Text style={styles.cardSubtitle}>Open LV3mChwupF8</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => setActive('tiktok')}>
          <Text style={styles.cardTitle}>TikTok</Text>
          <Text style={styles.cardSubtitle}>@majasrecipes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => setActive('instagram')}>
          <Text style={styles.cardTitle}>Instagram</Text>
          <Text style={styles.cardSubtitle}>DI66ERaTsm8</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const BackFloating = () => (
    <TouchableOpacity style={styles.backButton} onPress={() => setActive('menu')}>
      <Text style={styles.backButtonText}>←</Text>
    </TouchableOpacity>
  );

  const renderWebView = () => {
    if (active === 'youtube') {
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <BackFloating />
          <WebView
            originWhitelist={["*"]}
            source={{ html: youtubeHtml, baseUrl: 'https://www.youtube.com' }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
          />
        </View>
      );
    }
    if (active === 'tiktok') {
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <BackFloating />
          <WebView
            originWhitelist={["*"]}
            source={{ html: tiktokHtml, baseUrl: 'https://www.tiktok.com' }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
          />
        </View>
      );
    }
    if (active === 'instagram') {
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <BackFloating />
          <WebView
            originWhitelist={["*"]}
            source={{ html: instagramHtml, baseUrl: 'https://www.instagram.com' }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
          />
        </View>
      );
    }
    return null;
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
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#aaa',
    fontSize: 14,
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
