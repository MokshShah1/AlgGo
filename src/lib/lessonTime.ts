import type { Lesson } from "@/types/lesson";
import type { LessonProgress } from "@/types/progress";

/** Rough authoring assumption: a learner clears ~2 solvables per minute. */
const MINUTES_PER_SOLVABLE = 0.5;

/**
 * Estimate how long a full lesson takes, ~0.5 min per solvable, with a 2-minute
 * floor so even tiny lessons read sensibly. Prefers an authored
 * `estimatedMinutes` when the content provides one.
 */
export function estimateLessonMinutes(lesson: Lesson): number {
  if (lesson.estimatedMinutes && lesson.estimatedMinutes > 0) {
    return lesson.estimatedMinutes;
  }
  const count = lesson.solvables.length;
  return Math.max(2, Math.ceil(count * MINUTES_PER_SOLVABLE));
}

/**
 * Estimate the time left in a lesson the learner already started, based on how
 * many steps they've completed. Falls back to the full estimate when there's no
 * progress yet. Floored at 1 minute while any steps remain.
 */
export function remainingMinutes(
  lesson: Lesson,
  progress?: LessonProgress | null
): number {
  const total = lesson.solvables.length;
  if (!progress || progress.status === "not_started") {
    return estimateLessonMinutes(lesson);
  }
  // Use whichever signal implies the furthest progress through the lesson.
  const done = Math.min(
    total,
    Math.max(progress.completedStepIds?.length ?? 0, progress.currentStepIndex ?? 0)
  );
  const remaining = Math.max(0, total - done);
  if (remaining === 0) return 1;
  return Math.max(1, Math.ceil(remaining * MINUTES_PER_SOLVABLE));
}
