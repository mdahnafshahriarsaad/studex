import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// =============================================================
// FIREBASE CONFIGURATION
// =============================================================
// REPLACE the values below with your actual Firebase project config.
// Get yours at: https://console.firebase.google.com
//   → Project Settings → General → Your apps → Web app → Config
//
// You MUST also enable in Firebase Console:
//   1. Authentication → Sign-in method → Email/Password → ON
//   2. Authentication → Templates → Edit verification email (optional)
// =============================================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Validate that config has been replaced
const isConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

if (!isConfigured) {
  console.error(
    '╔══════════════════════════════════════════════════════════╗\n' +
    '║  FIREBASE NOT CONFIGURED                                ║\n' +
    '║                                                          ║\n' +
    '║  Authentication will NOT work until you:                 ║\n' +
    '║  1. Create a Firebase project at                         ║\n' +
    '║     https://console.firebase.google.com                 ║\n' +
    '║  2. Enable Email/Password auth                            ║\n' +
    '║  3. Add a Web app and copy the config                     ║\n' +
    '║  4. Set env vars in Vercel or create .env.local locally  ║\n' +
    '║     VITE_FIREBASE_API_KEY=...                             ║\n' +
    '║     VITE_FIREBASE_AUTH_DOMAIN=...                         ║\n' +
    '║     VITE_FIREBASE_PROJECT_ID=...                          ║\n' +
    '║     VITE_FIREBASE_STORAGE_BUCKET=...                      ║\n' +
    '║     VITE_FIREBASE_MESSAGING_SENDER_ID=...                 ║\n' +
    '║     VITE_FIREBASE_APP_ID=...                              ║\n' +
    '╚══════════════════════════════════════════════════════════╝'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { isConfigured };
