import type { Course, Lesson } from "@/types/lesson";
import { constantRateChangeLesson } from "@/content/constantRateChange";
import { slopeRiseRunLesson } from "@/content/slopeRiseRun";
import { slopeFromTwoPointsLesson } from "@/content/slopeFromTwoPoints";
import { positiveNegativeSlopeLesson } from "@/content/positiveNegativeSlope";
import { yInterceptLesson } from "@/content/yIntercept";
import { slopeInterceptFormLesson } from "@/content/slopeInterceptForm";
import { proportionalRelationshipsLesson } from "@/content/proportionalRelationships";
import { matchRepresentationsLesson } from "@/content/matchRepresentations";
import { realWorldLinesLesson } from "@/content/realWorldLines";
import { MASTERY_CHECKS } from "@/content/masteryChecks";

/** Append the hard mastery-check questions to the end of each lesson. */
function withMasteryChecks(lesson: Lesson): Lesson {
  const extra = MASTERY_CHECKS[lesson.id];
  if (!extra || extra.length === 0) return lesson;
  return { ...lesson, solvables: [...lesson.solvables, ...extra] };
}

/**
 * The full chapter path. All nine lessons are fully playable, ordered from the
 * intuition of constant rate through real-world modeling with y = mx + b. Each
 * lesson ends with a couple of hard "mastery check" questions (see
 * masteryChecks.ts) so passing really means you've got it.
 */
export const course: Course = {
  id: "linear-relationships",
  title: "Linear Relationships: Slope & Graphing Lines",
  subtitle: "8th Grade Algebra",
  lessons: [
    constantRateChangeLesson,
    slopeRiseRunLesson,
    slopeFromTwoPointsLesson,
    positiveNegativeSlopeLesson,
    yInterceptLesson,
    slopeInterceptFormLesson,
    proportionalRelationshipsLesson,
    matchRepresentationsLesson,
    realWorldLinesLesson,
  ].map(withMasteryChecks),
};

export function getLesson(lessonId: string): Lesson | undefined {
  return course.lessons.find((lesson) => lesson.id === lessonId);
}

export function getLessonByOrder(order: number): Lesson | undefined {
  return course.lessons.find((lesson) => lesson.order === order);
}

/** The next lesson after the given one, by order (undefined if last). */
export function getNextLesson(lessonId: string): Lesson | undefined {
  const current = getLesson(lessonId);
  if (!current) return undefined;
  return getLessonByOrder(current.order + 1);
}

/** Total solvable count for a lesson - used for progress bars and XP math. */
export function getSolvableCount(lessonId: string): number {
  return getLesson(lessonId)?.solvables.length ?? 0;
}
