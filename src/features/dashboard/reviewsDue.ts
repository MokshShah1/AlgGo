import type { Attempt } from "@/types/attempt";
import type { MasteryRecord } from "@/types/mastery";
import type { ConceptId } from "@/types/concepts";
import type { ReviewSchedule } from "@/types/review";
import { buildPool } from "@/features/quiz/pool";
import { dueConceptIds } from "@/features/practice/spacedRepetition";

/**
 * Count how many pool items are genuinely "due" for review right now.
 *
 * Due-ness is driven by the spaced-repetition schedule (concepts whose
 * nextReviewAt has passed) plus weak/needs-review concepts that haven't been
 * scheduled yet, and recently missed steps. Capped at `cap` (a session's worth)
 * so the dashboard surfaces "a full session" rather than an alarming total.
 */
export function countReviewsDue(
  mastery: MasteryRecord[],
  attempts: Attempt[],
  schedules: ReviewSchedule[] = [],
  cap = 8
): number {
  const due = new Set<ConceptId>(dueConceptIds(mastery, schedules));

  // Recently missed steps still count even if their concept isn't "due" yet.
  const wrongSteps = new Set<string>();
  const sorted = [...attempts].sort(
    (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
  );
  sorted.slice(0, 60).forEach((a) => {
    if (!a.isCorrect) wrongSteps.add(a.stepId);
  });

  let count = 0;
  for (const item of buildPool()) {
    const conceptDue = item.solvable.concepts.some((c) => due.has(c));
    if (conceptDue || wrongSteps.has(item.solvable.id)) count++;
  }
  return Math.min(count, cap);
}
