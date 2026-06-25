import type { Attempt } from "@/types/attempt";
import type { MasteryRecord } from "@/types/mastery";
import type { ConceptId } from "@/types/concepts";
import { buildPool } from "@/features/quiz/pool";

/**
 * Count how many pool items are genuinely "due" for review.
 *
 * This mirrors the prioritisation signals in `buildReviewQueue`
 * (`@/features/practice/reviewQueue`) — low mastery / needs-review concepts and
 * recently missed steps — but ignores its difficulty tie-breaker so that only
 * items with a real review need are counted (the queue adds a tiny difficulty
 * weight to *every* item, which we deliberately exclude here).
 *
 * Result is capped at `cap` (the review queue's default session size) so the
 * dashboard surfaces "a full session's worth" rather than an alarming total.
 */
export function countReviewsDue(
  mastery: MasteryRecord[],
  attempts: Attempt[],
  cap = 8
): number {
  const conceptWeight = new Map<ConceptId, number>();
  for (const m of mastery) {
    let w = Math.max(0, 3 - m.level); // lower mastery => higher weight
    if (m.needsReview) w += 2;
    if (w > 0) conceptWeight.set(m.conceptId, w);
  }

  // Recent wrong answers by step, decaying so the latest mistakes weigh most.
  const wrongByStep = new Map<string, number>();
  const sorted = [...attempts].sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );
  sorted.slice(0, 60).forEach((a, i) => {
    if (a.isCorrect) return;
    const decay = 1 - i / 80;
    wrongByStep.set(a.stepId, (wrongByStep.get(a.stepId) ?? 0) + 3 * decay);
  });

  let due = 0;
  for (const item of buildPool()) {
    let score = 0;
    for (const c of item.solvable.concepts) score += conceptWeight.get(c) ?? 0;
    score += wrongByStep.get(item.solvable.id) ?? 0;
    if (score > 0) due++;
  }
  return Math.min(due, cap);
}
