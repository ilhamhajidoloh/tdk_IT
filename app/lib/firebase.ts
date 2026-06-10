import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const hasFirebaseClientCreds = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = (getApps().length === 0 && hasFirebaseClientCreds)
  ? initializeApp(firebaseConfig)
  : (getApps()[0] || null);

export const auth = app ? getAuth(app) : null as any;

