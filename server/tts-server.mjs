/**
 * Optional local neural-voice server for the narrated mini-lessons.
 *
 * It proxies Microsoft Edge's online "Neural" text-to-speech voices, which
 * sound genuinely human - and it's completely free, with no API key.
 *
 * Run it alongside the app:
 *     npm run tts        (this server, on http://localhost:5174)
 *     npm run dev        (the web app)
 *
 * The front-end auto-detects this server (see src/lib/tts.ts). If it isn't
 * running, the app falls back to the no-setup online voice automatically, so
 * this is purely an upgrade - nothing breaks when it's off.
 */
import http from "node:http";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const PORT = Number(process.env.TTS_PORT || 5174);
const DEFAULT_VOICE = process.env.TTS_VOICE || "en-US-AriaNeural";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Lightweight probe endpoint the web app pings to detect availability.
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, voice: DEFAULT_VOICE }));
    return;
  }

  if (url.pathname !== "/tts") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const text = (url.searchParams.get("text") || "").slice(0, 800);
  const voice = url.searchParams.get("voice") || DEFAULT_VOICE;
  if (!text.trim()) {
    res.writeHead(400);
    res.end("missing text");
    return;
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text);

    res.writeHead(200, { "Content-Type": "audio/mpeg" });
    audioStream.on("data", (chunk) => res.write(chunk));
    audioStream.on("end", () => res.end());
    audioStream.on("close", () => res.end());
    audioStream.on("error", () => {
      if (!res.writableEnded) res.end();
    });
  } catch (err) {
    console.error("[tts] synthesis failed:", err?.message || err);
    if (!res.headersSent) res.writeHead(500);
    res.end("tts failed");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Neural voice server ready on http://localhost:${PORT}`);
  console.log(`  Default voice: ${DEFAULT_VOICE}`);
  console.log(`  Leave this running, then start the app with: npm run dev\n`);
});
