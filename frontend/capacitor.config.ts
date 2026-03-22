import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studioagents.app',
  appName: 'Studio Agents',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Studio Agents',
    backgroundColor: '#0a0a0a'
  },
  android: {
    allowMixedContent: false
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      androidScaleType: 'CENTER_CROP',
      iosSpinnerStyle: 'small',
      showSpinner: false,
      backgroundColor: '#0a0a0a',
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
