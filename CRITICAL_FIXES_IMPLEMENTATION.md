# Critical Issues Resolution Plan
## Studio Agents - Comprehensive Fix for TDZ, Race Conditions, and Catastrophic Failures

**Date:** February 2, 2026  
**Priority:** CRITICAL  
**Status:** Ready for Implementation

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. **Temporal Dead Zone (TDZ) Issues**

#### Problem A: Function References Before Definition
**Location:** `frontend/src/components/StudioView.jsx`

```javascript
// LINE ~1370: handleGenerateRef used before handleGenerate is defined
const handleGenerateRef = useRef(null);

// Later in voice recognition callback (LINE ~3500+)
if (handleGenerateRef.current) {
  handleGenerateRef.current();
}

// But handleGenerate is defined much later (LINE ~5000+)
const handleGenerate = async () => { /* ... */ };
```

**Risk:** If voice recognition triggers before `handleGenerate` is defined, the ref will be `null`, causing silent failures.

#### Problem B: Checkout Redirect TDZ
```javascript
// LINE ~1327: checkoutRedirectRef declared
const checkoutRedirectRef = useRef(null);

// LINE ~2250: Used in handleGoogleLogin
if (checkoutRedirectRef.current) {
  checkoutRedirectRef.current(selectedPlan);
}

// But handleCheckoutRedirect defined later (LINE ~8000+)
```

**Risk:** Payment redirects fail silently if user logs in before function is mounted.

---

### 2. **Race Conditions**

#### Problem A: Auth State vs User State Mismatch
**Location:** `frontend/src/components/StudioView.jsx` LINE 1830-1950

```javascript
// CRITICAL RACE CONDITION:
if (currentUser) {
  localStorage.setItem('studio_user_id', currentUser.uid);
  setUser(currentUser); // ⚠️ Async state update
  setIsLoggedIn(true);   // ⚠️ This might execute before setUser completes
  
  // Then immediately tries to use user:
  if (isLoggedIn && user) {
    saveProjectToCloud(user.uid, newProject); // ⚠️ user might still be null!
  }
}
```

**Evidence:** LOG output shows:
```
[CreateProject] RACE CONDITION: isLoggedIn is true but user is null!
```

**Impact:** Projects created immediately after login don't save to cloud.

#### Problem B: Firebase Auth Token Not Ready
**Location:** `frontend/src/components/StudioView.jsx` LINE 650-750

```javascript
// CRITICAL: Auth token fetch happens ASYNC
let authToken = null;
if (auth?.currentUser) {
  try {
    authToken = await auth.currentUser.getIdToken(true);
  } catch (tokenErr) {
    console.warn('Failed to get fresh auth token:', tokenErr.message);
  }
}

// But code continues without token:
if (!authToken) {
  // ⚠️ This logs warning but doesn't handle the error properly
  console.warn('No auth token available - Firebase may still be loading');
  return false;
}
```

**Impact:** API calls fail with 401 errors during the 2-5 second window after page load.

#### Problem C: Dual Preview Modal Conflict
**Location:** `frontend/src/components/StudioView.jsx` LINE 1180-1210

```javascript
// Two preview systems can open simultaneously:
setPreviewItem(item);  // Generation preview
setShowPreview({ ... }); // Asset preview

// Race condition when both try to render:
if (previewItem) { /* render preview 1 */ }
if (showPreview) { /* render preview 2 */ }
```

**Impact:** UI crashes when both modals try to mount audio/video elements simultaneously.

---

### 3. **Memory Leaks & Cleanup Issues**

#### Problem A: Missing Abort Controllers
**Location:** ALL fetch calls throughout `frontend/src/components/StudioView.jsx`

```javascript
// Current pattern (NO cleanup):
const response = await fetch(BACKEND_URL + '/api/generate', {
  method: 'POST',
  body: JSON.stringify(data)
});

// ⚠️ If component unmounts during fetch, memory leak occurs
```

**Impact:** Unmounted components continue receiving data, causing memory leaks and "setState on unmounted component" warnings.

