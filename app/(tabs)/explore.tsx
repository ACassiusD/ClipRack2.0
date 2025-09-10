import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AuthScreen from '@/features/auth/AuthScreen';
import ClipsScreen from '@/features/clips/ClipsScreen';
import { useSession } from '@/hooks/useSession';
import { StyleSheet } from 'react-native';

export default function TabTwoScreen() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Authentication Testing</ThemedText>
        <ThemedText style={styles.subtitle}>
          Test the new authentication and clips features
        </ThemedText>
      </ThemedView>

      {!session ? (
        <AuthScreen />
      ) : (
        <ClipsScreen />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Add space for status bar
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
});
