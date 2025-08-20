import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function RootIndex() {
  const router = useRouter();
  const { hasShareIntent, shareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent && shareIntent?.webUrl) {
      console.log('🚀 Root Index: Share intent detected, redirecting to clips tab');
      console.log('🚀 Root Index: Web URL:', shareIntent.webUrl);
      // Redirect to clips tab when there's a share intent
      router.replace('/(tabs)/embeds');
    } else {
      console.log('🚀 Root Index: No share intent, going to home tab');
      // No share intent, go to home tab
      router.replace('/(tabs)');
    }
  }, [hasShareIntent, shareIntent?.webUrl, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ClipRack</Text>
      <Text style={styles.subtitle}>Loading...</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
