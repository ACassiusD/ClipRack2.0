import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    // Always go to home tab
    console.log('🚀 Root Index: Going to home tab');
    router.replace('/(tabs)');
  }, [router]);

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
