/**
 * User Preferences & Contact Info Service
 * Stores user preferences in Firestore
 */

// User preferences schema
const defaultPreferences = {
  // Contact info
  contact: {
    email: '',
    phone: '',
    timezone: 'America/New_York',
    preferredContactMethod: 'email' // email, sms, push
  },
  
  // Notification preferences
  notifications: {
    emailOnLogin: true,
    emailOnProjectCreate: true,
    emailOnProjectDelete: true,
    emailOnGeneration: false,
    emailWeeklyDigest: true,
    emailProductUpdates: true,
    emailMarketingOffers: false,
    pushNotifications: true
  },
  
  // App preferences
  app: {
    theme: 'dark',
    language: 'en',
    voiceEnabled: true,
    autoPlayAudio: false,
    showTips: true,
    compactView: false
  },
  
  // Privacy settings
  privacy: {
    shareActivityPublicly: false,
    allowAnalytics: true,
    showOnlineStatus: true
  }
};

/**
 * Get user preferences from Firestore
 */
const getUserPreferences = async (admin, uid) => {
  if (!admin.apps.length || !uid) {
    return { ...defaultPreferences };
  }

  try {
    const db = admin.firestore();
    const prefsDoc = await db.collection('users').doc(uid).collection('settings').doc('preferences').get();
    
    if (prefsDoc.exists) {
      // Merge with defaults to ensure all fields exist
      return {
        ...defaultPreferences,
        ...prefsDoc.data(),
        contact: { ...defaultPreferences.contact, ...(prefsDoc.data().contact || {}) },
        notifications: { ...defaultPreferences.notifications, ...(prefsDoc.data().notifications || {}) },
        app: { ...defaultPreferences.app, ...(prefsDoc.data().app || {}) },
        privacy: { ...defaultPreferences.privacy, ...(prefsDoc.data().privacy || {}) }
      };
    }
    
    return { ...defaultPreferences };
  } catch (error) {
    console.error('[UserPrefs] Failed to get preferences:', error.message);
    return { ...defaultPreferences };
  }
};

/**
 * Save user preferences to Firestore
 */
const saveUserPreferences = async (admin, uid, preferences) => {
  if (!admin.apps.length || !uid) {
    throw new Error('Firebase not initialized or missing user ID');
  }

  try {
    const db = admin.firestore();
    const prefsRef = db.collection('users').doc(uid).collection('settings').doc('preferences');
    
    await prefsRef.set({
      ...preferences,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`[UserPrefs] ✅ Saved preferences for user ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('[UserPrefs] Failed to save preferences:', error.message);
    throw error;
  }
};

/**
 * Get contact info for a user
 */
const getUserContactInfo = async (admin, uid) => {
  const prefs = await getUserPreferences(admin, uid);
  return prefs.contact;
};

/**
 * Update contact info for a user
 */
const updateUserContactInfo = async (admin, uid, contactInfo) => {
  if (!admin.apps.length || !uid) {
    throw new Error('Firebase not initialized or missing user ID');
  }

  try {
    const db = admin.firestore();
    const prefsRef = db.collection('users').doc(uid).collection('settings').doc('preferences');
    
    await prefsRef.set({
      contact: contactInfo,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`[UserPrefs] ✅ Updated contact info for user ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('[UserPrefs] Failed to update contact info:', error.message);
    throw error;
  }
};

/**
 * Check if user wants a specific notification type
 */
const shouldNotify = async (admin, uid, notificationType) => {
  try {
    const prefs = await getUserPreferences(admin, uid);
    return prefs.notifications[notificationType] ?? true;
  } catch (_error) {
    console.warn('[UserPrefs] Error checking notification preference, defaulting to true');
    return true;
  }
};

module.exports = {
  defaultPreferences,
  getUserPreferences,
  saveUserPreferences,
  getUserContactInfo,
  updateUserContactInfo,
  shouldNotify
};
