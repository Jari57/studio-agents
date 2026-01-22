import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

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

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export { 
  app, 
  auth, 
  db, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  writeBatch
};
