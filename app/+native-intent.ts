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
