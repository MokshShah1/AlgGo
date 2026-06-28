import type { ConceptId } from "@/types/concepts";

/**
 * Spaced-repetition schedule for one concept.
 *
 * Mirrors Firestore document `users/{uid}/reviewSchedule/{conceptId}`. A
 * lightweight SM-2 / Leitner hybrid: each correct review grows the interval,
 * each miss collapses it so the concept comes back sooner. Timestamps are plain
 * epoch milliseconds (not Firestore Timestamps) so the scheduling math stays
 * pure and easy to test.
 */
export interface ReviewSchedule {
  conceptId: ConceptId;
  /** Current spacing in days between reviews. */
  intervalDays: number;
  /** Ease factor (1.3 - 3.0); grows on success, shrinks on a miss. */
  ease: number;
  /** Consecutive correct reviews (resets to 0 on a miss). */
  reps: number;
  /** Lifetime number of misses (for analytics). */
  lapses: number;
  /** When this concept was last reviewed (epoch ms). */
  lastReviewedAt: number;
  /** When this concept is next due (epoch ms); due when <= now. */
  nextReviewAt: number;
}
