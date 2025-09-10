/**
 * Email Authentication Hook
 * 
 * This hook provides email/password authentication functionality for production use.
 * It handles sign-in, sign-up, and sign-out operations with automatic profile management.
 * 
 * What it does:
 * - Provides signIn() function that calls Supabase auth.signInWithPassword()
 * - Provides signUp() function that calls Supabase auth.signUp()
 * - Provides signOut() function that calls Supabase auth.signOut()
 * - Automatically creates user profiles in the database after successful auth
 * - Shows loading states while processing
 * - Handles errors and returns them to you
 * 
 * @returns {Object} Authentication methods and loading state
 * @returns {Function} signIn - Sign in with email and password
 * @returns {Function} signUp - Create new account with email and password
 * @returns {Function} signOut - Sign out current user
 * @returns {boolean} loading - Whether an auth operation is in progress
 * 
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, signUp, loading } = useEmailAuth()
 *   
 *   const handleSubmit = async (email, password) => {
 *     const { data, error } = await signIn(email, password)
 *     if (error) console.error('Sign in failed:', error)
 *   }
 * }
 * ```
 */

import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export interface AuthResult {
  data: any
  error: any
}

export function useEmailAuth() {
  const [loading, setLoading] = useState(false)

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) throw error
      
      // Ensure profile row exists
      if (data.user?.id) {
        await supabase.from('profiles').upsert(
          { id: data.user.id }, 
          { onConflict: 'id' }
        )
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      
      if (error) throw error
      
      // Create profile row for new user
      if (data.user?.id) {
        await supabase.from('profiles').upsert(
          { id: data.user.id }, 
          { onConflict: 'id' }
        )
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      return { data: null, error }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn,
    signUp,
    signOut,
    loading
  }
}
