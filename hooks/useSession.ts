/**
 * Supabase Session Management Hook
 * 
 * This hook provides Supabase authentication state management for the ClipRack app.
 * It automatically handles session persistence, loading states, and auth state changes.
 * 
 * Features:
 * - Real-time session state updates
 * - Automatic session restoration on app start
 * - Loading state management
 * - Cleanup on component unmount
 * 
 * @returns {Object} Session state and loading status
 * @returns {Session|null} session - Current user session or null if not authenticated
 * @returns {boolean} loading - Whether the session is being loaded
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { session, loading } = useSession()
 *   
 *   if (loading) return <LoadingSpinner />
 *   if (!session) return <LoginScreen />
 *   return <AuthenticatedApp />
 * }
 * ```
 */

import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}
