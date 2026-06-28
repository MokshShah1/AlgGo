import type { ConceptId } from "@/types/concepts";
import type { MasteryRecord } from "@/types/mastery";
import type { ReviewSchedule } from "@/types/review";

/**
 * Spaced repetition (SM-2 / Leitner hybrid), per concept.
 *
 * Correct review  -> interval grows (1d, 3d, then x ease), ease nudges up.
 * Missed review   -> interval collapses to 1 day so it resurfaces sooner,
 *                    ease nudges down, lapse counted.
 *
 * Pure functions only; persistence lives in `@/services/reviewSchedule`.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EASE = 2.3;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const clampEase = (e: number) => Math.min(MAX_EASE, Math.max(MIN_EASE, e));

/** Apply one review outcome to a concept's schedule and return the next one. */
export function applyReview(
  prev: ReviewSchedule | null,
  conceptId: ConceptId,
  correct: boolean,
  now: number = Date.now()
): ReviewSchedule {
  const ease = prev?.ease ?? DEFAULT_EASE;
  const reps = prev?.reps ?? 0;
  const prevInterval = prev?.intervalDays ?? 0;
  const lapses = prev?.lapses ?? 0;

  if (!correct) {
    // Missed: bring it back tomorrow and make it a touch harder to "graduate".
    return {
      conceptId,
      intervalDays: 1,
      ease: clampEase(ease - 0.2),
      reps: 0,
      lapses: lapses + 1,
      lastReviewedAt: now,
      nextReviewAt: now + 1 * DAY_MS,
    };
  }

  // Correct: grow the interval.
  let nextInterval: number;
  let nextReps: number;
  if (reps <= 0) {
    nextInterval = 1;
    nextReps = 1;
  } else if (reps === 1) {
    nextInterval = 3;
    nextReps = 2;
  } else {
    nextInterval = Math.max(1, Math.round(prevInterval * ease));
    nextReps = reps + 1;
  }

  return {
    conceptId,
    intervalDays: nextInterval,
    ease: clampEase(ease + 0.1),
    reps: nextReps,
    lapses,
    lastReviewedAt: now,
    nextReviewAt: now + nextInterval * DAY_MS,
  };
}

/** A concept with no schedule yet, or whose due time has passed, is due. */
export function isDue(s: ReviewSchedule | null | undefined, now: number = Date.now()): boolean {
  return !s || s.nextReviewAt <= now;
}

/**
 * The set of concepts that should be reviewed right now.
 *
 * A concept counts as due when:
 *  - it has a schedule whose nextReviewAt has passed, OR
 *  - it has been introduced (a mastery record exists) but never scheduled and is
 *    still weak (needs review, or below "practicing").
 *
 * Concepts the learner has never touched are NOT surfaced.
 */
export function dueConceptIds(
  mastery: MasteryRecord[],
  schedules: ReviewSchedule[],
  now: number = Date.now()
): ConceptId[] {
  const bySchedule = new Map<ConceptId, ReviewSchedule>();
  for (const s of schedules) bySchedule.set(s.conceptId, s);

  const due = new Set<ConceptId>();

  for (const m of mastery) {
    const s = bySchedule.get(m.conceptId);
    if (s) {
      if (s.nextReviewAt <= now) due.add(m.conceptId);
    } else if (m.needsReview || m.level < 2) {
      due.add(m.conceptId);
    }
  }

  // Scheduled concepts without a mastery record (edge case): honor the schedule.
  for (const s of schedules) {
    if (!mastery.some((m) => m.conceptId === s.conceptId) && s.nextReviewAt <= now) {
      due.add(s.conceptId);
    }
  }

  return [...due];
}

/** Human-friendly "next review" label, e.g. "due now", "tomorrow", "in 5 days". */
export function formatNextReview(
  s: ReviewSchedule | null | undefined,
  now: number = Date.now()
): string {
  if (!s) return "due now";
  const diff = s.nextReviewAt - now;
  if (diff <= 0) return "due now";
  const days = Math.round(diff / DAY_MS);
  if (days <= 0) return "later today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
