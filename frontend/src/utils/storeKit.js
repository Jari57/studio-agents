/**
 * Native in-app purchase boundary.
 *
 * This module intentionally stays unavailable until the appropriate public
 * RevenueCat key and the server-side entitlement/webhook flow are configured.
 * A mobile release must never fall through to web card checkout, and it must
 * never ship with a placeholder credential that makes a purchase UI look live.
 */

import { isAndroid, isIOS, shouldUseNativeIAP } from './nativePlatform';

// Product identifiers must match App Store Connect / Play Console and RevenueCat.
// Keep this mapping in source because product IDs are public identifiers, not
// secrets. Do not enable billing until the matching RevenueCat entitlement and
// backend webhook are live.
const PRODUCT_IDS = {
  creator: 'com.studioagents.app.creator.monthly',
  studio: 'com.studioagents.app.studio.monthly',
  lifetime: 'com.studioagents.app.lifetime',
  credits_10: 'com.studioagents.app.credits.10',
  credits_50: 'com.studioagents.app.credits.50',
  credits_150: 'com.studioagents.app.credits.150',
  credits_200: 'com.studioagents.app.credits.200',
  credits_500: 'com.studioagents.app.credits.500',
};

const getRevenueCatApiKey = () => {
  if (isIOS) return import.meta.env.VITE_REVENUECAT_IOS_API_KEY?.trim() || '';
  if (isAndroid) return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY?.trim() || '';
  return '';
};

// Billing is an explicit release decision. The extra flag prevents a key added
// for local testing from accidentally activating storefront purchases before
// entitlement processing is verified.
const isBillingEnabled = () => import.meta.env.VITE_ENABLE_NATIVE_IAP === 'true';

let _purchases = null;

/** True only when this native build is intentionally configured for billing. */
export const isNativePurchaseConfigured = () => (
  shouldUseNativeIAP() && isBillingEnabled() && Boolean(getRevenueCatApiKey())
);

/**
 * Initialize RevenueCat once for a configured iOS or Android native build.
 * RevenueCat public SDK keys are injected at build time; never hard-code a key
 * or a fake value in the client.
 */
export async function initStoreKit() {
  if (!shouldUseNativeIAP()) return false;
  if (_purchases) return true;

  if (!isNativePurchaseConfigured()) {
    console.warn('[Purchases] Native billing is not configured for this build.');
    return false;
  }

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    await Purchases.configure({ apiKey: getRevenueCatApiKey() });
    _purchases = Purchases;
    return true;
  } catch (err) {
    console.warn('[Purchases] Failed to initialize:', err?.message || err);
    return false;
  }
}

/** Fetch currently available store products for the configured native build. */
export async function getProducts() {
  if (!await initStoreKit()) return [];

  try {
    const { products = [] } = await _purchases.getProducts({
      productIdentifiers: Object.values(PRODUCT_IDS),
    });
    return products;
  } catch (err) {
    console.warn('[Purchases] Failed to fetch products:', err?.message || err);
    return [];
  }
}

/**
 * Purchase a configured native store product.
 *
 * Entitlements must be granted by the verified RevenueCat webhook on the
 * backend, not by a client-controlled credit update. This helper reports a
 * completed platform purchase only; it does not make a balance claim.
 */
export async function purchaseProduct(productKey, userId) {
  const productId = PRODUCT_IDS[productKey];
  if (!productId) return { success: false, error: `Unknown product: ${productKey}` };

  if (!await initStoreKit()) {
    return {
      success: false,
      error: 'In-app purchases are not available in this build yet.',
    };
  }

  try {
    await _purchases.logIn({ appUserID: userId });
    const { products = [] } = await _purchases.getProducts({ productIdentifiers: [productId] });
    const product = products.find((item) => item.identifier === productId) || products[0];
    if (!product) {
      return { success: false, error: 'This product is not available in your store region.' };
    }

    const { customerInfo, productIdentifier } = await _purchases.purchaseStoreProduct({ product });
    return {
      success: true,
      productIdentifier,
      activeEntitlements: Object.keys(customerInfo?.entitlements?.active || {}),
    };
  } catch (err) {
    if (err?.code === 'PURCHASE_CANCELLED_ERROR' || err?.userCancelled) {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.warn('[Purchases] Purchase failed:', err?.message || err);
    return { success: false, error: err?.message || 'Purchase failed' };
  }
}

/** Restore native purchases; required for restored subscriptions and devices. */
export async function restorePurchases() {
  if (!await initStoreKit()) return [];

  try {
    const { customerInfo } = await _purchases.restorePurchases();
    return Object.keys(customerInfo?.entitlements?.active || {});
  } catch (err) {
    console.warn('[Purchases] Restore failed:', err?.message || err);
    return [];
  }
}

export { PRODUCT_IDS };
