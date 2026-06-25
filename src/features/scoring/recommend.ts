import { course } from "@/content/course";
import { unlockedThroughIndex } from "@/features/course/progression";
import type { LessonProgress } from "@/types/progress";
import type { MasteryRecord } from "@/types/mastery";
import type { UserProfile } from "@/types/user";

export type RecommendationKind = "continue" | "next" | "review" | "start";

export interface Recommendation {
  kind: RecommendationKind;
  lessonId: string;
  title: string;
  reason: string;
  cta: string;
  /** Whether the target lesson can actually be played. */
  playable: boolean;
}

/**
 * Next-step recommendation across the whole chapter:
 * - resume an in-progress lesson
 * - otherwise start the first lesson not yet begun
 * - if everything is done but a concept needs review, recommend reviewing it
 * - if everything is mastered, suggest revisiting the chapter
 */
export function recommend(
  progressList: LessonProgress[],
  masteryList: MasteryRecord[],
  profile?: UserProfile | null
): Recommendation {
  const progressById = new Map(progressList.map((p) => [p.lessonId, p]));

  // The frontier is the current unlocked target lesson. It's the first lesson
  // (from the placement start) that hasn't been passed yet.
  const frontier = unlockedThroughIndex(progressList, profile);
  const frontierLesson = course.lessons[frontier];
  const frontierProgress = progressById.get(frontierLesson.id);
  const frontierPassed =
    frontierProgress?.status === "completed" && frontierProgress.passed === true;
  const isLast = frontier === course.lessons.length - 1;

  // The frontier lesson still needs work (not yet passed) -> point them there.
  if (!frontierPassed) {
    if (frontierProgress?.status === "in_progress") {
      return {
        kind: "continue",
        lessonId: frontierLesson.id,
        title: frontierLesson.title,
        reason: "Pick up right where you left off.",
        cta: "Continue",
        playable: true,
      };
    }
    if (frontierProgress?.status === "completed") {
      return {
        kind: "next",
        lessonId: frontierLesson.id,
        title: frontierLesson.title,
        reason: "Score 80% on this lesson to unlock the next one.",
        cta: "Retry",
        playable: true,
      };
    }
    const anyCompleted = progressList.some((p) => p.status === "completed");
    return {
      kind: anyCompleted ? "next" : "start",
      lessonId: frontierLesson.id,
      title: frontierLesson.title,
      reason: anyCompleted
        ? "You're ready for the next idea in the chapter."
        : "Start with the first idea behind a straight line.",
      cta: "Start",
      playable: true,
    };
  }

  // The frontier (last unlocked) lesson is passed but it's not the final one:
  // surface the freshly unlocked next lesson.
  if (!isLast) {
    const next = course.lessons[frontier + 1];
    return {
      kind: "next",
      lessonId: next.id,
      title: next.title,
      reason: "Nice - you unlocked the next lesson.",
      cta: "Start",
      playable: true,
    };
  }

  const playable = course.lessons
    .filter((l) => l.availability === "playable")
    .sort((a, b) => a.order - b.order);

  // Everything is completed.
  const review = masteryList.find((m) => m.needsReview && m.level < 3);
  if (review) {
    const flagship =
      playable.find((l) => l.id === "slope-rise-run") ?? playable[0];
    return {
      kind: "review",
      lessonId: flagship.id,
      title: `Review: ${flagship.title}`,
      reason: "A quick review will lock in a concept you stumbled on.",
      cta: "Review",
      playable: true,
    };
  }

  const first = playable[0];
  return {
    kind: "next",
    lessonId: first.id,
    title: "You finished the chapter!",
    reason: "Every lesson is complete. Revisit any lesson to keep it sharp.",
    cta: "Review",
    playable: true,
  };
}
