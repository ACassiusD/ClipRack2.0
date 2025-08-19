import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import React from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

export default function ShareScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  const router = useRouter();

  // Handle any errors
  React.useEffect(() => {
    if (error) {
      Alert.alert('Share Intent Error', error.message);
    }
  }, [error]);

  // If no share intent, redirect to home
  React.useEffect(() => {
    if (!hasShareIntent) {
      router.replace('/(tabs)');
    }
  }, [hasShareIntent, router]);

  if (!hasShareIntent) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Shared Content</ThemedText>
        <ThemedText type="subtitle">Content shared from another app</ThemedText>
      </ThemedView>

      <ThemedView style={styles.contentContainer}>
        {/* Text Content */}
        {shareIntent.text && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Text Content:</ThemedText>
            <ThemedView style={styles.textBox}>
              <ThemedText style={styles.contentText}>{shareIntent.text}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* URL Content */}
        {shareIntent.webUrl && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>URL:</ThemedText>
            <ThemedView style={styles.textBox}>
              <ThemedText style={styles.contentText}>{shareIntent.webUrl}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* File Content */}
        {shareIntent.files && shareIntent.files.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Files ({shareIntent.files.length}):</ThemedText>
            {shareIntent.files.map((file, index) => (
              <ThemedView key={index} style={styles.fileItem}>
                <ThemedText>File {index + 1}: {file.name || `File ${index + 1}`}</ThemedText>
                {file.type && <ThemedText>Type: {file.type}</ThemedText>}
                {file.size && <ThemedText>Size: {file.size} bytes</ThemedText>}
              </ThemedView>
            ))}
          </ThemedView>
        )}

        {/* Meta Information */}
        {shareIntent.meta && (
          <ThemedView style={styles.section}>
            <ThemedText type="defaultSemiBold">Additional Information:</ThemedText>
            {shareIntent.meta.title && (
              <ThemedText>Title: {shareIntent.meta.title}</ThemedText>
            )}
            {shareIntent.meta.description && (
              <ThemedText>Description: {shareIntent.meta.description}</ThemedText>
            )}
            {shareIntent.meta.thumbnail && (
              <ThemedText>Has thumbnail</ThemedText>
            )}
          </ThemedView>
        )}

        {/* Action Buttons */}
        <ThemedView style={styles.actions}>
          <ThemedText 
            type="defaultSemiBold" 
            style={styles.resetButton}
            onPress={resetShareIntent}
          >
            Clear Shared Content
          </ThemedText>
          
          <ThemedText 
            type="defaultSemiBold" 
            style={styles.homeButton}
            onPress={() => router.push('/(tabs)')}
          >
            Go to Home
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textBox: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    minHeight: 50,
  },
  fileItem: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    color: '#ffffff',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#dc3545',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dc3545',
    fontWeight: '600',
  },
  homeButton: {
    color: '#ffffff',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#28a745',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#212529',
    fontSize: 16,
    fontWeight: '600',
  },
  contentText: {
    color: '#212529',
    fontSize: 14,
    lineHeight: 20,
  },
});
