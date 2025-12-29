import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCbRHu9a4N_i2WEFC8nVvR9GFFAxtB4EMk",
  authDomain: "restored-os-whip-montez.firebaseapp.com",
  projectId: "restored-os-whip-montez",
  storageBucket: "restored-os-whip-montez.firebasestorage.app",
  messagingSenderId: "214496108632",
  appId: "1:214496108632:web:1f85337eea3a73a4266a2d",
  measurementId: "G-B7RW2FK096"
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

export { app, auth, db, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged };
