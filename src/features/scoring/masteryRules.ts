import type { MasteryLevel, MasteryRecord, MasteryUpdate } from "@/types/mastery";

/** Maps accumulated evidence to a mastery level (0-3). */
export function levelFromEvidence(evidence: number): MasteryLevel {
  if (evidence <= 0) return 0;
  if (evidence <= 2) return 1;
  if (evidence <= 5) return 2;
  return 3;
}

export interface MasteryEvidence {
  /** +2 first-try correct, +1 correct after a hint (per PRD section 13). */
  evidenceDelta: number;
  misconceptions: string[];
  /** True when the learner had repeated wrong attempts on this concept. */
  needsReview: boolean;
}

/**
 * Combines existing mastery with new evidence from a lesson session.
 * `forceLevel` lets the caller apply the "lesson complete with 80% success
 * marks slope-ratio mastered" rule.
 */
export function computeMasteryUpdate(
  current: MasteryRecord | null,
  evidence: MasteryEvidence,
  forceLevel?: MasteryLevel
): MasteryUpdate {
  const evidenceCount = Math.max(
    0,
    (current?.evidenceCount ?? 0) + evidence.evidenceDelta
  );
  const misconceptions = Array.from(
    new Set([...(current?.misconceptions ?? []), ...evidence.misconceptions])
  );

  let level = levelFromEvidence(evidenceCount);
  if (forceLevel !== undefined && forceLevel > level) {
    level = forceLevel;
  }

  const needsReview = level >= 3 ? false : evidence.needsReview || (current?.needsReview ?? false);

  return { level, evidenceCount, misconceptions, needsReview };
}
