/**
 * Reads and validates the Firebase web configuration from Vite env vars.
 *
 * The app must never crash when configuration is missing. Instead, callers
 * use `getFirebaseConfig()` and render a setup screen when it returns an
 * error so the developer gets clear, actionable instructions.
 */

export const REQUIRED_FIREBASE_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export type FirebaseEnvVar = (typeof REQUIRED_FIREBASE_ENV_VARS)[number];

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type FirebaseConfigResult =
  | { ok: true; config: FirebaseConfig }
  | { ok: false; missing: FirebaseEnvVar[] };

function readVar(name: FirebaseEnvVar): string {
  const value = import.meta.env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Returns the validated Firebase config, or the list of missing env vars.
 */
export function getFirebaseConfig(): FirebaseConfigResult {
  const missing = REQUIRED_FIREBASE_ENV_VARS.filter((name) => !readVar(name));

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    config: {
      apiKey: readVar("VITE_FIREBASE_API_KEY"),
      authDomain: readVar("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: readVar("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: readVar("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: readVar("VITE_FIREBASE_MESSAGING_SENDER_ID"),
      appId: readVar("VITE_FIREBASE_APP_ID"),
    },
  };
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig().ok;
}