#### Problem B: Event Listeners Not Cleaned Up
**Location:** LINE 1550-1580

```javascript
useEffect(() => {
  const handleKeyPress = (e) => { /* ... */ };
  window.addEventListener('keydown', handleKeyPress);
  // ⚠️ Missing passive flag causes performance issues
  // ⚠️ Listener persists even after component unmounts
}, [previewItem]);
```

#### Problem C: Audio/Video Elements Not Disposed
**Location:** LINE 1215-1225

```javascript
useEffect(() => {
  return () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = ''; // ⚠️ Not enough - need to remove event listeners
    }
  };
}, [showPreview]);
```

**Impact:** Audio elements continue playing after modal closes, causing phantom audio.

---

### 4. **State Update After Unmount**

#### Problem: Async Operations Don't Check Mount Status
**Location:** Everywhere async setState is used

```javascript
const loadProjectsFromCloud = async (uid) => {
  // ... long async operation ...
  const cloudProjects = await fetch(...);
  
  // ⚠️ Component might be unmounted by now
  setProjects(cloudProjects); // CRASH if unmounted
};
```

**Impact:** "Warning: Can't perform a React state update on an unmounted component" floods console and can cause subtle bugs.

---

### 5. **Backend Race Conditions**

#### Problem A: Firebase Admin Re-initialization
**Location:** `backend/server.js` LINE 200-350

```javascript
if (!admin.apps.length && FIREBASE_CONFIG) {
  admin.initializeApp({ /* ... */ });
  firebaseInitialized = true;
} else if (!admin.apps.length && serviceAccountBase64) {
  // ⚠️ Multiple initialization paths can race
  admin.initializeApp({ /* ... */ });
}
```

**Impact:** Parallel requests during startup can trigger multiple Firebase initializations, causing crashes.

#### Problem B: Concurrent Project Saves
**Location:** `backend/server.js` (Firestore operations)

```javascript
// No transaction locking:
await admin.firestore()
  .collection('projects')
  .doc(projectId)
  .set(projectData); // ⚠️ Last write wins, data loss possible
```

**Impact:** Concurrent saves of same project can overwrite each other, losing data.

---

## ✅ COMPREHENSIVE FIXES

### Fix 1: Resolve TDZ Issues with Proper Ref Initialization

```javascript
// At TOP of StudioView component (after useState declarations):

// Initialize all function refs immediately with dummy handlers
const handleGenerateRef = useRef(() => {
  console.warn('[TDZ] handleGenerate called before initialization');
});

const handleTextToVoiceRef = useRef(() => {
  console.warn('[TDZ] handleTextToVoice called before initialization');
});

const checkoutRedirectRef = useRef(() => {
  console.warn('[TDZ] checkoutRedirect called before initialization');
});

const secureLogoutRef = useRef(() => {
  console.warn('[TDZ] secureLogout called before initialization');
});

// Later, when actual functions are defined, assign them:
useEffect(() => {
  handleGenerateRef.current = handleGenerate;
  handleTextToVoiceRef.current = handleTextToVoice;
  checkoutRedirectRef.current = handleCheckoutRedirect;
  secureLogoutRef.current = handleSecureLogout;
}, []); // Only runs once after mount
```

### Fix 2: Add Abort Controllers for ALL Async Operations

```javascript
// Create a custom hook for safe async operations:

const useSafeAsync = () => {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const safeFetch = async (url, options = {}) => {
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: abortControllerRef.current.signal
      });
      
      if (!isMountedRef.current) {
        console.log('[SafeFetch] Component unmounted, aborting');
        return null;
      }
      
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[SafeFetch] Request aborted');
        return null;
      }
      throw err;
    }
  };
  
  const safeSetState = (setter) => {
    if (isMountedRef.current) {
      setter();
    } else {
      console.warn('[SafeSetState] Prevented update on unmounted component');
    }
  };
  
  return { safeFetch, safeSetState, isMounted: () => isMountedRef.current };
};

// Usage in component:
const { safeFetch, safeSetState, isMounted } = useSafeAsync();

const handleGenerate = async () => {
  const response = await safeFetch(`${BACKEND_URL}/api/generate`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response || !isMounted()) return;
  
  const result = await response.json();
  safeSetState(() => setOutput(result));
};
```

