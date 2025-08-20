import { Link, Stack, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Log all the routing information when not-found is hit
    console.log('🚨 NOT-FOUND PAGE TRIGGERED!');
    console.log('🚨 Pathname:', pathname);
    console.log('🚨 Search Params:', params);
    console.log('🚨 Full URL:', pathname + (Object.keys(params).length ? '?' + JSON.stringify(params) : ''));
    console.log('🚨 Timestamp:', new Date().toISOString());
    
    // Log the current navigation state
    console.log('🚨 Navigation Stack Info:');
    console.log('🚨 - Attempted Route:', pathname);
    console.log('🚨 - Available Routes: ["/", "/(tabs)", "/(tabs)/index", "/(tabs)/explore", "/(tabs)/embeds"]');
    
    // Additional debugging info
    console.log('🚨 Stack Trace:', new Error().stack);
  }, [pathname, params]);

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <ThemedText type="subtitle">Route: {pathname}</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
