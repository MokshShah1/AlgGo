/**
 * Pre-render every "teach me" narration line to an audio file, so the app plays
 * instant, real-voice clips instead of synthesizing in the browser at runtime.
 *
 * Run with:  npm run tts:build
 *
 * For each unique spoken line across all lessons it generates a Kokoro clip,
 * encodes it to a small mono MP3, and writes it to public/tts/<id>.mp3. A
 * manifest.json lists every baked id; the runtime (src/lib/tts.ts) checks it
 * and falls back to live synthesis for anything not found.
 *
 * Re-run this whenever lesson content or the narration script changes.
 */

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { KokoroTTS } from "kokoro-js";
import * as lame from "@breezystack/lamejs";

import { course } from "@/content/course";
import {
  buildScript,
  lineId,
  NARRATION_VOICE,
} from "@/features/lesson/narration";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "tts");
const MODEL_ID =
  process.env.VITE_TTS_KOKORO_MODEL || "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE = process.env.VITE_TTS_KOKORO_VOICE || NARRATION_VOICE;
const KBPS = 64; // mono speech; small files, still clear

/** Collect every unique spoken line across the whole course. */
function collectLines() {
  const map = new Map(); // id -> text
  for (const lesson of course.lessons) {
    for (const solvable of lesson.solvables) {
      for (const text of buildScript(lesson, solvable)) {
        const t = text.trim();
        if (!t) continue;
        map.set(lineId(t, VOICE), t);
      }
    }
  }
  return map;
}

function floatToInt16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeMp3(float32, sampleRate) {
  const encoder = new lame.Mp3Encoder(1, sampleRate, KBPS);
  const samples = floatToInt16(float32);
  const blockSize = 1152;
  const chunks = [];
  for (let i = 0; i < samples.length; i += blockSize) {
    const slice = samples.subarray(i, i + blockSize);
    const buf = encoder.encodeBuffer(slice);
    if (buf.length > 0) chunks.push(Buffer.from(buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

async function main() {
  const lines = collectLines();
  console.log(
    `Found ${lines.size} unique narration lines. Voice: ${VOICE}. Output: public/tts/`
  );
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Loading Kokoro model (first run downloads weights)…");
  const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: "q8",
    device: "cpu",
  });
  console.log("Model ready. Generating clips…");

  const ids = [];
  let done = 0;
  let generated = 0;
  for (const [id, text] of lines) {
    ids.push(id);
    done++;
    const file = join(OUT_DIR, `${id}.mp3`);
    if (existsSync(file)) continue; // incremental: skip already-baked clips

    const audio = await tts.generate(text, { voice: VOICE });
    const mp3 = encodeMp3(audio.audio, audio.sampling_rate);
    await writeFile(file, mp3);
    generated++;
    if (generated % 10 === 0 || done === lines.size) {
      console.log(`  ${done}/${lines.size} (${generated} new)`);
    }
  }

  ids.sort();
  await writeFile(
    join(OUT_DIR, "manifest.json"),
    JSON.stringify(ids, null, 0)
  );
  console.log(
    `Done. ${ids.length} clips in manifest (${generated} newly generated).`
  );
}

main().catch((err) => {
  console.error("build-tts failed:", err);
  process.exit(1);
});
