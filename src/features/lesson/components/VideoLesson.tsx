import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GraphConfig, Lesson, Solvable } from "@/types/lesson";
import { CONCEPT_LABELS } from "@/types/concepts";
import { CoordinatePlane } from "@/components/graph/CoordinatePlane";
import { getVoices, pickVoice, speechSupported } from "@/lib/speech";
import { getTtsSource } from "@/lib/tts";
import { buildScript } from "@/features/lesson/narration";

interface VideoLessonProps {
  lesson: Lesson;
  solvable: Solvable;
  onClose: () => void;
}

type PlayState = "playing" | "paused" | "done";

/**
 * A narrated, animated mini-lesson that plays like a short video.
 *
 * The walkthrough is generated from the solvable's own authored content and
 * narrated with a natural online voice (see lib/tts.ts), with the device's
 * built-in voice as an offline fallback.
 */
export function VideoLesson({ lesson, solvable, onClose }: VideoLessonProps) {
  const lines = useMemo(() => buildScript(lesson, solvable), [lesson, solvable]);
  const graph = useMemo(() => getGraph(solvable), [solvable]);

  const [index, setIndex] = useState(0);
  const [state, setState] = useState<PlayState>("playing");
  const [buffering, setBuffering] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const cancelledRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const playRef = useRef<(i: number) => void>(() => {});

  // Monotonic token: every new line / replay / stop bumps it, so callbacks
  // from a superseded attempt (late audio events, network promises) are ignored.
  const tokenRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const cleanupAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
      audio.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stopAll = useCallback(() => {
    tokenRef.current += 1; // invalidate any pending callbacks
    clearTimer();
    cleanupAudio();
    if (speechSupported) window.speechSynthesis.cancel();
  }, []);

  // Device-voice fallback for a single line if the online voice fails.
  const fallbackSpeak = (text: string, i: number, token: number) => {
    if (cancelledRef.current || token !== tokenRef.current) return;
    setBuffering(false);
    if (speechSupported) {
      window.speechSynthesis.cancel(); // clear any stuck queue (avoids repeats)
      const u = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) u.voice = voiceRef.current;
      u.lang = voiceRef.current?.lang ?? "en-US";
      u.rate = 1;
      u.pitch = 1.02;
      u.onend = () => {
        if (!cancelledRef.current && token === tokenRef.current) {
          playRef.current(i + 1);
        }
      };
      window.speechSynthesis.speak(u);
    } else {
      const words = text.split(/\s+/).length;
      const dur = Math.min(7000, Math.max(2000, words * 340));
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (!cancelledRef.current && token === tokenRef.current) {
          playRef.current(i + 1);
        }
      }, dur);
    }
  };

  // Speak line i with the online voice, then continue to the next line.
  playRef.current = (i: number) => {
    if (cancelledRef.current) return;
    const ls = linesRef.current;
    if (i >= ls.length) {
      setState("done");
      stopAll();
      return;
    }
    // Starting a new line invalidates the previous attempt's callbacks.
    const myToken = (tokenRef.current += 1);
    setIndex(i);
    setBuffering(true);
    const text = ls[i];

    getTtsSource(text)
      .then((src) => {
        if (cancelledRef.current || myToken !== tokenRef.current) {
          if (src.revoke) URL.revokeObjectURL(src.url);
          return;
        }
        cleanupAudio();

        const audio = new Audio(src.url);
        audioRef.current = audio;
        if (src.revoke) objectUrlRef.current = src.url;

        // Exactly one of {ended, error, play-rejection} may act per line.
        let acted = false;
        const onDone = () => {
          if (acted || cancelledRef.current || myToken !== tokenRef.current) return;
          acted = true;
          playRef.current(i + 1);
        };
        const onFail = () => {
          if (acted || cancelledRef.current || myToken !== tokenRef.current) return;
          acted = true;
          fallbackSpeak(text, i, myToken);
        };

        audio.onplaying = () => {
          if (myToken === tokenRef.current) setBuffering(false);
        };
        audio.onended = onDone;
        audio.onerror = onFail;
        audio.play().catch(onFail);
      })
      .catch(() => fallbackSpeak(text, i, myToken));
  };

  // Load a fallback voice (voices populate asynchronously).
  useEffect(() => {
    if (!speechSupported) return;
    const load = () => {
      voiceRef.current = pickVoice(getVoices());
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (speechSupported) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Auto-start on open; fully stop on unmount.
  useEffect(() => {
    cancelledRef.current = false;
    const start = window.setTimeout(() => playRef.current(0), 200);
    return () => {
      cancelledRef.current = true;
      window.clearTimeout(start);
      stopAll();
    };
  }, [stopAll]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    if (speechSupported) window.speechSynthesis.pause();
    clearTimer();
    setState("paused");
  }, []);

  const handleResume = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.ended) audio.play().catch(() => {});
    if (speechSupported) window.speechSynthesis.resume();
    setState("playing");
  }, []);

  const handleReplay = useCallback(() => {
    cancelledRef.current = false;
    stopAll();
    setState("playing");
    setIndex(0);
    window.setTimeout(() => playRef.current(0), 120);
  }, [stopAll]);

  const talking = state === "playing" && !buffering;
  const progress = ((index + (state === "done" ? 1 : 0)) / lines.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-canvas/95 backdrop-blur">
      {/* Theater glows */}
      <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-24 h-56 w-56 rounded-full bg-violet/20 blur-3xl" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-4 pt-5">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wide text-accent">
            Mini lesson
          </span>
          <span className="text-sm font-semibold text-ink/80">{lesson.title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink/70 transition-colors hover:text-ink"
          aria-label="Close mini lesson"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 py-4">
        <TutorAvatar speaking={talking} buffering={buffering} />

        {graph ? (
          <div className="w-full max-w-sm animate-scale-in rounded-card border border-white/5 bg-surface p-3 shadow-card">
            <CoordinatePlane config={graph} />
          </div>
        ) : (
          <div className="flex w-full max-w-sm animate-scale-in flex-col gap-2 rounded-card border border-white/5 bg-surface p-6 shadow-card">
            <span className="text-xs font-bold uppercase tracking-wide text-accent">
              {CONCEPT_LABELS[solvable.concepts[0]] ?? "Key idea"}
            </span>
            <p className="text-lg font-semibold leading-snug text-ink">
              {solvable.prompt}
            </p>
          </div>
        )}
      </div>

      {/* Captions + controls */}
      <div className="relative border-t border-white/10 bg-surface/95 px-5 pb-6 pt-4 backdrop-blur">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <div className="min-h-[56px] rounded-card bg-surface-2 px-4 py-3 text-center text-base font-medium leading-snug text-ink">
            {lines[index]}
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/10">
            <div
              className="progress-fill h-full rounded-pill transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            {state === "done" ? (
              <button type="button" onClick={handleReplay} className="btn-ghost flex-1">
                Replay
              </button>
            ) : state === "paused" ? (
              <button type="button" onClick={handleResume} className="btn-primary flex-1">
                Resume
              </button>
            ) : (
              <button type="button" onClick={handlePause} className="btn-ghost flex-1">
                Pause
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-primary flex-1">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Friendly tutor with a human profile photo that reacts while narrating. */
function TutorAvatar({
  speaking,
  buffering,
}: {
  speaking: boolean;
  buffering: boolean;
}) {
  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      {speaking && (
        <>
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/30" />
          <span
            className="absolute inset-0 animate-pulse-ring rounded-full bg-violet/30"
            style={{ animationDelay: "0.6s" }}
          />
        </>
      )}
      <div
        className={`relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-accent to-violet shadow-pop ring-2 ring-white/20 transition-transform duration-300 ${
          speaking ? "scale-105" : "scale-100"
        }`}
      >
        <img
          src="/tutor.png"
          alt="Your tutor"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Talking indicator: animated sound bars while the voice is playing. */}
      {speaking && (
        <span className="absolute -bottom-1 flex items-end gap-0.5 rounded-pill bg-surface px-2 py-1 shadow-soft">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-1 origin-bottom animate-soundbar rounded-full bg-accent"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      )}

      {buffering && (
        <span className="absolute -bottom-1 flex items-center gap-1 rounded-pill bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink/60">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          loading voice
        </span>
      )}
    </div>
  );
}

/** Make a read-only, illustrative graph config from a solvable (if any). */
function getGraph(solvable: Solvable): GraphConfig | undefined {
  const g = "graph" in solvable && solvable.graph ? solvable.graph : undefined;
  if (!g) return undefined;
  return {
    ...g,
    draggable: "none",
    showLine: true,
    showTriangle: true,
    showSlopeLabel: true,
  };
}
