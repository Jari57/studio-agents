/**
 * Native platform detection and Capacitor bridge utilities.
 * Used to detect iOS native context and route payments to StoreKit instead of Stripe.
 */

let _capacitor = null;
let _isNative = false;
let _platform = 'web';

try {
  // Capacitor is injected globally in native builds
  if (typeof window !== 'undefined' && window.Capacitor) {
    _capacitor = window.Capacitor;
    _isNative = _capacitor.isNativePlatform();
    _platform = _capacitor.getPlatform(); // 'ios', 'android', or 'web'
  }
} catch (_e) {
  // Not in a Capacitor context — running as a regular web app
}

/** True when running inside a Capacitor native shell (iOS or Android) */
export const isNative = _isNative;

/** 'ios' | 'android' | 'web' */
export const platform = _platform;

/** True only when running as native iOS app (for StoreKit routing) */
export const isIOS = _platform === 'ios';

/** True only when running as native Android app */
export const isAndroid = _platform === 'android';

/**
 * Check if we should use Apple In-App Purchase instead of Stripe.
 * Apple requires all digital purchases in iOS apps to use StoreKit.
 */
export const shouldUseAppleIAP = () => isIOS && _isNative;
