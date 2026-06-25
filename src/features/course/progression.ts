import { course } from "@/content/course";
import type { LessonProgress } from "@/types/progress";
import type { UserProfile } from "@/types/user";

/** Fraction of a lesson's questions that must be correct to pass + unlock next. */
export const PASS_THRESHOLD = 0.8;

/** Map a placement score ratio (0-1) to the index of the lesson to start on. */
export function startIndexForRatio(ratio: number): number {
  const len = course.lessons.length;
  if (ratio < 0.4) return 0;
  if (ratio < 0.7) return Math.min(2, len - 1);
  return Math.min(4, len - 1);
}

/**
 * The lesson index the learner is placed at. The diagnostic (if taken) wins;
 * otherwise we seed a sensible starting point from the onboarding comfort level
 * so "I'm ready for a challenge" learners don't have to grind the basics.
 * Earlier lessons always remain unlocked/replayable regardless of the start.
 */
export function placementStartIndex(profile?: UserProfile | null): number {
  if (profile?.placementDone) {
    return startIndexForRatio((profile.placementScore ?? 0) / 100);
  }
  const len = course.lessons.length;
  switch (profile?.comfortLevel) {
    case "challenge":
      return Math.min(2, len - 1);
    case "confusing":
      return Math.min(1, len - 1);
    default:
      return 0;
  }
}

function isPassed(p: LessonProgress | undefined): boolean {
  // Legacy completions (saved before the pass gate existed) have no `passed`
  // field; treat those as passed so we never re-lock progress a learner already
  // made. New completions always write `passed` explicitly (true/false).
  return !!p && p.status === "completed" && (p.passed ?? true);
}

/**
 * The highest lesson index the learner may open. Lessons at index <= frontier
 * are unlocked.
 *
 * The frontier is the furthest of:
 *   - the placement start lesson (diagnostic / comfort level), and
 *   - one lesson past the HIGHEST lesson the learner has actually PASSED (>=80%).
 *
 * Using the highest pass (not a strict sequential walk) means lessons the
 * learner skipped via the initial placement never block progress: passing the
 * lesson you were placed into unlocks the next one even if some earlier lessons
 * were never completed. It still prevents real skipping, since you can only ever
 * reach one lesson beyond your highest pass (and earlier lessons stay replayable).
 */
export function unlockedThroughIndex(
  progressList: LessonProgress[],
  profile?: UserProfile | null
): number {
  const start = placementStartIndex(profile);
  let highestPassed = -1;
  for (const p of progressList) {
    if (!isPassed(p)) continue;
    const idx = course.lessons.findIndex((l) => l.id === p.lessonId);
    if (idx > highestPassed) highestPassed = idx;
  }
  const frontier = Math.max(start, highestPassed + 1);
  return Math.min(frontier, course.lessons.length - 1);
}

/** Index of a lesson within the course (or -1). */
export function lessonIndex(lessonId: string): number {
  return course.lessons.findIndex((l) => l.id === lessonId);
}

/** Whether a given lesson is currently unlocked for this learner. */
export function isLessonUnlocked(
  lessonId: string,
  progressList: LessonProgress[],
  profile?: UserProfile | null
): boolean {
  const idx = lessonIndex(lessonId);
  if (idx < 0) return false;
  return idx <= unlockedThroughIndex(progressList, profile);
}
