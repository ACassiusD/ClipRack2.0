import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';

// MMKV with App Group support for sharing data between main app and share extension
const storage = new MMKV({
  id: 'cliprack-shared-storage',
  // MMKV will automatically use the App Group created by expo-share-extension
});

// Fallback to AsyncStorage if MMKV fails
export const sharedStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      console.log('🔍 SharedStorage: Getting item from MMKV:', key);
      const value = storage.getString(key);
      console.log('🔍 SharedStorage: Retrieved value from MMKV:', value);
      return value || null;
    } catch (error) {
      console.error('❌ SharedStorage: MMKV failed, falling back to AsyncStorage:', error);
      try {
        const fallbackValue = await AsyncStorage.getItem(key);
        console.log('🔍 SharedStorage: Retrieved value from AsyncStorage fallback:', fallbackValue);
        return fallbackValue;
      } catch (fallbackError) {
        console.error('❌ SharedStorage: AsyncStorage fallback also failed:', fallbackError);
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      console.log('💾 SharedStorage: Setting item in MMKV:', key, value);
      storage.set(key, value);
      console.log('✅ SharedStorage: Successfully saved to MMKV');
    } catch (error) {
      console.error('❌ SharedStorage: MMKV failed, falling back to AsyncStorage:', error);
      try {
        await AsyncStorage.setItem(key, value);
        console.log('✅ SharedStorage: Successfully saved to AsyncStorage fallback');
      } catch (fallbackError) {
        console.error('❌ SharedStorage: AsyncStorage fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      console.log('🗑️ SharedStorage: Removing item from MMKV:', key);
      storage.delete(key);
      console.log('✅ SharedStorage: Successfully removed from MMKV');
    } catch (error) {
      console.error('❌ SharedStorage: MMKV failed, falling back to AsyncStorage:', error);
      try {
        await AsyncStorage.removeItem(key);
        console.log('✅ SharedStorage: Successfully removed from AsyncStorage fallback');
      } catch (fallbackError) {
        console.error('❌ SharedStorage: AsyncStorage fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
};
