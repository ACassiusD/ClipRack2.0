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

## 🚨 CRITICAL: Hard Reset Issue

**If you hard reset your project, you'll lose the xcode patch fix!**

### What Happens on Hard Reset:
- ✅ Your code files come back
- ✅ `package.json` with dependencies comes back  
- ❌ **The xcode patch gets lost** - It was applied manually to `node_modules/`
- ❌ **Share intent will break again** with the same error

### The Error You'll Get:
```
TypeError: Cannot read properties of null (reading 'path')
```

### How to Fix After Hard Reset:
```bash
# 1. Reinstall packages
pnpm install

# 2. Apply the xcode patch manually (the patch-package will fail)
sed -i '' 's/if (project.pbxGroupByName(group).path)/if (project.pbxGroupByName(group)\&\&project.pbxGroupByName(group).path)/' node_modules/.pnpm/xcode@3.0.1/node_modules/xcode/lib/pbxProject.js

# 3. Run prebuild
npx expo prebuild --no-install --clean
```

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js 20+ (use `nvm use 20`)
- pnpm installed globally
- iOS: Xcode 15+ with iOS 17+ device

### 2. Install Dependencies
```bash
nvm use 20
pnpm install
```

### 3. iOS Setup (Required for Share Intent)
```bash
# Prebuild iOS project
npx expo prebuild --no-install --clean

# Open in Xcode
open ios/ClipRack.xcodeproj

# Configure signing and provisioning profiles
# Bundle ID: com.alexdonnelly.ClipRackApp
```

### 4. Run the App
```bash
# iOS device
npx expo run:ios --device
```

## 🔧 Why This Happens

**Mixed package managers** + **pnpm's unique structure** + **patch-package confusion** = **patches applied to wrong locations**

The xcode patch needs to be applied to the **pnpm version** of the package, not just a copy. When you hard reset, the manual fix gets lost.

## 💡 Prevention

1. **Only use pnpm** for this project
2. **Don't hard reset** unless you're prepared to reapply the xcode patch
3. **Commit the fixed xcode package** if you want it to survive resets

---

**Remember**: This project requires careful attention to package management and the xcode patch for share intent to work!
