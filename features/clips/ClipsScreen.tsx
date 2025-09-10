/**
 * Clips Management Screen Component
 * 
 * A complete screen for managing user clips with premium gating and real-time updates.
 * This screen demonstrates how to integrate the clips management system with the
 * entitlement system to provide different experiences for free and premium users.
 * 
 * What it does:
 * - Shows all the user's clips in a scrollable list
 * - Shows if the user is premium or free
 * - Lets premium users add new clips with a form
 * - Shows "upgrade to premium" message for free users
 * - Automatically refreshes when new clips are added
 * - Shows loading states and error messages
 * - Handles empty states when there are no clips
 * 
 * This component serves as a complete example of how to integrate the clips
 * management system into your app and can be used as-is or customized.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { session } = useSession()
 *   
 *   if (!session) return <AuthScreen />
 *   return <ClipsScreen />
 * }
 * ```
 */

import { useSession } from '@/hooks/useSession'
import React, { useState } from 'react'
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useEmailAuth } from '../auth/useEmailAuth'
import { useEntitlement } from '../auth/useEntitlement'
import { useClips } from './useClips'

export default function ClipsScreen() {
  const { session } = useSession()
  const { clips, loading, addClip } = useClips()
  const { entitlement } = useEntitlement()
  const { signOut } = useEmailAuth()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const handleAddClip = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL')
      return
    }

    if (!entitlement.is_premium) {
      Alert.alert('Premium Required', 'You need a premium subscription to add clips')
      return
    }

    const { error } = await addClip(url, 'manual', title || undefined)
    
    if (error) {
      Alert.alert('Error', 'Failed to add clip')
    } else {
      Alert.alert('Success', 'Clip added successfully!')
      setUrl('')
      setTitle('')
    }
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      Alert.alert('Error', 'Failed to sign out')
    }
  }

  const renderClip = ({ item }: { item: any }) => (
    <View style={styles.clipItem}>
      <Text style={styles.clipTitle}>{item.title || 'Untitled'}</Text>
      <Text style={styles.clipUrl}>{item.url}</Text>
      <Text style={styles.clipSource}>Source: {item.source}</Text>
      <Text style={styles.clipDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading clips...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Clips</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        <Text style={styles.boldText}>Email:</Text> {session?.user?.email || 'Unknown'}
      </Text>
      <Text style={styles.subtitle}>
        <Text style={styles.boldText}>Account Status:</Text> {entitlement.is_premium ? 'Premium' : 'Free'} 
        {entitlement.is_premium ? ` (${entitlement.plan})` : ''}
      </Text>
      <Text style={styles.subtitle}>
        <Text style={styles.boldText}>Storage:</Text> {entitlement.is_premium ? 'Cloud (Supabase) + Local Cache' : 'Local Only (AsyncStorage)'}
      </Text>

      {entitlement.is_premium && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Clip URL"
            value={url}
            onChangeText={setUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Title (optional)"
            value={title}
            onChangeText={setTitle}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddClip}>
            <Text style={styles.addButtonText}>Add Clip</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={clips}
        renderItem={renderClip}
        keyExtractor={(item) => item.id}
        style={styles.clipsList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {entitlement.is_premium ? 'No clips yet. Add one above!' : 'Upgrade to premium to add clips'}
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  storageInfo: {
    fontSize: 14,
    marginBottom: 20,
    color: '#888',
    fontStyle: 'italic',
  },
  boldText: {
    fontWeight: 'bold',
  },
  addForm: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clipsList: {
    flex: 1,
  },
  clipItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clipUrl: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  clipSource: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  clipDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontSize: 16,
  },
})
