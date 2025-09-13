# ClipRack 📱

A React Native app built with Expo that allows users to share content from other apps and collect video embeds from platforms like Instagram, TikTok, and YouTube.

## 🚨 CRITICAL: Package Manager Rules

**⚠️ NEVER use npm or yarn in this project!**

### ✅ Use ONLY pnpm:
```bash
pnpm install          # Install dependencies
pnpm add package-name # Add new packages
pnpm remove package-name # Remove packages
```

### ❌ NEVER use:
```bash
npm install           # ❌ BREAKS EVERYTHING
yarn add package-name # ❌ BREAKS EVERYTHING
```

## 📦 Quick Start

### Prerequisites
- Node.js 20+ (use `nvm use 20`)
- pnpm installed globally
- iOS: Xcode 15+ with iOS 17+ device

### Installation
```bash
# 1. Install dependencies
nvm use 20
pnpm install

# 2. Prebuild iOS project
npx expo prebuild --no-install --clean

# 3. Open in Xcode and configure signing
open ios/ClipRack.xcworkspace

# 4. Run the app
npx expo run:ios --device
```

## 📱 Share Extension (In Development)

This app uses **expo-share-extension** to create an iOS share extension that allows users to share content from other apps (Safari, Instagram, TikTok, YouTube, etc.) directly into ClipRack.


### 📋 Share Process Flow
1. **User shares content** from any app (Instagram, TikTok, YouTube, Safari, etc.)
2. **Share extension popup appears** with ClipRack's custom interface
3. **User can optionally select a category** for the shared content
4. **Content is saved** to shared storage (MMKV with App Groups)
5. **Share extension closes** without opening the main app
6. **Main app displays** the new content in the clips gallery

### 🔧 Technical Implementation

#### Core Modules
- **`expo-share-extension`** - Main share extension framework
- **`react-native-mmkv`** - High-performance shared storage with App Groups support, enables sharing between the main app and the share app
- **`@react-native-async-storage/async-storage`** - Fallback storage solution

#### Storage Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main App      │    │   App Group      │    │  Share Extension│
│                 │    │   (MMKV)         │    │                 │
│ • cliprack_     │◄──►│ • cliprack_      │◄──►│ • cliprack_     │
│   embeds        │    │   embeds         │    │   embeds        │
│ • cliprack_     │    │ • cliprack_      │    │ • cliprack_     │
│   categories    │    │   categories     │    │   categories    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Configuration
- **Main App Bundle ID**: `com.alexdonnelly.ClipRackApp`
- **Share Extension Bundle ID**: `com.alexdonnelly.ClipRackApp.ShareExtension`
- **App Group**: `group.com.alexdonnelly.ClipRackApp`

## 🔐 Xcode Signing Issues

### Common Error
```
Provisioning profile "iOS Team Provisioning Profile: com.alexdonnelly.ClipRackApp.ShareExtension" doesn't match the entitlements file's value for the com.apple.security.application-groups entitlement.
```

### Quick Fix
1. **Open Xcode**: `open ios/ClipRack.xcworkspace`
2. **Select ClipRackShareExtension target** in the left sidebar
3. **Go to "Signing & Capabilities" tab**
4. **Temporarily uncheck "Automatically manage signing"**
5. **Check "Automatically manage signing" again**
6. **Build the project**

### Alternative Fix
```bash
# Clean and rebuild
cd ios && xcodebuild clean -workspace ClipRack.xcworkspace -scheme ClipRack
npx expo run:ios --device
```

### Required Settings
Both targets must have:
- ✅ **App Groups capability enabled**
- ✅ **Same App Group ID**: `group.com.alexdonnelly.ClipRackApp`
- ✅ **Automatic signing enabled**

## 🚨 Hard Reset Issue

**If you hard reset your project, you'll lose the xcode patch fix!**

### How to Fix After Hard Reset:
```bash
# 1. Reinstall packages
pnpm install

# 2. Run prebuild
npx expo prebuild --no-install --clean
```

## 💡 Prevention

1. **Only use pnpm** for this project
2. **Don't hard reset** unless you're prepared to reapply the xcode patch
3. **Commit the fixed xcode package** if you want it to survive resets

---

**Remember**: This project requires careful attention to package management and proper Xcode signing configuration for the share extension to work!