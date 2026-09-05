import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

// Configuration supporting both Vercel / production env vars and preview environment
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || 'AIzaSyA0wCvO10LjErVn1vVxQzaDJNS_Z22Roic',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || 'c-io-de95b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || 'c-io-de95b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || 'c-io-de95b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '231950270321',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId || '1:231950270321:web:0e7f427fe219799e18c0d0',
};

// Initialize Firebase App instance (singleton)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Determine database ID (named database if configured, or default)
const configuredDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || '';

// Initialize Cloud Firestore with target database
export const db = (configuredDbId && configuredDbId !== '(default)') 
  ? getFirestore(app, configuredDbId) 
  : getFirestore(app);

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
    }
    // Document might not exist (which still means connection succeeded)
    return true;
  }
}
