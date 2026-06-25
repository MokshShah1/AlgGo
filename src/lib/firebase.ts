import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseConfig } from "@/config/env";

// Opt-in: set VITE_USE_FIREBASE_EMULATORS=true to point the app at the local
// Firebase emulators (`npm run emulators`) during development.
const USE_EMULATORS =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

/**
 * Firebase is initialized lazily so that importing this module never crashes
 * when env vars are missing. The app gates rendering behind a setup screen,
 * and these getters are only called once configuration is known to be present.
 */

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

function ensureApp(): FirebaseApp {
  if (app) return app;

  const result = getFirebaseConfig();
  if (!result.ok) {
    throw new Error(
      `Firebase is not configured. Missing: ${result.missing.join(", ")}`
    );
  }

  app = getApps().length ? getApp() : initializeApp(result.config);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(ensureApp());
    if (USE_EMULATORS) {
      connectAuthEmulator(authInstance, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
    }
  }
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(ensureApp());
    if (USE_EMULATORS) {
      connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
    }
  }
  return dbInstance;
}

export const googleProvider = new GoogleAuthProvider();
