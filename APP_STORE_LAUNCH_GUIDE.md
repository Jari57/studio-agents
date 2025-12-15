# 📱 App Store Launch Guide - Whip Montez

This guide covers everything needed to launch the Whip Montez app on Apple App Store, Google Play Store, and other marketplaces.

---

## 🎵 STEP 1: Firebase Storage Audio Setup (REQUIRED FOR PRODUCTION)

### Upload Audio Files to Firebase Storage

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (whip-montez or similar)
3. **Navigate to Storage** → Click "Get Started" if not already set up
4. **Create an `audio/` folder** in the root of storage
5. **Upload MP3 files** with these exact names:

#### Livewire Sessions (Tape 1)
| File Name | Track |
|-----------|-------|
| `audio/whip-montez-kanye-freestyle.mp3` | Freestyle (Kanye Beat) |
| `audio/whip-montez-50-freestyle.mp3` | Feat. Ali Vegas (50 Cent Beat) |
| `audio/whip-montez-sprung-remix.mp3` | Sprung (Remix) |
| `audio/whip-montez-push-it.mp3` | Push It (Remix) |
| `audio/whip-montez-jim-jones-freestyle.mp3` | Freestyle (Jim Jones Beat) |

#### Red Hook Diaries (Tape 2)
| File Name | Track |
|-----------|-------|
| `audio/whip-montez-stand-up.mp3` | Stand Up |
| `audio/whip-montez-brooklyn-anthem.mp3` | Brooklyn Anthem feat. Alfonzo Hunter |
| `audio/whip-montez-sit-back-remain.mp3` | Sit Back n Remain (Freestyle) |
| `audio/whip-montez-youngstar.mp3` | YoungStar |
| `audio/whip-montez-no-matter.mp3` | No Matter You Say |

#### The Stoop (Tape 3)
| File Name | Track |
|-----------|-------|
| `audio/whip-montez-catching-feelings.mp3` | U Catching Feelings |
| `audio/whip-montez-only-you.mp3` | Only You |
| `audio/whip-montez-dear-god.mp3` | Dear GOD |
| `audio/whip-montez-i-use-to-love.mp3` | I Use to Love feat. Kia |
| `audio/whip-montez-it-gets-hard.mp3` | It Gets Hard |

### Firebase Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for audio files
    match /audio/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Authenticated access for other uploads
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📱 STEP 2: Convert to Native App

### Option A: Capacitor (Recommended - Ionic)

```powershell
# Install Capacitor
cd frontend
npm install @capacitor/core @capacitor/cli
npx cap init "Whip Montez" "com.whipmontez.app"

# Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync

# Open in native IDEs
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

### Option B: PWA (Progressive Web App)
Already configured! Add to `frontend/public/manifest.json`:
```json
{
  "name": "Whip Montez",
  "short_name": "WhipMontez",
  "description": "Brooklyn Hip-Hop Artist & AI Studio",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#00ff41",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🍎 STEP 3: Apple App Store Requirements

### Developer Account
- **Cost**: $99/year
- **Sign up**: https://developer.apple.com/programs/

### Required Assets
| Asset | Dimensions | Notes |
|-------|------------|-------|
| App Icon | 1024x1024 px | No transparency, no rounded corners |
| iPhone Screenshots | 1290x2796 px | 6.7" display (required) |
| iPhone Screenshots | 1179x2556 px | 6.1" display |
| iPad Screenshots | 2048x2732 px | 12.9" display |
| Preview Video | 1080x1920 px | 15-30 seconds |

### App Store Connect Info Needed
- **App Name**: Whip Montez
- **Subtitle**: Brooklyn Hip-Hop & AI Studio
- **Category**: Music (Primary), Entertainment (Secondary)
- **Privacy Policy URL**: Required (host on your website)
- **Support URL**: Required
- **Age Rating**: 12+ (for lyrics content)
- **Description**: 4000 characters max

### iOS Specific Code (Capacitor)
Add to `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.whipmontez.app',
  appName: 'Whip Montez',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#000000'
  }
};
```

---

## 🤖 STEP 4: Google Play Store Requirements

### Developer Account
- **Cost**: $25 one-time
- **Sign up**: https://play.google.com/console

### Required Assets
| Asset | Dimensions | Notes |
|-------|------------|-------|
| App Icon | 512x512 px | PNG, 32-bit |
| Feature Graphic | 1024x500 px | Banner for store listing |
| Phone Screenshots | 1080x1920 px | Minimum 2, max 8 |
| Tablet Screenshots | 1920x1080 px | 7" and 10" tablets |
| Promo Video | YouTube link | Optional but recommended |

### Google Play Console Info
- **Short Description**: 80 characters max
- **Full Description**: 4000 characters max
- **Content Rating**: Complete questionnaire
- **Data Safety**: Declare data collection practices
- **Target Audience**: 13+ (for music content)

### Android Specific (Capacitor)
Update `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.whipmontez.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 🌐 STEP 5: Other Marketplaces

### Amazon Appstore
- **Cost**: Free
- **URL**: https://developer.amazon.com/apps-and-games
- Use same Android APK
- Additional fire TV screenshots if targeting

### Samsung Galaxy Store
- **Cost**: Free
- **URL**: https://seller.samsungapps.com
- Use same Android APK
- Samsung-specific features optional

### Microsoft Store (Windows)
- **Cost**: $19 one-time
- **URL**: https://partner.microsoft.com/dashboard
- Package as MSIX or use PWA submission
- PWA can be submitted directly

### Huawei AppGallery
- **Cost**: Free
- **URL**: https://developer.huawei.com
- Requires HMS Core integration for some features

---

## 📋 STEP 6: Pre-Launch Checklist

### Legal & Compliance
- [ ] **Privacy Policy** - Create and host (required for all stores)
- [ ] **Terms of Service** - Create and host
- [ ] **GDPR Compliance** - Cookie consent, data deletion
- [ ] **CCPA Compliance** - California privacy rights
- [ ] **Music Licensing** - Ensure all tracks are properly licensed
- [ ] **Copyright Clearance** - All artwork, samples cleared

### Technical Requirements
- [ ] **SSL Certificate** - HTTPS required
- [ ] **Firebase Security Rules** - Production-ready rules
- [ ] **API Rate Limiting** - Protect backend
- [ ] **Error Tracking** - Sentry or similar
- [ ] **Analytics** - Firebase Analytics or Mixpanel
- [ ] **Crash Reporting** - Firebase Crashlytics

### Content & Assets
- [ ] **App Icons** - All sizes for iOS & Android
- [ ] **Splash Screen** - Loading screen
- [ ] **Screenshots** - All required dimensions
- [ ] **App Preview Video** - 15-30 second demo
- [ ] **Store Descriptions** - Written and translated
- [ ] **Keywords** - ASO optimized keywords

### Testing
- [ ] **Beta Testing** - TestFlight (iOS), Internal Testing (Android)
- [ ] **Device Testing** - Multiple screen sizes
- [ ] **Accessibility** - VoiceOver, TalkBack support
- [ ] **Performance** - Load times under 3 seconds
- [ ] **Offline Mode** - Graceful degradation

---

## 🎨 STEP 7: Brand Assets Needed

### App Icon Design
Create at these sizes:
```
iOS:
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)

