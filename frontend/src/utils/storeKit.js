/**
 * StoreKit 2 integration for iOS In-App Purchases.
 * Routes through Capacitor's InAppPurchase plugin when running on iOS native.
 * Falls back gracefully to Stripe on web.
 */

import { shouldUseAppleIAP } from './nativePlatform';

// StoreKit product IDs — must match App Store Connect configuration
const PRODUCT_IDS = {
  creator: 'com.studioagents.app.creator.monthly',
  studio: 'com.studioagents.app.studio.monthly',
  lifetime: 'com.studioagents.app.lifetime',
  credits_50: 'com.studioagents.app.credits.50',
  credits_200: 'com.studioagents.app.credits.200',
  credits_500: 'com.studioagents.app.credits.500',
};

let _iapPlugin = null;

/**
 * Initialize the IAP plugin (call once on app startup when on iOS).
 */
export async function initStoreKit() {
  if (!shouldUseAppleIAP()) return false;

  try {
    const { InAppPurchase } = await import('@capacitor-community/in-app-purchases');
    _iapPlugin = InAppPurchase;
    await _iapPlugin.initialize();
    return true;
  } catch (err) {
    console.warn('[StoreKit] Failed to initialize:', err.message);
    return false;
  }
}

/**
 * Fetch available products from the App Store.
 */
export async function getProducts() {
  if (!_iapPlugin) return [];

  try {
    const { products } = await _iapPlugin.getProducts({
      productIds: Object.values(PRODUCT_IDS),
    });
    return products;
  } catch (err) {
    console.warn('[StoreKit] Failed to fetch products:', err.message);
    return [];
  }
}

/**
 * Purchase a subscription or one-time product via StoreKit.
 * @param {'creator'|'studio'|'lifetime'|'credits_50'|'credits_200'|'credits_500'} productKey
 * @param {string} userId — Firebase UID for server-side receipt validation
 * @returns {Promise<{success: boolean, transactionId?: string, error?: string}>}
 */
export async function purchaseProduct(productKey, userId) {
  if (!_iapPlugin) {
    return { success: false, error: 'StoreKit not initialized' };
  }

  const productId = PRODUCT_IDS[productKey];
  if (!productId) {
    return { success: false, error: `Unknown product: ${productKey}` };
  }

  try {
    const result = await _iapPlugin.purchaseProduct({
      productId,
      appAccountToken: userId, // Links Apple transaction to Firebase UID
    });

    if (result.transactionId) {
      // Validate receipt server-side to grant credits/subscription
      const validated = await validateReceipt(result.transactionId, userId);
      return validated;
    }

    return { success: false, error: 'Purchase cancelled' };
  } catch (err) {
    if (err.code === 'USER_CANCELLED') {
      return { success: false, error: 'Purchase cancelled' };
    }
    console.error('[StoreKit] Purchase failed:', err);
    return { success: false, error: err.message || 'Purchase failed' };
  }
}

/**
 * Server-side receipt validation — sends the transaction to our backend
 * which verifies with Apple's servers and grants credits/subscription.
 */
async function validateReceipt(transactionId, userId) {
  try {
    const { BACKEND_URL } = await import('../constants');
    const { auth } = await import('../firebase');

    const token = await auth.currentUser?.getIdToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    const response = await fetch(`${BACKEND_URL}/api/apple/validate-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionId, userId }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();
    if (response.ok && data.valid) {
      return { success: true, transactionId };
    }
    return { success: false, error: data.error || 'Validation failed' };
  } catch (err) {
    console.error('[StoreKit] Receipt validation failed:', err);
    return { success: false, error: 'Receipt validation failed' };
  }
}

/**
 * Restore previous purchases (required by Apple for subscription apps).
 */
export async function restorePurchases() {
  if (!_iapPlugin) return [];

  try {
    const { transactions } = await _iapPlugin.restorePurchases();
    return transactions || [];
  } catch (err) {
    console.warn('[StoreKit] Restore failed:', err.message);
    return [];
  }
}

export { PRODUCT_IDS };
