import { close, InitialProps } from 'expo-share-extension';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '../components/ui/IconSymbol';

// Mock categories - replace with your actual categories
const FOLDERS = [
  { id: 'favorites', name: 'Favorites', icon: 'heart' },
  { id: 'work', name: 'Work', icon: 'briefcase' },
  { id: 'personal', name: 'Personal', icon: 'person' },
  { id: 'entertainment', name: 'Entertainment', icon: 'tv' },
  { id: 'education', name: 'Education', icon: 'book' },
];

export default function ShareExtension({ text, url, images, videos, files }: InitialProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedFolder) {
      Alert.alert('Please select a folder', 'Choose where you want to save this content.');
      return;
    }

    try {
      // Save to App Group (shared between extension and main app)
      const shareData = {
        folder: selectedFolder,
        text: text,
        url: url,
        images: images,
        videos: videos,
        files: files,
        timestamp: Date.now(),
      };

      // Write to shared UserDefaults
      const { setItem, getItem } = await import('@react-native-async-storage/async-storage');
      const existingShares = await getItem('shared_content') || '[]';
      const shares = JSON.parse(existingShares);
      shares.push(shareData);
      await setItem('shared_content', JSON.stringify(shares));

      Alert.alert(
        'Saved!',
        `Content saved to ${FOLDERS.find(f => f.id === selectedFolder)?.name}`,
        [
          {
            text: 'OK',
            onPress: () => close(), // This closes the popup without opening the main app
          },
        ]
      );
    } catch (error) {
      console.error('Error saving share data:', error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    }
  };

  const handleCancel = () => {
    close(); // Close the popup without saving
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

        <Text style={styles.folderTitle}>Choose a folder:</Text>
        
        <View style={styles.folderGrid}>
          {FOLDERS.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderButton,
                selectedFolder === folder.id && styles.selectedFolder
              ]}
              onPress={() => setSelectedFolder(folder.id)}
            >
              <IconSymbol 
                name={folder.icon} 
                size={24} 
                color={selectedFolder === folder.id ? '#fff' : '#007AFF'} 
              />
              <Text style={[
                styles.folderText,
                selectedFolder === folder.id && styles.selectedFolderText
              ]}>
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, !selectedFolder && styles.disabledButton]} 
          onPress={handleSave}
          disabled={!selectedFolder}
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
  folderTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginTop: 20,
    marginBottom: 16,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  folderButton: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFolder: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  folderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 8,
  },
  selectedFolderText: {
    color: '#fff',
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
