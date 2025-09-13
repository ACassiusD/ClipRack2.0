import { useEffect, useState } from 'react';
import { sharedStorage } from '../lib/sharedStorage';

interface SharedContent {
  category: string;
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
    console.log('🔍 useSharedContent: Hook initialized, loading shared content');
    loadSharedContent();
    
    // Check for new shared content every 2 seconds
    const interval = setInterval(() => {
      console.log('🔍 useSharedContent: Periodic check for new shared content');
      loadSharedContent();
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSharedContent = async () => {
    try {
      console.log('🔍 useSharedContent: Loading shared content from shared storage');
      const data = await sharedStorage.getItem('shared_content');
      console.log('🔍 useSharedContent: Raw data from shared storage:', data);
      if (data) {
        const content = JSON.parse(data);
        console.log('🔍 useSharedContent: Parsed content:', content);
        setSharedContent(content);
      } else {
        console.log('ℹ️ useSharedContent: No shared content found');
      }
    } catch (error) {
      console.error('❌ useSharedContent: Error loading shared content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSharedContent = async () => {
    try {
      await sharedStorage.removeItem('shared_content');
      setSharedContent([]);
    } catch (error) {
      console.error('Error clearing shared content:', error);
    }
  };

  const addToCategory = async (content: SharedContent) => {
    try {
      const updatedContent = [...sharedContent, content];
      await sharedStorage.setItem('shared_content', JSON.stringify(updatedContent));
      setSharedContent(updatedContent);
    } catch (error) {
      console.error('Error adding content to category:', error);
    }
  };

  return {
    sharedContent,
    isLoading,
    loadSharedContent,
    clearSharedContent,
    addToCategory,
  };
}
