import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

interface SharedContent {
  folder: string;
  text?: string;
  url?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  timestamp: number;
}

export function useSharedContent() {
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSharedContent();
  }, []);

  const loadSharedContent = async () => {
    try {
      const data = await AsyncStorage.getItem('shared_content');
      if (data) {
        const content = JSON.parse(data);
        setSharedContent(content);
      }
    } catch (error) {
      console.error('Error loading shared content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSharedContent = async () => {
    try {
      await AsyncStorage.removeItem('shared_content');
      setSharedContent([]);
    } catch (error) {
      console.error('Error clearing shared content:', error);
    }
  };

  const addToFolder = async (content: SharedContent) => {
    try {
      const updatedContent = [...sharedContent, content];
      await AsyncStorage.setItem('shared_content', JSON.stringify(updatedContent));
      setSharedContent(updatedContent);
    } catch (error) {
      console.error('Error adding content to folder:', error);
    }
  };

  return {
    sharedContent,
    isLoading,
    loadSharedContent,
    clearSharedContent,
    addToFolder,
  };
}
