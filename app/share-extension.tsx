import { close, InitialProps } from 'expo-share-extension';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../components/ui/IconSymbol';
import { sharedStorage } from '../lib/sharedStorage';

interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Default categories as fallback
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'favorites', name: 'Favorites', color: '#FF6B6B', createdAt: Date.now() },
  { id: 'educational', name: 'Educational', color: '#45B7D1', createdAt: Date.now() },
  { id: 'sports', name: 'Sports', color: '#FFEAA7', createdAt: Date.now() },
  { id: 'cooking', name: 'Cooking', color: '#DDA0DD', createdAt: Date.now() },
  { id: 'fashion', name: 'Fashion', color: '#FF9FF3', createdAt: Date.now() },
  { id: 'gaming', name: 'Gaming', color: '#54A0FF', createdAt: Date.now() },
];

export default function ShareExtension({ text, url, images, videos, files }: InitialProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load categories from shared storage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🔍 Share Extension: Loading categories from shared storage');
        const stored = await sharedStorage.getItem('cliprack_categories');
        console.log('🔍 Share Extension: Categories data:', stored);
        if (stored) {
          const parsedCategories = JSON.parse(stored);
          setCategories(parsedCategories);
        }
      } catch (error) {
        console.error('❌ Share Extension: Error loading categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleSave = async () => {
    console.log('🔍 Share Extension: Save button clicked');
    console.log('🔍 Selected category:', selectedCategory);
    console.log('🔍 Share data:', { text, url, images, videos, files });
    
    if (!url) {
      console.log('❌ No URL provided');
      Alert.alert('Error', 'No URL found to save. Please try sharing a valid link.');
      return;
    }

    // Use selected category if any, otherwise no category
    console.log('🔍 Share Extension: Using category:', selectedCategory || 'none');

    try {
      console.log('💾 Share Extension: Creating embed from URL:', url);
      
      // Create embed from URL (same logic as main app)
      const embed = await createEmbedFromUrl(url);
      console.log('🔍 Share Extension: Created embed:', embed);
      
      if (embed) {
        // Add category to the embed (only if one is selected)
        const embedWithCategory = {
          ...embed,
          categories: selectedCategory ? [selectedCategory] : []
        };
        
        console.log('💾 Share Extension: Embed with category:', embedWithCategory);
        
        // Load existing embeds from shared storage
        const existingEmbeds = await sharedStorage.getItem('cliprack_embeds') || '[]';
        const embeds = JSON.parse(existingEmbeds);
        
        // Check if embed already exists
        const exists = embeds.some((e: any) => e.url === embed.url);
        if (exists) {
          console.log('⚠️ Share Extension: Embed already exists, skipping');
          Alert.alert('Already Saved', 'This content has already been saved to your clips.');
          close();
          return;
        }
        
        // Add new embed to shared storage
        const newEmbeds = [...embeds, embedWithCategory];
        await sharedStorage.setItem('cliprack_embeds', JSON.stringify(newEmbeds));
        
        console.log('✅ Share Extension: Embed saved successfully');
        
        const categoryName = selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'no category';
        Alert.alert(
          'Saved!',
          `Content saved${selectedCategory ? ` to ${categoryName} category` : ''}`,
          [
            {
              text: 'OK',
              onPress: () => close()
            }
          ]
        );
      } else {
        console.log('❌ Share Extension: Failed to create embed from URL');
        Alert.alert('Error', 'Could not process the shared content. Please try again.');
      }
    } catch (error) {
      console.error('❌ Share Extension: Error saving embed:', error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    }
  };

  const handleCancel = () => {
    close(); // Close the popup without saving
  };

  // URL parsing functions (same as main app)
  const parseInstagramUrl = (url: string): { postId: string; username?: string; contentType: 'post' | 'reel' } | null => {
    const instagramRegex = /(?:https?:\/\/(?:www\.)?instagram\.com(?:\/[^\/]+)?\/(p|reel)\/([^\/\?]+))/;
    const match = url.match(instagramRegex);
    
    if (match) {
      const contentType = match[1] as 'post' | 'reel';
      const postId = match[2];
      const usernameMatch = url.match(/instagram\.com\/([^\/]+)\/(p|reel)\//);
      const username = usernameMatch ? usernameMatch[1] : undefined;
      
      return { postId, username, contentType };
    }
    
    return null;
  };

  const parseYouTubeUrl = (url: string): { videoId: string } | null => {
    const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)|https?:\/\/youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      return { videoId: match[1] };
    }
    
    return null;
  };

  const parseTikTokUrl = (url: string): { postId: string; username?: string; isShortUrl?: boolean } | null => {
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

  const createEmbedFromUrl = async (url: string): Promise<any> => {
    const instagramData = parseInstagramUrl(url);
    if (instagramData) {
      const contentType = instagramData.contentType === 'reel' ? 'Reel' : 'Post';
      const cleanUrl = instagramData.contentType === 'reel' 
        ? `https://www.instagram.com/p/${instagramData.postId}/`
        : url;
      
      return {
        id: `instagram-${instagramData.postId}-${Date.now()}`,
        type: 'instagram',
        title: `Instagram ${contentType}`,
        subtitle: instagramData.username ? `@${instagramData.username}` : instagramData.postId,
        url: cleanUrl,
        postId: instagramData.postId,
        username: instagramData.username,
        createdAt: Date.now()
      };
    }
    
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
    
    const tiktokData = parseTikTokUrl(url);
    if (tiktokData) {
      return {
        id: `tiktok-${tiktokData.postId}-${Date.now()}`,
        type: 'tiktok',
        title: 'TikTok Video',
        subtitle: tiktokData.username ? `@${tiktokData.username}` : (tiktokData.isShortUrl ? 'Short URL' : tiktokData.postId),
        url: url,
        postId: tiktokData.postId,
        username: tiktokData.username,
        isShortUrl: tiktokData.isShortUrl,
        createdAt: Date.now()
      };
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Save to ClipRack</Text>
        <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
          <IconSymbol name="xmark" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.previewTitle}>Shared Content:</Text>
        
        {text && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText} numberOfLines={2}>
              {text}
            </Text>
          </View>
        )}
        
        {url && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText} numberOfLines={2}>
              {url}
            </Text>
          </View>
        )}
        
        {images && images.length > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {images.length} image(s) shared
            </Text>
          </View>
        )}
        
        {videos && videos.length > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              {videos.length} video(s) shared
            </Text>
          </View>
        )}

                <Text style={styles.categoryTitle}>Choose a category (optional):</Text>
                
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading categories...</Text>
                  </View>
                ) : (
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowDropdown(!showDropdown)}
                    >
                      <Text style={[
                        styles.dropdownButtonText,
                        !selectedCategory && styles.placeholderText
                      ]}>
                        {selectedCategory 
                          ? categories.find(c => c.id === selectedCategory)?.name 
                          : 'No category'
                        }
                      </Text>
                      <IconSymbol 
                        name={showDropdown ? 'chevron.up' : 'chevron.down'} 
                        size={16} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                    
                    {showDropdown && (
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        <TouchableOpacity
                          style={[
                            styles.dropdownItem,
                            !selectedCategory && styles.selectedDropdownItem
                          ]}
                          onPress={() => {
                            setSelectedCategory(null);
                            setShowDropdown(false);
                          }}
                        >
                          <View style={[styles.categoryColorDot, { backgroundColor: '#FF6B6B' }]} />
                          <Text style={[
                            styles.dropdownItemText,
                            !selectedCategory && styles.selectedDropdownItemText
                          ]}>No category</Text>
                        </TouchableOpacity>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.dropdownItem,
                              selectedCategory === category.id && styles.selectedDropdownItem
                            ]}
                            onPress={() => {
                              setSelectedCategory(category.id);
                              setShowDropdown(false);
                            }}
                          >
                            <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                            <Text style={[
                              styles.dropdownItemText,
                              selectedCategory === category.id && styles.selectedDropdownItemText
                            ]}>
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 20,
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    maxHeight: 200,
    zIndex: 1001,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedDropdownItem: {
    backgroundColor: '#F0F8FF',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#C7C7CC',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
