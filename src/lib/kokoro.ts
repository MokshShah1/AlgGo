/**
 * Kokoro-82M — high-quality neural text-to-speech that runs entirely in the
 * browser (no API key, no server, free).
 *
 * We default to the quantized `q8` weights on the WASM backend: it's the most
 * compatible combo (works without WebGPU), the smallest one-time download
 * (~86MB, then cached by the browser across sessions), and avoids silent
 * WebGPU init failures. For short "teach me" sentences it's plenty fast.
 *
 * Override via env if you have a strong GPU and want max quality:
 *   VITE_TTS_KOKORO_DEVICE=webgpu  VITE_TTS_KOKORO_DTYPE=fp32
 *
 * Strategy:
 *   - `preloadKokoro()` starts the download in the background when a lesson
 *     opens, so the model is usually ready by the time "teach me" is tapped.
 *   - `ensureKokoro()` awaits that load on demand, so the first narration
 *     actually uses the HD voice (the VideoLesson shows a buffering state)
 *     instead of falling back. Subsequent calls are instant.
 */

import type { KokoroTTS } from "kokoro-js";

const env = import.meta.env;

const MODEL_ID =
  env.VITE_TTS_KOKORO_MODEL || "onnx-community/Kokoro-82M-v1.0-ONNX";

// Flagship warm female voice. Override with VITE_TTS_KOKORO_VOICE.
// Good alternates: "am_michael"/"am_adam" (male), "bf_emma" (British female).
export const KOKORO_VOICE = env.VITE_TTS_KOKORO_VOICE || "af_heart";

const DEVICE = (env.VITE_TTS_KOKORO_DEVICE || "wasm") as
  | "wasm"
  | "webgpu"
  | "cpu";
const DTYPE = (env.VITE_TTS_KOKORO_DTYPE || "q8") as
  | "fp32"
  | "fp16"
  | "q8"
  | "q4"
  | "q4f16";

// Allow disabling entirely with VITE_TTS_KOKORO=off (forces online voice).
const DISABLED = String(env.VITE_TTS_KOKORO || "").toLowerCase() === "off";

let supportFlag: boolean | null = null;
let loadPromise: Promise<KokoroTTS | null> | null = null;
let model: KokoroTTS | null = null;

/** Whether this browser can run the model at all. */
export function kokoroSupported(): boolean {
  if (supportFlag !== null) return supportFlag;
  supportFlag =
    !DISABLED &&
    typeof navigator !== "undefined" &&
    typeof WebAssembly !== "undefined";
  return supportFlag;
}

/** True once the model is downloaded and ready to synthesize instantly. */
export function kokoroReady(): boolean {
  return model !== null;
}

/** Start loading in the background (fire-and-forget). */
export function preloadKokoro(): void {
  void ensureKokoro();
}

/**
 * Ensure the model is loaded, awaiting the (one-time) download if needed.
 * Resolves to true once Kokoro is usable, false if unsupported / failed.
 * Never throws.
 */
export function ensureKokoro(): Promise<boolean> {
  if (model) return Promise.resolve(true);
  if (!kokoroSupported()) return Promise.resolve(false);
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        console.info("[kokoro] loading model…", { device: DEVICE, dtype: DTYPE });
        const { KokoroTTS } = await import("kokoro-js");
        let lastPct = -1;
        const m = await KokoroTTS.from_pretrained(MODEL_ID, {
          dtype: DTYPE,
          device: DEVICE,
          progress_callback: ((p: {
            status?: string;
            progress?: number;
          }) => {
            if (p?.status === "progress" && typeof p.progress === "number") {
              const pct = Math.floor(p.progress / 10) * 10;
              if (pct !== lastPct) {
                lastPct = pct;
                console.info(`[kokoro] downloading… ${pct}%`);
              }
            }
          }) as never,
        });
        model = m;
        console.info("[kokoro] ready ✓ — voice:", KOKORO_VOICE);
        return m;
      } catch (err) {
        console.warn("[kokoro] load failed, using online voice instead", err);
        supportFlag = false;
        return null;
      }
    })();
  }
  return loadPromise.then((m) => m !== null);
}

type KokoroVoice = NonNullable<Parameters<KokoroTTS["generate"]>[1]>["voice"];

/**
 * Synthesize `text` with Kokoro and return an object URL (WAV). Call only after
 * `ensureKokoro()` resolves true. Throws if generation fails.
 */
export async function kokoroSource(text: string): Promise<string> {
  if (!model) throw new Error("kokoro not ready");
  const audio = await model.generate(text.slice(0, 1000), {
    voice: KOKORO_VOICE as KokoroVoice,
  });
  return URL.createObjectURL(audio.toBlob());
}
