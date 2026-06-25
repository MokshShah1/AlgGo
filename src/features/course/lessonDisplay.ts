import type { Lesson } from "@/types/lesson";
import type { LessonProgress } from "@/types/progress";

export type LessonTone =
  | "completed"
  | "in-progress"
  | "recommended"
  | "start"
  | "locked"
  | "preview";

export interface LessonDisplay {
  tone: LessonTone;
  badge: string;
  cta: string | null;
  to: string | null;
}

/** Combines authoring availability with the learner's progress for display. */
export function getLessonDisplay(
  lesson: Lesson,
  progressList: LessonProgress[],
  recommendedLessonId?: string,
  locked = false
): LessonDisplay {
  if (lesson.availability === "preview") {
    return { tone: "preview", badge: "Intro", cta: null, to: null };
  }

  if (lesson.availability === "coming-soon") {
    return { tone: "locked", badge: "Coming soon", cta: null, to: null };
  }

  const progress = progressList.find((p) => p.lessonId === lesson.id);
  const to = `/lesson/${lesson.id}`;

  // Completed lessons stay reviewable even when later lessons are locked.
  if (progress?.status === "completed") {
    if (progress.passed === false) {
      return { tone: "in-progress", badge: "Retry to pass", cta: "Retry", to };
    }
    return { tone: "completed", badge: "Completed", cta: "Review", to };
  }

  // Sequential lock: not yet reachable.
  if (locked) {
    return { tone: "locked", badge: "Locked", cta: null, to: null };
  }

  if (progress?.status === "in_progress") {
    return { tone: "in-progress", badge: "In progress", cta: "Continue", to };
  }
  if (recommendedLessonId === lesson.id) {
    return { tone: "recommended", badge: "Recommended", cta: "Start", to };
  }
  return { tone: "start", badge: "Start", cta: "Start", to };
}
