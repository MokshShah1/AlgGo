/**
 * Online text-to-speech for the narrated mini-lessons.
 *
 * Goal: a natural, human-sounding voice. The resolution order (default "auto"):
 *
 *   1. Local neural server (Microsoft Edge "Neural" voices) - sounds genuinely
 *      human, free, no API key. Start it with `npm run tts`. Auto-detected.
 *   2. StreamElements (Amazon Polly) - no setup, decent quality, always on.
 *   3. (VideoLesson then falls back to the on-device browser voice if needed.)
 *
 * Premium providers are also supported via env vars:
 *   - ElevenLabs:  VITE_TTS_PROVIDER=elevenlabs  VITE_ELEVENLABS_API_KEY=...
 *   - OpenAI:      VITE_TTS_PROVIDER=openai       VITE_OPENAI_API_KEY=...
 */

import { ensureKokoro, kokoroSource } from "@/lib/kokoro";
import { lineId } from "@/features/lesson/narration";

const env = import.meta.env;

type Provider = "auto" | "edge" | "streamelements" | "elevenlabs" | "openai";

const PROVIDER = (env.VITE_TTS_PROVIDER as Provider) || "auto";

// Local neural server (see server/tts-server.mjs). Override the URL/voice if needed.
const EDGE_URL = (env.VITE_TTS_EDGE_URL || "http://localhost:5174").replace(/\/$/, "");
const EDGE_VOICE = env.VITE_TTS_EDGE_VOICE || "en-US-AriaNeural";

// A natural US Polly voice by default. Override with VITE_TTS_VOICE.
// Good options: "Matthew", "Joanna", "Brian" (UK), "Amy" (UK), "Salli".
const SE_VOICE = env.VITE_TTS_VOICE || "Matthew";

/** The online voice has no key requirement, so it's always available. */
export const onlineTtsAvailable = true;

export interface TtsSource {
  url: string;
  /** Object URLs must be revoked after use to avoid memory leaks. */
  revoke: boolean;
}

/**
 * Probe the local neural server once and cache the result, so we don't ping it
 * on every line. Returns false quickly if it isn't running.
 */
let edgeProbe: Promise<boolean> | null = null;
function edgeAvailable(): Promise<boolean> {
  if (edgeProbe) return edgeProbe;
  // The local server only exists in local dev; skip the probe in production
  // (and when explicitly pointed elsewhere) to avoid a needless delay.
  const isLocal =
    typeof window !== "undefined" &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  if (!isLocal && EDGE_URL.includes("localhost")) {
    edgeProbe = Promise.resolve(false);
    return edgeProbe;
  }
  edgeProbe = (async () => {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${EDGE_URL}/health`, { signal: controller.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  })();
  return edgeProbe;
}

function edgeSource(text: string): TtsSource {
  const t = text.slice(0, 800);
  // Streamed directly by the <audio> element; nothing to revoke.
  return {
    url: `${EDGE_URL}/tts?voice=${encodeURIComponent(EDGE_VOICE)}&text=${encodeURIComponent(t)}`,
    revoke: false,
  };
}

/**
 * Manifest of lines that were pre-rendered to audio files at build time
 * (see scripts/build-tts.mjs). Fetched once; missing/empty is fine.
 */
let manifestPromise: Promise<Set<string>> | null = null;
function loadPrebakedManifest(): Promise<Set<string>> {
  if (manifestPromise) return manifestPromise;
  manifestPromise = (async () => {
    try {
      const res = await fetch(`${env.BASE_URL}tts/manifest.json`, {
        cache: "force-cache",
      });
      if (!res.ok) return new Set<string>();
      const ids = (await res.json()) as string[];
      return new Set(ids);
    } catch {
      return new Set<string>();
    }
  })();
  return manifestPromise;
}

/** Produce a playable audio URL for the given text. Throws on failure. */
export async function getTtsSource(text: string): Promise<TtsSource> {
  const clean = text.trim();
  if (!clean) throw new Error("empty text");

  // Best path for everyone: a clip we baked at build time. Instant playback,
  // the real Kokoro voice, no model download, works on every device.
  try {
    const manifest = await loadPrebakedManifest();
    const id = lineId(clean);
    if (manifest.has(id)) {
      return { url: `${env.BASE_URL}tts/${id}.mp3`, revoke: false };
    }
  } catch {
    // fall through to live synthesis
  }

  switch (PROVIDER) {
    case "edge":
      return edgeSource(clean);
    case "elevenlabs":
      return { url: await elevenLabs(clean), revoke: true };
    case "openai":
      return { url: await openai(clean), revoke: true };
    case "streamelements":
      return { url: streamElements(clean), revoke: false };
    default: {
      // "auto" resolution order, best-available first:
      //   1. Kokoro (in-browser neural HD voice). We await its one-time load so
      //      the narration actually uses it (buffering UI covers the wait).
      //   2. Local neural server, if running in dev.
      //   3. The always-on online voice.
      if (await ensureKokoro()) {
        try {
          return { url: await kokoroSource(clean), revoke: true };
        } catch (e) {
          console.warn("[kokoro] generate failed, falling back", e);
        }
      }
      if (await edgeAvailable()) return edgeSource(clean);
      return { url: streamElements(clean), revoke: false };
    }
  }
}

/**
 * StreamElements proxies Amazon Polly and returns an MP3 over a plain GET,
 * so an <audio> element can stream it directly (no key, no CORS preflight).
 */
function streamElements(text: string): string {
  // The endpoint caps text length; keep each line well under the limit.
  const t = text.slice(0, 540);
  return `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(
    SE_VOICE
  )}&text=${encodeURIComponent(t)}`;
}

async function elevenLabs(text: string): Promise<string> {
  const key = env.VITE_ELEVENLABS_API_KEY;
  if (!key) throw new Error("missing ElevenLabs key");
  const voiceId = env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.85 },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs failed: ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

async function openai(text: string): Promise<string> {
  const key = env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error("missing OpenAI key");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: env.VITE_OPENAI_VOICE || "nova",
      input: text,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI failed: ${res.status}`);
  return URL.createObjectURL(await res.blob());
}
