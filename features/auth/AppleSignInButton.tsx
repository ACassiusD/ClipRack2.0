/**
 * Apple Sign-In Button Component
 * 
 * A reusable component that handles Apple Sign-In authentication for iOS devices.
 * This component integrates with Supabase Auth to provide seamless Apple authentication.
 * 
 * What it does:
 * - Shows a native Apple Sign-In button (the black button with Apple logo)
 * - Handles the Apple authentication flow when tapped
 * - Connects Apple auth to Supabase (your backend)
 * - Creates a user profile in your database
 * - Handles errors and shows user feedback
 * 
 * @requires expo-apple-authentication - Must be installed and configured
 * @requires Apple Developer Account - For Sign in with Apple capability
 * @requires Supabase Apple Provider - Must be enabled in Supabase dashboard
 * 
 * @example
 * ```tsx
 * <AppleSignInButton 
 *   onSignInSuccess={() => console.log('Signed in!')}
 *   onSignInError={(error) => console.error('Sign in failed:', error)}
 * />
 * ```
 */

import { supabase } from '@/lib/supabase'
import * as AppleAuthentication from 'expo-apple-authentication'
import { useState } from 'react'
import { Alert, View } from 'react-native'

interface AppleSignInButtonProps {
  onSignInSuccess?: () => void
  onSignInError?: (error: string) => void
}

export default function AppleSignInButton({ 
  onSignInSuccess, 
  onSignInError 
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true)
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (!credential.identityToken) {
        throw new Error('No Apple identity token received')
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })

      if (error) {
        throw error
      }

      // Ensure profile row exists
      const userId = data.user?.id
      if (userId) {
        await supabase.from('profiles').upsert(
          { id: userId }, 
          { onConflict: 'id' }
        )
      }

      onSignInSuccess?.()
    } catch (error: any) {
      console.warn('Apple sign-in failed:', error)
      const errorMessage = error.message || 'Apple sign-in failed'
      onSignInError?.(errorMessage)
      Alert.alert('Sign In Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        style={{ width: 280, height: 44 }}
        onPress={handleAppleSignIn}
        disabled={isLoading}
      />
    </View>
  )
}
