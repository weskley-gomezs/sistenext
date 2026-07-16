import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3mjERkgW_aAyAny_hfESGl6DlivVC8gc",
  authDomain: "gen-lang-client-0055764381.firebaseapp.com",
  projectId: "gen-lang-client-0055764381",
  storageBucket: "gen-lang-client-0055764381.firebasestorage.app",
  messagingSenderId: "963456290796",
  appId: "1:963456290796:web:55867b22f11d2ad646bac9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with persistent local cache for superior offline resilience
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, "ai-studio-69c00000-1f90-47ec-b89a-a6776d85b929");

export default app;
