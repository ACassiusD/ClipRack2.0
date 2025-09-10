# ClipRack Authentication Setup Guide

This guide will help you set up authentication in your ClipRack app using Supabase and Expo.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Apple Developer account (for Apple Sign-In)

## Step 1: Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can find these values in your Supabase project dashboard under Settings > API.

## Security Note

This implementation uses `expo-secure-store` for token storage, which provides:
- **iOS Keychain** integration for encrypted storage
- **Android Keystore** integration for encrypted storage
- **Production-ready security** by default
- **No plaintext storage** of sensitive authentication tokens

This is significantly more secure than AsyncStorage and is the recommended approach for production apps.

## Step 2: Supabase Database Setup

Run these SQL commands in your Supabase SQL editor to set up the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create entitlements table
CREATE TABLE entitlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  is_premium BOOLEAN DEFAULT FALSE,
  plan TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clips table
CREATE TABLE clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clips_effective view (enforces 300 clip limit for free users)
CREATE OR REPLACE VIEW clips_effective AS
SELECT 
  c.*,
  CASE 
    WHEN e.is_premium = true THEN c.created_at
    ELSE (
      SELECT created_at 
      FROM clips c2 
      WHERE c2.user_id = c.user_id 
      ORDER BY created_at DESC 
      LIMIT 1 OFFSET 299
    )
  END as effective_created_at
FROM clips c
LEFT JOIN entitlements e ON c.user_id = e.user_id
WHERE 
  e.is_premium = true 
  OR c.created_at >= (
    SELECT COALESCE(
      (SELECT created_at 
       FROM clips c2 
       WHERE c2.user_id = c.user_id 
       ORDER BY created_at DESC 
       LIMIT 1 OFFSET 299), 
      '1900-01-01'::timestamp
    )
  );

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Entitlements policies
CREATE POLICY "Users can view own entitlements" ON entitlements FOR SELECT USING (auth.uid() = user_id);

-- Clips policies
CREATE POLICY "Users can view own clips" ON clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clips" ON clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clips" ON clips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clips" ON clips FOR DELETE USING (auth.uid() = user_id);
```

## Step 3: Supabase Authentication Setup

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable Apple provider and configure it with your Apple Developer credentials
4. Optionally enable Email provider for development/testing

## Step 4: Apple Sign-In Setup (iOS)

1. In your Apple Developer account, enable "Sign in with Apple" for your bundle ID
2. Configure the service in your Apple Developer account
3. Add the Apple Sign-In capability to your iOS app in Xcode

## Step 5: Usage in Your App

### Basic Authentication

```tsx
import { useSession } from '@/hooks/useSession'
import AuthScreen from '@/features/auth/AuthScreen'

export default function App() {
  const { session, loading } = useSession()

  if (loading) {
    return <Text>Loading...</Text>
  }

  if (!session) {
    return <AuthScreen />
  }

  return <YourMainApp />
}
```

### Adding Clips

```tsx
import { useClips } from '@/features/clips/useClips'
import { useEntitlement } from '@/features/auth/useEntitlement'

export default function MyComponent() {
  const { clips, addClip } = useClips()
  const { entitlement } = useEntitlement()

  const handleAddClip = async (url: string, title?: string) => {
    if (!entitlement.is_premium) {
      alert('Premium required to add clips')
      return
    }

    const { error } = await addClip(url, 'manual', title)
    if (error) {
      console.error('Failed to add clip:', error)
    }
  }

  // ... rest of your component
}
```

### Checking Premium Status

```tsx
import { useEntitlement } from '@/features/auth/useEntitlement'

export default function MyComponent() {
  const { entitlement, loading } = useEntitlement()

  if (loading) return <Text>Loading...</Text>

  return (
    <View>
      <Text>Status: {entitlement.is_premium ? 'Premium' : 'Free'}</Text>
      {entitlement.plan && <Text>Plan: {entitlement.plan}</Text>}
    </View>
  )
}
```

## File Structure

```
lib/
  supabase.ts                 # Supabase client configuration
hooks/
  useSession.ts              # Session management hook
features/
  auth/
    AppleSignInButton.tsx    # Apple Sign-In component
    AuthScreen.tsx           # Complete auth screen
    useEmailAuth.ts          # Email/password auth
    useEntitlement.ts        # Premium status checking
  clips/
    ClipsScreen.tsx          # Example clips screen
    useClips.ts              # Clips data management
```

## Next Steps

1. Set up your environment variables
2. Run the database setup SQL
3. Configure Supabase authentication providers
4. Test the authentication flow
5. Integrate the auth components into your existing app structure

## Security Features

- **Secure Token Storage**: Uses expo-secure-store with iOS Keychain/Android Keystore
- **Row Level Security (RLS)**: All database operations are protected by RLS policies
- **Environment Variables**: Sensitive keys are stored in environment variables
- **Production Ready**: No plaintext storage of sensitive data
- **Automatic Token Refresh**: Tokens are refreshed securely without user intervention

## Notes

- The `clips_effective` view automatically enforces the 300 clip limit for free users
- All database operations use Row Level Security (RLS) for security
- Session persistence is handled automatically with secure storage
- Apple Sign-In requires proper iOS configuration
- For local debugging only, you can temporarily switch back to AsyncStorage, but never ship it
