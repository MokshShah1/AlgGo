/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // Set to "true" to use the local Firebase emulators in development.
  readonly VITE_USE_FIREBASE_EMULATORS?: string;

  // Optional text-to-speech configuration for the narrated mini-lessons.
  // Defaults to "auto": local neural server if running, else a no-key online voice.
  readonly VITE_TTS_PROVIDER?: string; // "auto" | "edge" | "streamelements" | "elevenlabs" | "openai"
  readonly VITE_TTS_VOICE?: string; // StreamElements voice, e.g. "Matthew", "Brian", "Joanna"
  readonly VITE_TTS_EDGE_URL?: string; // local neural server, default http://localhost:5174
  readonly VITE_TTS_EDGE_VOICE?: string; // e.g. "en-US-AriaNeural", "en-US-GuyNeural"
  readonly VITE_ELEVENLABS_API_KEY?: string;
  readonly VITE_ELEVENLABS_VOICE_ID?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_VOICE?: string;

  // AI tutor proxy URL (server/ai-server.mjs). Defaults to http://localhost:8787.
  readonly VITE_AI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
