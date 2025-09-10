/**
 * Authentication Screen Component
 * 
 * A complete authentication screen that provides both Apple Sign-In and email/password
 * authentication options. This screen handles the entire authentication flow including
 * loading states, error handling, and user feedback.
 * 
 * What it does:
 * - Shows a login screen with Apple Sign-In button
 * - Shows email/password form for development/testing
 * - Lets users switch between sign-in and sign-up
 * - Shows if user is logged in and their premium status
 * - Handles all errors and shows user-friendly messages
 * - Lets users sign out when they're logged in
 * 
 * This component serves as a complete example of how to integrate authentication
 * into your app and can be used as-is or customized for your specific needs.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { session, loading } = useSession()
 *   
 *   if (loading) return <LoadingScreen />
 *   if (!session) return <AuthScreen />
 *   return <MainApp />
 * }
 * ```
 */

import { useSession } from '@/hooks/useSession'
import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import AppleSignInButton from './AppleSignInButton'
import { useEmailAuth } from './useEmailAuth'
import { useEntitlement } from './useEntitlement'

export default function AuthScreen() {
  const { session, loading: sessionLoading } = useSession()
  const { entitlement, loading: entitlementLoading } = useEntitlement()
  const { signIn, signUp, signOut, loading: authLoading } = useEmailAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    const { data, error } = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password)

    if (error) {
      Alert.alert('Authentication Error', error.message)
    } else {
      Alert.alert('Success', isSignUp ? 'Account created successfully!' : 'Signed in successfully!')
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      Alert.alert('Error', 'Failed to sign out')
    }
  }

  if (sessionLoading || entitlementLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    )
  }

  if (session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to ClipRack!</Text>
        <Text style={styles.subtitle}>
          Account Status: {entitlement.is_premium ? 'Premium' : 'Free'}
        </Text>
        <Text style={styles.subtitle}>
          Plan: {entitlement.plan || 'None'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In to ClipRack</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, authLoading && styles.buttonDisabled]} 
          onPress={handleEmailAuth}
          disabled={authLoading}
        >
          <Text style={styles.buttonText}>
            {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton} 
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.linkText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <Text style={styles.dividerText}>OR</Text>
      </View>

      <AppleSignInButton 
        onSignInSuccess={() => Alert.alert('Success', 'Signed in with Apple!')}
        onSignInError={(error) => Alert.alert('Apple Sign In Error', error)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#ffffff',
    textAlign: 'left',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  divider: {
    marginVertical: 20,
    alignItems: 'center',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
  },
})
