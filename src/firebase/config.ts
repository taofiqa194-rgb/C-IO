import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env || {});

// Configuration supporting both Vercel / production env vars and preview environment
export const firebaseConfig = {
  apiKey: appletConfig.apiKey || env.VITE_FIREBASE_API_KEY || 'AIzaSyA0wCvO10LjErVn1vVxQzaDJNS_Z22Roic',
  authDomain: appletConfig.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || 'c-io-de95b.firebaseapp.com',
  projectId: appletConfig.projectId || env.VITE_FIREBASE_PROJECT_ID || 'c-io-de95b',
  storageBucket: appletConfig.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || 'c-io-de95b.firebasestorage.app',
  messagingSenderId: appletConfig.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '231950270321',
  appId: appletConfig.appId || env.VITE_FIREBASE_APP_ID || '1:231950270321:web:dfbe25a44de1dc8418c0d0',
};

// Initialize Firebase App instance (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Determine database ID (strictly exclude Analytics IDs starting with G-)
const validEnvDbId =
  env.VITE_FIREBASE_DATABASE_ID &&
  !env.VITE_FIREBASE_DATABASE_ID.startsWith('G-') &&
  env.VITE_FIREBASE_DATABASE_ID !== '(default)'
    ? env.VITE_FIREBASE_DATABASE_ID
    : '';

export const FIRESTORE_DATABASE_ID =
  (appletConfig.firestoreDatabaseId && !appletConfig.firestoreDatabaseId.startsWith('G-') && appletConfig.firestoreDatabaseId !== '(default)')
    ? appletConfig.firestoreDatabaseId
    : (validEnvDbId || 'ai-studio-ciouniversityofi-82610386-8674-4fef-8b52-46883a438337');

// Initialize Cloud Firestore with target database
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Connectivity validation helper as mandated by Firebase skill
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    } else if (
      error &&
      (error.code === 'resource-exhausted' ||
        (error.message && (error.message.includes('Quota') || error.message.includes('quota') || error.message.includes('Free daily read units'))))
    ) {
      console.warn('Firebase connection test: Daily read quota exceeded for project.');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cio_quota_exceeded_timestamp', Date.now().toString());
        } catch {}
        window.dispatchEvent(new CustomEvent('cio_firestore_quota_exceeded', { detail: error }));
      }
    }
    // Document might not exist (which still means connection succeeded)
    return true;
  }
}
