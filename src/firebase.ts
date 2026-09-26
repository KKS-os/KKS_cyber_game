import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore targeting the provisioned custom database ID
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Keep track of current authenticated user
let currentUser: User | null = null;
let authPromise: Promise<User> | null = null;

export const ensureAuth = (): Promise<User> => {
  if (currentUser) {
    return Promise.resolve(currentUser);
  }
  if (authPromise) {
    return authPromise;
  }

  authPromise = new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          currentUser = user;
          unsubscribe();
          resolve(user);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            currentUser = userCredential.user;
            unsubscribe();
            resolve(userCredential.user);
          } catch (err) {
            console.warn('[Firebase Auth] Anonymous sign-in attempt:', err);
            // Fallback: continue as guest if offline
            unsubscribe();
            resolve({
              uid: 'guest-' + Math.random().toString(36).substring(2, 9),
            } as User);
          }
        }
      },
      (err) => {
        console.warn('[Firebase Auth] Observer error:', err);
        reject(err);
      }
    );
  });

  return authPromise;
};

// Immediate background authentication initiation
ensureAuth().catch((err) => {
  console.warn('[Firebase Auth] Immediate init notice:', err);
});

// Validate Connection to Firestore on startup per SKILL.md guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'multiplayer_rooms', '__test_ping__'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or checking connection.');
    }
    return false;
  }
}

// Background validation run
testFirestoreConnection().catch(() => {});
