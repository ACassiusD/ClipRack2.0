import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const router = useRouter();

  // Handle any errors
  React.useEffect(() => {
    if (error) {
      Alert.alert('Share Intent Error', String(error));
    }
  }, [error]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome too ClipRack!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>

      {/* Share Intent Demo Section */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Share Intent Demo</ThemedText>
        {hasShareIntent ? (
          <ThemedView style={styles.shareContent}>
            <ThemedText type="defaultSemiBold">Shared Content:</ThemedText>
            
            {shareIntent.text && (
              <ThemedText>Text: {shareIntent.text}</ThemedText>
            )}
            
            {shareIntent.webUrl && (
              <ThemedText>URL: {shareIntent.webUrl}</ThemedText>
            )}
            
            {shareIntent.files && shareIntent.files.length > 0 && (
              <ThemedText>Files: {shareIntent.files.length} file(s)</ThemedText>
            )}
            
            {shareIntent.meta?.title && (
              <ThemedText>Title: {shareIntent.meta.title}</ThemedText>
            )}
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => resetShareIntent()}
            >
              <ThemedText type="defaultSemiBold" style={styles.buttonText}>
                Reset Share Intent
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
                  ) : (
            <ThemedText>
              Share something to this app from another app to see it here!
            </ThemedText>
          )}
          
          {/* Navigation Button */}
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => router.push('/share')}
          >
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Go to Share Page
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ParallaxScrollView>
    );
  }

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  shareContent: {
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  navButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
});
