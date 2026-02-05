import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase client config — these values are public by design.
// Security comes from backend token verification + whitelist.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAIlkWSbXV9t0e82GbyGxIZCj6_xn27m1c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "epm-ai-demo-20260201.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "epm-ai-demo-20260201",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "epm-ai-demo-20260201.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "227069599503",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:227069599503:web:f73ca7154ee01c752a687a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
