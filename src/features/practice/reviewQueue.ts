import type { Attempt } from "@/types/attempt";
import type { MasteryRecord } from "@/types/mastery";
import type { ConceptId } from "@/types/concepts";
import { buildPool, itemDifficulty, type PoolItem } from "@/features/quiz/pool";

/**
 * Build a spaced-repetition practice queue: surface the learner's weakest and
 * most-recently-missed material first. Priority blends mastery level,
 * needs-review flags, and how often a specific step was answered wrong.
 */
export function buildReviewQueue(
  mastery: MasteryRecord[],
  attempts: Attempt[],
  max = 8
): PoolItem[] {
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

  const pool = buildPool();
  const scored = pool.map((item) => {
    let score = 0;
    for (const c of item.solvable.concepts) score += conceptWeight.get(c) ?? 0;
    score += wrongByStep.get(item.solvable.id) ?? 0;
    // Tiny preference for harder items when scores tie (productive struggle).
    score += itemDifficulty(item) * 0.05;
    return { item, score };
  });

  const weak = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item);

  if (weak.length >= max) return weak.slice(0, max);

  // Top up with a spread of other questions so the session is always full.
  const chosen = new Set(weak.map((i) => i.solvable.id));
  const filler = pool
    .filter((i) => !chosen.has(i.solvable.id))
    .sort(() => Math.random() - 0.5);
  return [...weak, ...filler].slice(0, max);
}
