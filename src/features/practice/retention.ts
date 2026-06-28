import type { Attempt } from "@/types/attempt";

/**
 * Retention / remediation metrics derived from the attempt log.
 *
 * This is how we *show the effect* of the learning-science layer: it measures
 * whether spaced, interleaved review is actually turning misses into mastery.
 */
export interface RetentionStats {
  /** Distinct steps the learner has attempted at least once. */
  totalSteps: number;
  /** Fraction (0-1) of steps answered correctly on the very first attempt. */
  firstTryRate: number;
  /** Steps that were missed at least once. */
  missedSteps: number;
  /** Missed steps that were later answered correctly (recovered). */
  recoveredSteps: number;
  /** Fraction (0-1) of missed steps that were later recovered. */
  recoveredRate: number;
}

export function computeRetention(attempts: Attempt[]): RetentionStats {
  // Group attempts per step, ordered oldest -> newest.
  const byStep = new Map<string, Attempt[]>();
  for (const a of attempts) {
    const list = byStep.get(a.stepId) ?? [];
    list.push(a);
    byStep.set(a.stepId, list);
  }

  let firstTryCorrect = 0;
  let missed = 0;
  let recovered = 0;

  for (const list of byStep.values()) {
    const ordered = [...list].sort(
      (a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)
    );
    if (ordered[0]?.isCorrect) firstTryCorrect++;

    const everWrong = ordered.some((a) => !a.isCorrect);
    if (everWrong) {
      missed++;
      // Recovered if any attempt that comes after a wrong one is correct.
      let seenWrong = false;
      for (const a of ordered) {
        if (!a.isCorrect) seenWrong = true;
        else if (seenWrong) {
          recovered++;
          break;
        }
      }
    }
  }

  const totalSteps = byStep.size;
  return {
    totalSteps,
    firstTryRate: totalSteps ? firstTryCorrect / totalSteps : 0,
    missedSteps: missed,
    recoveredSteps: recovered,
    recoveredRate: missed ? recovered / missed : 0,
  };
}
