import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, ImageUp, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AiProblemRunner } from "@/features/ai/AiProblemRunner";
import { aiAvailable, aiVision, type AiGeneratedProblem } from "@/lib/ai";
import { AI_NAME } from "@/lib/aiPersona";

type Phase = "upload" | "solving";

/**
 * Downscale a photo to a max dimension and re-encode as JPEG so the upload stays
 * small and fast (phone photos are often 3-12 MB raw). Falls back to the raw data
 * URL if anything goes wrong.
 */
function downscaleImage(file: File, maxDim = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      if (!raw) {
        reject(new Error("empty image"));
        return;
      }
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(raw);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve(raw);
        }
      };
      img.onerror = () => resolve(raw);
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

export function SnapProblemPage() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readText, setReadText] = useState<string | null>(null);
  const [problem, setProblem] = useState<AiGeneratedProblem | null>(null);
  const [phase, setPhase] = useState<Phase>("upload");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    aiAvailable()
      .then((ok) => {
        if (active) setAvailable(ok);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const url = await downscaleImage(file);
      setDataUrl(url);
    } catch {
      setError("Couldn't read that image. Try a different photo.");
    }
  }

  async function readAndSolve() {
    if (!dataUrl) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiVision(dataUrl);
      if (result.error || !result.problem) {
        setError(
          result.error ||
            "I couldn't quite make out a problem in that photo. Try a clearer, well-lit shot."
        );
        return;
      }
      setReadText(result.readText ?? null);
      setProblem(result.problem);
      setPhase("solving");
    } catch {
      setError("Something went wrong reading the image. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetToUpload() {
    setPhase("upload");
    setProblem(null);
    setReadText(null);
    setDataUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function clearImage() {
    setDataUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-dvh bg-canvas pb-24 text-ink sm:pb-12">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-5 sm:px-6 md:max-w-2xl md:py-8">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-start gap-4"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-violet text-white shadow-pop">
            <Camera className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold md:text-3xl">Snap a problem</h1>
            <p className="mt-1 text-sm text-ink/70">
              Take a photo of any math problem and {AI_NAME} turns it into an
              interactive practice question — solve it right here.
            </p>
          </div>
        </motion.header>

        {available === false && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="card flex flex-col gap-1 border border-hint/40 bg-hint/10 p-4"
          >
            <p className="text-sm font-bold text-hint">{AI_NAME} is offline</p>
            <p className="text-xs text-ink/70">
              Start it locally by running{" "}
              <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[11px]">
                npm run ai
              </code>{" "}
              in your terminal, then reload this page to snap a problem.
            </p>
          </motion.section>
        )}

        {phase === "solving" && problem ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            {readText && (
              <section className="card flex flex-col gap-1 p-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Here&apos;s what I read
                </span>
                <p className="text-sm leading-snug text-ink/80">{readText}</p>
              </section>
            )}
            <AiProblemRunner problems={[problem]} onExit={resetToUpload} />
          </motion.div>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
            className="flex flex-col gap-4"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {dataUrl ? (
              <div className="card flex flex-col gap-4 p-4">
                <div className="relative overflow-hidden rounded-card border border-white/10 bg-surface-2">
                  <img
                    src={dataUrl}
                    alt="Your problem"
                    className="max-h-72 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    disabled={loading}
                    aria-label="Remove image"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-canvas/80 text-ink/70 backdrop-blur transition-colors hover:text-ink disabled:opacity-50"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={loading}
                    className="btn-ghost flex-1"
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={readAndSolve}
                    disabled={loading || available === false}
                    className="btn-primary flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Reading...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" aria-hidden="true" />
                        Read &amp; solve
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={available === false}
                className="card group flex flex-col items-center gap-3 border-2 border-dashed border-ink/15 p-8 text-center transition-colors hover:border-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent transition-transform group-hover:scale-105">
                  <ImageUp className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-ink">
                    Upload or take a photo
                  </span>
                  <span className="text-xs text-ink/60">
                    Tap to choose an image of a math problem (PNG, JPG)
                  </span>
                </span>
              </button>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 rounded-card border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink"
              >
                <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}
