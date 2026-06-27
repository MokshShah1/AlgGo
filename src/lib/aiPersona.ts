/**
 * Named AI personas for AlgGo.
 *
 * AXIOM is the learner's AI coach/tutor (hints, explanations, recaps, chat).
 * Sammy is the AI rival on the leaderboard — a persistent competitor whose XP
 * tracks near the learner's and drifts upward over real time, so falling
 * inactive lets him pull ahead (motivation to come back).
 */

/** The AI coach/tutor's name, shown across every AI helper surface. */
export const AI_NAME = "AXIOM";

/** Short descriptor used under the name where helpful. */
export const AI_TAGLINE = "AI coach";

/** The AI rival's display name + avatar. */
export const RIVAL_NAME = "Sammy";
export const RIVAL_AVATAR = "/rival.png";

/** XP the rival earns per real hour of the learner being away. */
const RIVAL_RATE_PER_HOUR = 9;

/** Re-anchor the rival just behind the learner once they pull this far ahead. */
const RIVAL_CATCHUP_MARGIN = 25;
const RIVAL_TRAIL_BEHIND = 12;

interface RivalAnchor {
  anchorXp: number;
  anchorAt: number;
}

function storageKey(scope: string) {
  return `alggo.rival.${scope}.v1`;
}

function readAnchor(scope: string): RivalAnchor | null {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RivalAnchor;
    if (typeof parsed.anchorXp === "number" && typeof parsed.anchorAt === "number") {
      return parsed;
    }
  } catch {
    /* ignore malformed/unavailable storage */
  }
  return null;
}

function writeAnchor(scope: string, anchor: RivalAnchor) {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(anchor));
  } catch {
    /* storage may be unavailable (private mode) — feature still works in-memory */
  }
}

export interface RivalStanding {
  /** The rival's current XP for this scope. */
  xp: number;
  /** True when the rival is ahead of the learner. */
  ahead: boolean;
  /** Absolute XP gap between rival and learner. */
  diff: number;
}

/**
 * Compute the rival's XP for a scope. Persists an anchor so the value keeps
 * climbing over real time and re-anchors just behind the learner whenever they
 * surge ahead — keeping the race close and motivating.
 */
export function rivalStanding(userXp: number, scope = "all"): RivalStanding {
  const now = Date.now();
  let anchor = readAnchor(scope);

  if (!anchor) {
    // Start a touch behind so the learner feels ahead on first sight.
    anchor = { anchorXp: Math.max(0, Math.round(userXp * 0.85) - 5), anchorAt: now };
  }

  const hours = Math.max(0, (now - anchor.anchorAt) / 3_600_000);
  let xp = Math.round(anchor.anchorXp + RIVAL_RATE_PER_HOUR * hours);

  if (userXp > xp + RIVAL_CATCHUP_MARGIN) {
    anchor = { anchorXp: Math.max(0, userXp - RIVAL_TRAIL_BEHIND), anchorAt: now };
    xp = anchor.anchorXp;
  }

  writeAnchor(scope, anchor);

  return { xp, ahead: xp > userXp, diff: Math.abs(xp - userXp) };
}
