/**
 * Entitlement Management Hook
 * 
 * This hook manages user entitlements and premium status for the ClipRack app.
 * It provides real-time access to user subscription information and premium features.
 * 
 * What it does:
 * - Checks if the user has a premium subscription
 * - Shows what plan they're on (if any)
 * - Tells you when their subscription expires
 * - Automatically loads this info when the component starts
 * - Lets you refresh the info manually
 * 
 * @returns {Object} Entitlement state and management functions
 * @returns {Entitlement} entitlement - Current user entitlement information
 * @returns {boolean} loading - Whether entitlement data is being loaded
 * @returns {Function} refetch - Manually refresh entitlement data
 * 
 * @example
 * ```tsx
 * function PremiumFeature() {
 *   const { entitlement, loading } = useEntitlement()
 *   
 *   if (loading) return <LoadingSpinner />
 *   if (!entitlement.is_premium) return <UpgradePrompt />
 *   return <PremiumContent />
 * }
 * ```
 */

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export interface Entitlement {
  is_premium: boolean
  expires_at?: string
  plan?: string
}

export function useEntitlement() {
  const [entitlement, setEntitlement] = useState<Entitlement>({ is_premium: false })
  const [loading, setLoading] = useState(true)

  const fetchEntitlement = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEntitlement({ is_premium: false })
        return
      }

      const { data, error } = await supabase
        .from('entitlements')
        .select('is_premium, expires_at, plan')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error fetching entitlement:', error)
      }

      setEntitlement(data ?? { is_premium: false })
    } catch (error) {
      console.warn('Error fetching entitlement:', error)
      setEntitlement({ is_premium: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntitlement()
  }, [])

  return {
    entitlement,
    loading,
    refetch: fetchEntitlement
  }
}

// Standalone function for one-time entitlement checks
export async function getEntitlement(): Promise<Entitlement> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { is_premium: false }

    const { data } = await supabase
      .from('entitlements')
      .select('is_premium, expires_at, plan')
      .eq('user_id', user.id)
      .single()

    return data ?? { is_premium: false }
  } catch (error) {
    console.warn('Error fetching entitlement:', error)
    return { is_premium: false }
  }
}