Android:
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)
```

### Suggested App Icon Concept
- Black background (#000000)
- Neon green "WM" monogram (#00ff41)
- Cassette tape subtle element
- Glitch/digital effect optional

---

## 💰 STEP 8: Monetization Setup

### In-App Purchases (Already Implemented)
Current paywall tiers work with both stores:
- **Early Adopter**: $29/month
- **VIP Access**: $79/month  
- **Founding Member**: $149/month

### App Store Configuration
**iOS (App Store Connect)**:
1. Go to Features → In-App Purchases
2. Create Subscription Group: "Whip Montez Premium"
3. Add subscription tiers with pricing

**Android (Play Console)**:
1. Go to Monetize → Subscriptions
2. Create subscription products
3. Link to app billing

### Stripe Integration
Already configured in backend. Ensure webhook endpoints are production URLs.

---

## 🚀 STEP 9: Launch Timeline

### Week 1-2: Preparation
- [ ] Upload audio to Firebase Storage
- [ ] Create all store assets (icons, screenshots)
- [ ] Write store descriptions
- [ ] Set up Capacitor native builds

### Week 3: Beta Testing
- [ ] iOS TestFlight beta (2000 testers max)
- [ ] Android Internal Testing
- [ ] Collect feedback, fix critical bugs

### Week 4: Submission
- [ ] Submit to Apple App Store (1-3 day review)
- [ ] Submit to Google Play Store (1-7 day review)
- [ ] Submit to secondary stores

### Week 5: Launch
- [ ] Coordinate release date
- [ ] Press kit ready
- [ ] Social media announcement
- [ ] Monitor reviews and respond

---

## 📞 Support Setup

### Required for Store Submissions
1. **Support Email**: support@whipmontez.com
2. **Privacy Policy URL**: https://whipmontez.com/privacy
3. **Terms of Service URL**: https://whipmontez.com/terms
4. **Support Website**: https://whipmontez.com/support

---

## 🔧 Quick Commands

```powershell
# Build for production
cd frontend
npm run build

# iOS build (requires Mac with Xcode)
npx cap sync ios
npx cap open ios

# Android build
npx cap sync android
npx cap open android

# Generate signed APK (Android Studio)
# Build → Generate Signed Bundle/APK

# Generate IPA (Xcode)  
# Product → Archive → Distribute App
```

---

## ✅ Final Checklist Before Submit

- [ ] All audio files uploaded to Firebase Storage
- [ ] Privacy Policy live and accessible
- [ ] Terms of Service live and accessible
- [ ] App icons at all required sizes
- [ ] Screenshots for all device sizes
- [ ] Store descriptions written
- [ ] Contact information correct
- [ ] Payment/subscription tested
- [ ] No placeholder content
- [ ] No debug/development code
- [ ] Performance optimized
- [ ] Crash-free on all test devices

---

*Created: December 14, 2025*
*Project: Whip Montez - Brooklyn Hip-Hop & AI Studio*
