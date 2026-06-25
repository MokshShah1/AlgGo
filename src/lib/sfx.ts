/**
 * Tiny, dependency-free sound effects + haptics.
 *
 * Sounds are synthesized on the fly with the Web Audio API (no audio files to
 * download), and everything respects a persisted on/off preference. Haptics
 * use the Vibration API where available (mostly Android).
 */

const SOUND_KEY = "bs.sound";

export function isSoundEnabled(): boolean {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "off";
}

/** Observers notified whenever the sound preference changes. */
const soundSubscribers = new Set<(enabled: boolean) => void>();

/**
 * Subscribe to sound-preference changes (e.g. so a cross-device sync component
 * can persist the new value). Returns an unsubscribe function.
 */
export function subscribeSound(cb: (enabled: boolean) => void): () => void {
  soundSubscribers.add(cb);
  return () => {
    soundSubscribers.delete(cb);
  };
}

export function setSoundEnabled(on: boolean): void {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* ignore storage failures */
  }
  // Notify observers after persisting so reads inside callbacks are fresh.
  soundSubscribers.forEach((cb) => {
    try {
      cb(on);
    } catch {
      /* a misbehaving subscriber must not break the others */
    }
  });
}

let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // Browsers start the context suspended until a user gesture.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Play a short tone. `type` shapes the timbre. */
function tone(
  freq: number,
  start: number,
  duration: number,
  gain = 0.12,
  type: OscillatorType = "sine"
) {
  const ac = audioCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCorrect(): void {
  if (!isSoundEnabled()) return;
  // Bright ascending arpeggio.
  tone(523.25, 0, 0.16, 0.1, "triangle"); // C5
  tone(659.25, 0.09, 0.16, 0.1, "triangle"); // E5
  tone(783.99, 0.18, 0.22, 0.11, "triangle"); // G5
  haptic(18);
}

export function playWrong(): void {
  if (!isSoundEnabled()) return;
  // Soft low "thunk" - never harsh.
  tone(196, 0, 0.18, 0.09, "sine"); // G3
  tone(146.83, 0.08, 0.22, 0.08, "sine"); // D3
  haptic([22, 40, 22]);
}

export function playComplete(): void {
  if (!isSoundEnabled()) return;
  // Little fanfare.
  tone(523.25, 0, 0.18, 0.1, "triangle");
  tone(659.25, 0.12, 0.18, 0.1, "triangle");
  tone(783.99, 0.24, 0.18, 0.1, "triangle");
  tone(1046.5, 0.36, 0.34, 0.12, "triangle");
  haptic([15, 30, 15, 30, 25]);
}

export function playTap(): void {
  if (!isSoundEnabled()) return;
  tone(440, 0, 0.06, 0.05, "sine");
}

/** Vibrate if the device + browser support it. */
export function haptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
