/**
 * Supabase Client Configuration
 * 
 * This module configures and exports the Supabase client for the ClipRack app.
 * It sets up authentication with secure session persistence using expo-secure-store,
 * which stores tokens in the OS secure keystore/keychain for maximum security.
 * 
 * Security Features:
 * - Encrypted storage using iOS Keychain / Android Keystore
 * - Tokens are not stored in plaintext
 * - Automatic token refresh with secure storage
 * - Production-ready security by default
 * 
 * Features:
 * - Session persistence across app restarts
 * - Automatic token refresh
 * - URL polyfill for React Native compatibility
 * - Environment variable validation
 * - Secure storage adapter for Supabase auth
 * 
 * @requires EXPO_PUBLIC_SUPABASE_URL - Your Supabase project URL
 * @requires EXPO_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key
 * @requires expo-secure-store - For secure token storage
 */

import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Secure storage adapter that matches the WebStorage interface Supabase expects
// NOTE: This ONLY stores authentication tokens (access_token, refresh_token, session)
// It does NOT store app data like clips, profiles, etc. - that stays in app state
const SecureStoreAdapter = {
  // Get stored auth tokens from secure keychain
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key)
    return value ?? null
  },
  // Store auth tokens securely in iOS Keychain/Android Keystore
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value, { 
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK // Only accessible after device unlock
    })
  },
  // Remove auth tokens when user signs out
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // RN apps don't use URL fragments like web
  },
})