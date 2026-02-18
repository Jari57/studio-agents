import { initializeApp } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  getIdToken,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  arrayUnion,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAKWKmHVfwKHuH_Huf4C2XcMAxk3pkkuz8",
  authDomain: "studioagents-app.firebaseapp.com",
  projectId: "studioagents-app",
  storageBucket: "studioagents-app.firebasestorage.app",
  messagingSenderId: "460525904786",
  appId: "1:460525904786:web:6c59dbc6837ead2ed9d74b",
  measurementId: "G-37J2MVHXS7"
};

let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Explicitly set local persistence so auth survives page refresh and browser restart
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Auth persistence setup failed:', err.message);
  });

  db = getFirestore(app);
  storage = getStorage(app);
  
  // Enable offline persistence for Firestore (improves UX on flaky connections)
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // Browser doesn't support persistence
      console.warn('Firestore persistence not supported in this browser');
    }
  });
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// =============================================================================
// STORAGE HELPERS - Upload/download media files
// =============================================================================

/**
 * Upload a file to Firebase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} userId - User ID for path
 * @param {string} folder - Folder name (e.g., 'audio', 'images', 'video')
 * @param {string} filename - Optional custom filename
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadFile(file, userId, folder = 'assets', filename = null) {
  if (!storage || !userId) {
    throw new Error('Storage not initialized or user not authenticated');
  }
  
  const ext = file.name?.split('.').pop() || 'bin';
  const name = filename || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const path = `users/${userId}/${folder}/${name}`;
  const storageRef = ref(storage, path);
  
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  
  console.log('📤 File uploaded:', path);
  return { url, path };
}

/**
 * Upload a base64 string to Firebase Storage
 * @param {string} base64Data - Base64 encoded data (with or without data URL prefix)
 * @param {string} userId - User ID for path
 * @param {string} folder - Folder name
 * @param {string} contentType - MIME type (e.g., 'image/png', 'audio/mp3')
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadBase64(base64Data, userId, folder = 'assets', contentType = 'application/octet-stream') {
  if (!storage || !userId) {
    throw new Error('Storage not initialized or user not authenticated');
  }
  
  const ext = contentType.split('/')[1] || 'bin';
  const name = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
  const path = `users/${userId}/${folder}/${name}`;
  const storageRef = ref(storage, path);
  
  // Handle both raw base64 and data URL format
  const dataUrl = base64Data.startsWith('data:') ? base64Data : `data:${contentType};base64,${base64Data}`;
  
  const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
  const url = await getDownloadURL(snapshot.ref);
  
  console.log('📤 Base64 uploaded:', path);
  return { url, path };
}

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Full storage path
 */
export async function deleteFile(path) {
  if (!storage || !path) return;
  
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('🗑️ File deleted:', path);
  } catch (err) {
    console.warn('Failed to delete file:', path, err.message);
  }
}

export {
  app,
  auth,
  db,
  storage,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  getIdToken,
  fetchSignInMethodsForEmail,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  ref,
  getDownloadURL
};
