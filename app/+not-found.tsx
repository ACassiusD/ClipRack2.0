/**
 * Not Found Page for Expo Router
 * 
 * This file is automatically triggered when no matching route is found.
 * It's a catch-all page that displays when users navigate to invalid URLs.
 * 
 * HOW IT WORKS:
 * 1. When a user navigates to a route that doesn't exist
 * 2. Expo Router automatically renders this component
 * 3. Users see a friendly error message instead of a crash
 * 
 * WHY THIS IS NEEDED:
 * - Provides a better user experience for invalid routes
 * - Prevents app crashes from malformed navigation
 * - Gives users a way to navigate back to valid routes
 * 
 * CONFIGURATION:
 * - Automatically detected by Expo Router when placed in app/ directory
 * - No additional setup required
 * - Can be customized to match your app's design
 * 
 * DOCUMENTATION:
 * - See: https://docs.expo.dev/router/error-handling/
 * 
 * @param error - The error that caused this page to render
 * @param retry - Function to retry the failed navigation
 */
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
