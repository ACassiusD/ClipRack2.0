/**
 * Native Intent Handler for Expo Router
 * 
 * This file intercepts deep links and share intents BEFORE they reach the router,
 * preventing malformed routes from hitting the not-found page.
 * 
 * HOW IT WORKS:
 * 1. When a share intent is triggered, expo-share-intent generates a deep link
 *    like: /dataUrl=cliprackShareKey
 * 2. This handler catches that deep link and redirects to a valid route
 * 3. The user never sees the malformed URL or hits the not-found page
 * 
 * WHY THIS IS NEEDED:
 * - Share intents generate internal URLs that aren't valid app routes
 * - Without this handler, users would see "This screen does not exist"
 * - This ensures smooth navigation from share intents to the clips tab
 * 
 * CONFIGURATION:
 * - This is a special Expo Router feature that automatically gets detected
 * - No additional configuration needed - just place this file in the app/ directory
 * - Expo Router automatically calls redirectSystemPath for all incoming deep links
 * 
 * DOCUMENTATION:
 * - See: https://docs.expo.dev/versions/latest/sdk/router/#nativeintent
 * 
 * @param path - The incoming deep link path (e.g., /dataUrl=cliprackShareKey)
 * @param initial - The initial route when the app was launched
 * @returns A valid route path that the app can navigate to
 */
import { getShareExtensionKey } from "expo-share-intent";

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: string;
}) {
  try {
    console.log('🔍 Native Intent: Processing path:', path);
    console.log('🔍 Native Intent: Initial path:', initial);
    
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      // redirect to the clips tab to handle data with the hook
      console.log(
        "[expo-router-native-intent] redirect to clips tab for share intent",
      );
      return "/(tabs)/embeds";
    }
    
    console.log('🔍 Native Intent: No share intent detected, using original path:', path);
    return path;
  } catch (error) {
    console.error('🚨 Native Intent: Error processing path:', error);
    return "/(tabs)";
  }
}
