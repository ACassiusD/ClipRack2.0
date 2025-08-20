import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { hasShareIntent, shareIntent } = useShareIntent();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Debug: Log all navigation attempts
  useEffect(() => {
    console.log('🔍 Root Layout: Component mounted');
    console.log('🔍 Root Layout: Router object:', router);
    console.log('🔍 Root Layout: Share intent state:', { hasShareIntent, shareIntent });
  }, []);

  // Handle share intent at the root level
  useEffect(() => {
    if (hasShareIntent && shareIntent?.webUrl) {
      console.log('🚀 Root Layout: Share intent detected, redirecting to clips tab');
      console.log('🚀 Root Layout: Web URL:', shareIntent.webUrl);
      console.log('🚀 Root Layout: About to navigate to /(tabs)/embeds');
      // Redirect to clips tab when there's a share intent
      try {
        console.log('🚀 Root Layout: Attempting navigation...');
        router.replace('/(tabs)/embeds');
        console.log('🚀 Root Layout: Navigation call completed');
      } catch (error) {
        console.error('🚨 Root Layout: Navigation failed:', error);
        // Fallback: try to navigate to tabs first
        try {
          console.log('🚀 Root Layout: Trying fallback navigation to /(tabs)');
          router.replace('/(tabs)');
        } catch (fallbackError) {
          console.error('🚨 Root Layout: Fallback navigation also failed:', fallbackError);
        }
      }
    } else if (loaded) {
      console.log('🚀 Root Layout: No share intent, going to home tab');
      // No share intent, go to home tab
      router.replace('/(tabs)');
    }
  }, [hasShareIntent, shareIntent?.webUrl, router, loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
