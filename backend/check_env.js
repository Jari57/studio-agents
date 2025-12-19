const path = require('path');

// Load .env from backend directory (same behavior as server.js)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const key = process.env.GEMINI_API_KEY;
const firebaseKey = process.env.FIREBASE_PRIVATE_KEY;

if (key) {
  console.log('OK: GEMINI_API_KEY is set. Length:', key.length, '(value hidden).');
} else {
  console.warn('WARNING: GEMINI_API_KEY not found in backend/.env or environment.');
  console.warn('Create backend/.env with: GEMINI_API_KEY=your_key (do NOT commit secrets).');
}

if (firebaseKey) {
  console.log('OK: FIREBASE_PRIVATE_KEY is set.');
} else {
  console.warn('WARNING: FIREBASE_PRIVATE_KEY not found in backend/.env.');
  console.warn('Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to backend/.env');
}

// Intentionally exit 0 so CI doesn't fail when secrets are absent.
process.exit(0);