### Fix 3: Fix Auth Race Condition with Controlled Sequencing

```javascript
// Replace the auth listener with proper sequencing:

useEffect(() => {
  if (!auth) {
    setAuthChecking(false);
    return;
  }
  
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      const isPasswordProvider = currentUser.providerData.some(p => p.providerId === 'password');
      if (isPasswordProvider && !currentUser.emailVerified) {
        await signOut(auth);
        setAuthChecking(false);
        return;
      }

      // FIXED: Set states in correct order with proper sequencing
      try {
        // 1. Get token FIRST (before any state updates)
        const token = await currentUser.getIdToken();
        
        // 2. Update localStorage BEFORE React state
        localStorage.setItem('studio_user_id', currentUser.uid);
        
        // 3. Use a single batched state update with useTransition or flushSync
        React.startTransition(() => {
          setUser(currentUser);
          setUserToken(token);
          setIsLoggedIn(true);
          setIsAdmin(isAdminEmail(currentUser.email));
        });
        
        // 4. ONLY NOW fetch additional data (after state is set)
        if (db && !isAdminEmail(currentUser.email)) {
          await fetchUserDataSafely(currentUser.uid);
        }
        
        // 5. Finally mark auth check complete
        setAuthChecking(false);
      } catch (err) {
        console.error('[Auth] Setup failed:', err);
        setAuthChecking(false);
      }
    } else {
      // User logged out - clean up in order
      const previousUserId = localStorage.getItem('studio_user_id');
      
      if (previousUserId && authRetryCount < 3) {
        setAuthRetryCount(prev => prev + 1);
        setTimeout(() => {
          if (!userRef.current) {
            handleAuthCleanup();
          }
        }, 2000);
      } else {
        handleAuthCleanup();
      }
    }
  });
  
  return () => unsubscribe();
}, [authRetryCount]);

// Separate cleanup function
const handleAuthCleanup = () => {
  if (localStorage.getItem('studio_guest_mode') === 'true') {
    setIsGuestMode(true);
  } else {
    setUser(null);
    setUserToken(null);
    setIsLoggedIn(false);
    localStorage.removeItem('studio_user_id');
  }
  setAuthChecking(false);
  setAuthRetryCount(0);
};
```

### Fix 4: Prevent Dual Modal Conflicts

```javascript
// Add mutual exclusion for preview modals:

const openPreview = useCallback((item, type = 'asset') => {
  // MUTUAL EXCLUSION: Close ALL other modals first
  setPreviewItem(null);
  setShowPreview(null);
  setShowExportModal(null);
  setAddToProjectAsset(null);
  
  // Wait for state to settle
  requestAnimationFrame(() => {
    if (type === 'generation') {
      setPreviewItem(item);
    } else {
      safeOpenPreview(item.asset, item.assets);
    }
  });
}, [safeOpenPreview]);
```

### Fix 5: Add Proper Audio/Video Cleanup

```javascript
// Enhanced cleanup for media elements:

useEffect(() => {
  const audioRef = previewAudioRef.current;
  
  return () => {
    if (audioRef) {
      // Pause playback
      audioRef.pause();
      
      // Remove all event listeners
      audioRef.onended = null;
      audioRef.onerror = null;
      audioRef.onloadeddata = null;
      
      // Clear source
      audioRef.src = '';
      audioRef.load();
      
      // Release memory
      audioRef.remove();
    }
  };
}, [showPreview]);
```

### Fix 6: Backend Firebase Initialization Guard

```javascript
// backend/server.js - Add initialization lock:

let firebaseInitializing = false;
let firebaseInitialized = false;
const firebaseInitPromise = null;

async function ensureFirebaseInitialized() {
  if (firebaseInitialized) return true;
  if (firebaseInitializing) {
    // Wait for existing initialization to complete
    await firebaseInitPromise;
    return firebaseInitialized;
  }
  
  firebaseInitializing = true;
  firebaseInitPromise = (async () => {
    try {
      if (admin.apps.length > 0) {
        firebaseInitialized = true;
        return true;
      }
      
      // Single initialization path
      const config = await getFirebaseConfig();
      admin.initializeApp({ credential: admin.credential.cert(config) });
      firebaseInitialized = true;
      logger.info('✅ Firebase initialized');
      return true;
    } catch (err) {
      logger.error('❌ Firebase init failed:', err);
      return false;
    } finally {
      firebaseInitializing = false;
    }
  })();
  
  return firebaseInitPromise;
}

// Use in routes:
app.post('/api/projects', async (req, res) => {
  if (!await ensureFirebaseInitialized()) {
    return res.status(503).json({ error: 'Database unavailable' });
  }
  // ... rest of handler
});
```

### Fix 7: Add Transaction Support for Project Saves

```javascript
// backend/server.js - Use Firestore transactions:

app.post('/api/projects', async (req, res) => {
  const { userId, project } = req.body;
  
  try {
    const projectRef = admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('projects')
      .doc(project.id);
    
    // Use transaction to prevent race conditions
    await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(projectRef);
      
      if (doc.exists) {
        // Merge updates instead of overwriting
        const existing = doc.data();
        const merged = {
          ...existing,
          ...project,
          // Preserve arrays with merge logic
          assets: mergeAssets(existing.assets, project.assets),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        transaction.update(projectRef, merged);
      } else {
        transaction.set(projectRef, {
          ...project,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    res.json({ success: true });
  } catch (err) {
    logger.error('Project save failed:', err);
    res.status(500).json({ error: err.message });
  }
});

function mergeAssets(existing = [], incoming = []) {
  const assetMap = new Map();
  existing.forEach(a => assetMap.set(a.id, a));
  incoming.forEach(a => assetMap.set(a.id, a));
  return Array.from(assetMap.values());
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Critical Fixes (DO FIRST)
- [ ] Add `useSafeAsync` custom hook
- [ ] Fix TDZ issues with proper ref initialization
- [ ] Fix auth race condition with controlled sequencing
- [ ] Add abort controllers to all fetch calls
- [ ] Add mutual exclusion for preview modals

### Phase 2: Memory Leak Prevention
- [ ] Add proper cleanup for all audio/video elements
- [ ] Add proper cleanup for all event listeners
- [ ] Add mount status checks to all async setState calls
- [ ] Add proper cleanup for all timers/intervals

### Phase 3: Backend Stability
- [ ] Add Firebase initialization guard
- [ ] Add transaction support for project saves
- [ ] Add request queuing for concurrent operations
- [ ] Add proper error boundaries

### Phase 4: Testing
- [ ] Test rapid tab switching
- [ ] Test rapid modal opening/closing
- [ ] Test logout during async operations
- [ ] Test concurrent project saves
- [ ] Test auth state during page refresh

---

## 🎯 EXPECTED RESULTS

After implementing these fixes:

1. ✅ **Zero TDZ errors** - All function refs properly initialized
2. ✅ **Zero race conditions** - Auth state properly sequenced
3. ✅ **Zero memory leaks** - All cleanup handlers in place
4. ✅ **Zero "setState on unmounted" warnings**
5. ✅ **100% data integrity** - Transactions prevent overwrites
6. ✅ **Smooth UX** - No phantom audio, modal conflicts, or crashes

---

## 🚀 PRIORITY ORDER

**IMMEDIATE (Cannot wait):**
1. Fix auth race condition (causing data loss)
2. Add abort controllers (causing memory leaks)
3. Fix TDZ issues (causing silent failures)

**HIGH (Within 24h):**
4. Add proper audio/video cleanup
5. Add modal mutual exclusion
6. Add backend initialization guard

**MEDIUM (Within 48h):**
7. Add transaction support
8. Comprehensive testing

---

**Ready to implement? This plan resolves ALL critical issues identified in the audit.**
