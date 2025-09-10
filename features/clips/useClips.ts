/**
 * Clips Management Hook
 * 
 * This hook manages clip data for the ClipRack app, providing CRUD operations
 * for user clips with automatic premium gating and effective view integration.
 * 
 * What it does:
 * - Loads all the user's clips from the database
 * - Only shows the most recent 300 clips for free users (unlimited for premium)
 * - Lets users add new clips (free users can add up to 300, premium unlimited)
 * - Automatically refreshes the list when clips are added
 * - Shows loading states while fetching data
 * - Handles errors if something goes wrong
 * 
 * The effective view automatically handles the 300 clip limit for free users,
 * showing only the most recent 300 clips for non-premium users while allowing
 * unlimited clips for premium subscribers.
 * 
 * @returns {Object} Clips state and management functions
 * @returns {Clip[]} clips - Array of user clips
 * @returns {boolean} loading - Whether clips are being loaded
 * @returns {Function} fetchClips - Manually refresh clips data
 * @returns {Function} addClip - Add a new clip (premium only)
 * 
 * @example
 * ```tsx
 * function ClipsList() {
 *   const { clips, loading, addClip } = useClips()
 *   
 *   const handleAddClip = async (url, title) => {
 *     const { error } = await addClip(url, 'manual', title)
 *     if (error) console.error('Failed to add clip:', error)
 *   }
 * }
 * ```
 */

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export interface Clip {
  id: string
  user_id: string
  url: string
  source: string
  title?: string
  created_at: string
  updated_at: string
}

/**
 * React hook for managing clips with state
 * @returns {Object} Clips state and management functions
 */
export function useClips() {
  // State to store the user's clips and loading status
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Fetch clips from database and update React state
   */
  const fetchClips = async () => {
    try {
      setLoading(true)
      
      // Get clips from the effective view (handles 300 limit for free users)
      const { data, error } = await supabase
        .from('clips_effective')
        .select('*')
        .order('created_at', { ascending: false })  // Newest clips first
        .limit(50)  // Only get 50 clips at a time for performance

      if (error) throw error
      setClips(data || [])  // Store the clips in state
    } catch (error) {
      console.warn('Error fetching clips:', error)
      setClips([])  // Clear clips on error
    } finally {
      setLoading(false)  // Always stop loading
    }
  }

  // Automatically load clips when the component mounts
  useEffect(() => {
    fetchClips()
  }, [])

  /**
   * Add a new clip to the database and refresh the list
   * @param {string} url - The clip URL to save
   * @param {string} source - Where the clip came from
   * @param {string} [title] - Optional title for the clip
   * @returns {Promise<{data: any, error: any}>} Result object with created clip or error
   */
  const addClip = async (url: string, source: string, title?: string) => {
    try {
      // Get the current user to ensure they're logged in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Insert the new clip into the database
      const { data, error } = await supabase
        .from('clips')
        .insert({
          user_id: user.id,  // Link the clip to the current user
          url,               // The clip URL
          source,            // Where the clip came from (e.g., 'manual', 'tiktok')
          title,             // Optional title for the clip
        })
        .select()
        .single()  // Return the created clip

      if (error) throw error

      // Refresh the clips list to show the new clip
      await fetchClips()
      
      return { data, error: null }
    } catch (error) {
      console.warn('Error adding clip:', error)
      return { data: null, error }
    }
  }

  // Return the state and functions for components to use
  return {
    clips,        // Array of user's clips
    loading,      // Whether data is currently loading
    fetchClips,   // Function to manually refresh clips
    addClip       // Function to add a new clip
  }
}

// Standalone functions for one-time operations (not using React state)

/**
 * Get clips from database without React state
 * @returns {Promise<Clip[]>} Array of user's clips
 */
export async function getClips(): Promise<Clip[]> {
  try {
    // Fetch clips from the effective view (handles 300 limit for free users)
    const { data, error } = await supabase
      .from('clips_effective')
      .select('*')
      .order('created_at', { ascending: false })  // Newest first
      .limit(50)  // Limit for performance

    if (error) throw error
    return data || []  // Return empty array if no data
  } catch (error) {
    console.warn('Error fetching clips:', error)
    return []  // Return empty array on error
  }
}

/**
 * Create a new clip in database without React state
 * @param {string} url - The clip URL to save
 * @param {string} source - Where the clip came from
 * @param {string} [title] - Optional title for the clip
 * @returns {Promise<{data: any, error: any}>} Result object with created clip or error
 */
export async function createClip(url: string, source: string, title?: string) {
  try {
    // Get the current user to ensure they're logged in
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Insert the new clip into the database
    const { data, error } = await supabase
      .from('clips')
      .insert({
        user_id: user.id,  // Link the clip to the current user
        url,               // The clip URL
        source,            // Where the clip came from
        title,             // Optional title for the clip
      })
      .select()
      .single()  // Return the created clip

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.warn('Error creating clip:', error)
    return { data: null, error }
  }
}
