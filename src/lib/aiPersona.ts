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

import { currentWeekKey } from "@/lib/week";

/** XP the rival earns per real hour of the learner being away. */
const RIVAL_RATE_PER_HOUR = 9;

/** Re-anchor the rival just behind the learner once they pull this far ahead. */
const RIVAL_CATCHUP_MARGIN = 25;
const RIVAL_TRAIL_BEHIND = 12;

interface RivalAnchor {
  anchorXp: number;
  anchorAt: number;
  /** ISO week the anchor belongs to (weekly scope only); resets on rollover. */
  weekKey?: string;
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
 * surge ahead — keeping the race close and motivating. The weekly scope resets
 * at the start of each ISO week, mirroring how every learner's weekly XP rolls
 * over (otherwise Sammy's "this week" would accumulate forever).
 */
export function rivalStanding(userXp: number, scope = "all"): RivalStanding {
  const now = Date.now();
  const weekKey = scope === "week" ? currentWeekKey() : undefined;
  let anchor = readAnchor(scope);

  // New week -> drop last week's weekly anchor so Sammy's weekly XP resets too.
  if (anchor && scope === "week" && anchor.weekKey !== weekKey) {
    anchor = null;
  }

  if (!anchor) {
    // Start a touch behind so the learner feels ahead on first sight.
    anchor = {
      anchorXp: Math.max(0, Math.round(userXp * 0.85) - 5),
      anchorAt: now,
      weekKey,
    };
  }

  const hours = Math.max(0, (now - anchor.anchorAt) / 3_600_000);
  let xp = Math.round(anchor.anchorXp + RIVAL_RATE_PER_HOUR * hours);

  if (userXp > xp + RIVAL_CATCHUP_MARGIN) {
    anchor = { anchorXp: Math.max(0, userXp - RIVAL_TRAIL_BEHIND), anchorAt: now, weekKey };
    xp = anchor.anchorXp;
  }

  writeAnchor(scope, anchor);

  return { xp, ahead: xp > userXp, diff: Math.abs(xp - userXp) };
}

/**
 * Sammy's standing for BOTH scopes at once, enforcing the obvious invariant
 * that you can't have earned more XP *this week* than *all time*. Without this,
 * the two independently-anchored values could drift so that weekly > all-time,
 * which makes no sense to a learner.
 */
export function rivalStandings(
  userTotalXp: number,
  userWeeklyXp: number
): { all: RivalStanding; week: RivalStanding } {
  const all = rivalStanding(userTotalXp, "all");
  const weekRaw = rivalStanding(userWeeklyXp, "week");
  const weekXp = Math.min(weekRaw.xp, all.xp);
  const week: RivalStanding = {
    xp: weekXp,
    ahead: weekXp > userWeeklyXp,
    diff: Math.abs(weekXp - userWeeklyXp),
  };
  return { all, week };
}
